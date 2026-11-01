import { expect, test } from "@playwright/test";

import {
  expectStatus,
  login,
  OWNER,
  PNG_1X1,
  uniqueSuffix,
  visibleText,
} from "./helpers";

// Fluxo crítico do Brain §38, no navegador, contra o Supabase LOCAL:
// login → categoria/família → produto → variante com preço → imagem → publicar
// → página pública → editar preço (cache invalidado) → despublicar → sair.
test("OWNER cadastra, publica, edita e despublica um produto sem tocar em código", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const categoryName = `Linha E2E ${suffix}`;
  const productName = `Produto E2E ${suffix}`;
  const productSlug = `produto-e2e-${suffix}`;

  await login(page, OWNER);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Categoria (ativa) e família.
  await page
    .getByRole("navigation", { name: "Painel" })
    .getByRole("link", { name: "Categorias" })
    .click();
  await page.getByRole("button", { name: "Nova categoria" }).click();
  const categoryDialog = page.getByRole("dialog", { name: "Nova categoria" });
  await categoryDialog.getByLabel("Nome").fill(categoryName);
  await categoryDialog
    .getByLabel("Endereço (slug)")
    .fill(`linha-e2e-${suffix}`);
  await categoryDialog.getByLabel("Ativa (aparece no site)").check();
  await categoryDialog.getByRole("button", { name: "Criar categoria" }).click();
  const categoryCard = page
    .locator("li")
    .filter({ has: page.getByRole("heading", { name: categoryName }) });
  await expect(categoryCard).toBeVisible();
  await categoryCard.getByRole("button", { name: "Nova família" }).click();
  const familyDialog = page.getByRole("dialog", { name: "Nova família" });
  await familyDialog.getByLabel("Nome").fill("Família E2E");
  await familyDialog.getByRole("button", { name: "Criar família" }).click();
  await expect(categoryCard.getByText("Família E2E")).toBeVisible();

  // Produto novo nasce rascunho e abre na aba Comercial.
  await page.goto("/admin/produtos/novo");
  await page.getByLabel("Nome").fill(productName);
  await page.getByLabel("Categoria").selectOption({ label: categoryName });
  await page.getByLabel("Família").selectOption({ label: "Família E2E" });
  await page.getByRole("button", { name: "Criar rascunho" }).click();
  await page.waitForURL(/\/admin\/produtos\/[0-9a-f-]{36}\?aba=comercial/);
  const editorUrl = page.url().split("?")[0] ?? "";

  // Pendências aparecem ANTES de publicar; Publicar desabilitado.
  const publication = page.getByRole("region", { name: "Publicação" });
  await expect(
    publication.getByText("Cadastre ao menos uma variante visível."),
  ).toBeVisible();
  await expect(
    publication.getByText("Defina a imagem principal."),
  ).toBeVisible();
  await expect(
    publication.getByRole("button", { name: "Publicar" }),
  ).toBeDisabled();

  // Variante com preço, parcelamento e disponibilidade (com prévia ao vivo).
  await page.goto(`${editorUrl}?aba=variantes`);
  await page.getByRole("button", { name: "Nova variante" }).click();
  const variantDialog = page.getByRole("dialog", { name: "Nova variante" });
  await variantDialog.getByLabel("Capacidade").fill("256 GB");
  await variantDialog.getByLabel("Cor", { exact: true }).fill("Preto");
  await variantDialog.getByLabel("Preço à vista (R$)").fill("8.999,00");
  await variantDialog.getByLabel("Parcelas").fill("18");
  await variantDialog.getByLabel("Valor da parcela (R$)").fill("549,90");
  await expect(
    variantDialog.getByLabel("Pré-visualização do preço"),
  ).toContainText("ou 18x de R$");
  await variantDialog.getByRole("button", { name: "Criar variante" }).click();
  await expect(
    page.getByRole("table", { name: "Variantes do produto" }),
  ).toContainText("256 GB / Preto");

  // Imagem principal: envio verificado (preparar → Storage → conferir).
  await page.goto(`${editorUrl}?aba=midia`);
  await page.getByRole("button", { name: "Escolher imagem" }).first().click();
  const picker = page.getByRole("dialog", { name: "Escolher imagem" });
  await picker.getByRole("button", { name: "Enviar novo arquivo" }).click();
  await picker.getByLabel("Arquivo").setInputFiles({
    name: "produto.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await picker.getByLabel("Texto alternativo").fill(`${productName} de frente`);
  await picker.getByRole("button", { name: "Enviar arquivo" }).click();
  await expect(
    page.getByRole("img", { name: `${productName} de frente` }).first(),
  ).toBeVisible();

  // Sem pendências: publicar.
  await expect(
    publication.getByText("Pronto para publicar: nenhuma pendência."),
  ).toBeVisible();
  await publication.getByRole("button", { name: "Publicar" }).click();
  await expect(publication.getByText("Aparece no site.")).toBeVisible();

  // Página pública mostra preço, parcelamento, disponibilidade e WhatsApp.
  await page.goto(`/produto/${productSlug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: productName }),
  ).toBeVisible();
  let text = await visibleText(page);
  expect(text).toContain("R$ 8.999");
  expect(text).toContain("ou 18x de R$ 549,90");
  expect(text).toContain("Disponível");
  await expect(
    page.getByRole("link", { name: /Consultar no WhatsApp/ }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\//);

  // Edição no painel → banco → invalidação → página pública atualizada, sem deploy.
  await page.goto(`${editorUrl}?aba=comercial`);
  await page.getByLabel("Preço à vista (R$)").fill("7.999,00");
  await page.getByRole("button", { name: "Salvar comercial" }).click();
  await expectStatus(page, "Alterações salvas.");
  await page.goto(`/produto/${productSlug}`);
  text = await visibleText(page);
  expect(text).toContain("R$ 7.999");
  expect(text).not.toContain("R$ 8.999");

  // Despublicar (com confirmação): some do site.
  await page.goto(editorUrl);
  await publication.getByRole("button", { name: "Despublicar" }).click();
  await page
    .getByRole("dialog", { name: "Despublicar produto?" })
    .getByRole("button", { name: "Despublicar" })
    .click();
  await expect(publication.getByText("Não aparece no site.")).toBeVisible();
  await page.goto(`/produto/${productSlug}`);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();

  // Sair encerra a sessão.
  await page.goto("/admin/dashboard");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL(/\/admin\/login$/);
  await page.goto("/admin/dashboard");
  await page.waitForURL(/\/admin\/login$/);
});
