import { expect, type Page, test } from "@playwright/test";

import { CONTENT_EDITOR, login, OWNER, uniqueSuffix } from "./helpers";

// Site público da Etapa 05 contra o Supabase LOCAL e o seed (MDI-D029).

function whatsappMessage(href: string | null): string {
  return decodeURIComponent(href?.split("text=")[1] ?? "");
}

async function mainText(page: Page): Promise<string> {
  return (await page.locator("main").innerText()).replace(/ /g, " ");
}

test("Home monta os blocos do painel com temas claro e escuro", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(
    page.getByRole("heading", { level: 1, name: "Hero de teste" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Lançamentos de teste" }),
  ).toBeVisible();
  await expect(page.locator('[data-motion-scene="hero"]')).toHaveAttribute(
    "data-motion-mode",
    "enhanced",
  );
  await expect(
    page.getByRole("link", { name: /Produto com variantes/ }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Linhas Apple" }),
  ).toBeVisible();
  await expect(page.getByText("Rua Fictícia, 100").first()).toBeVisible();

  // Temas por seção: o hero do seed é escuro; o rodapé também.
  await expect(
    page.locator('section[data-theme="dark"]').first(),
  ).toBeVisible();
  await expect(page.locator('footer[data-theme="dark"]')).toBeVisible();

  // Botão de WhatsApp do hero leva o produto na mensagem.
  const heroWhatsApp = page
    .getByRole("region", { name: "Hero de teste" })
    .getByRole("link", { name: /Falar no WhatsApp/ });
  expect(whatsappMessage(await heroWhatsApp.getAttribute("href"))).toContain(
    "Produto com variantes",
  );

  // Cabeçalho: linhas Apple, lançamentos e contato; rodapé com copyright.
  const header = page.getByRole("navigation", { name: "Principal" });
  await expect(header.getByRole("link", { name: "Mac" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Lançamentos" })).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByText(/Todos os direitos reservados/),
  ).toBeVisible();
});

test("header reage ao scroll sem desaparecer", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  await expect(header).not.toHaveAttribute("data-scrolled", "true");

  await page.evaluate(() => window.scrollTo(0, 900));
  await expect(header).toHaveAttribute("data-scrolled", "true");
  await expect(
    header.getByRole("link", { name: "Moça do iPhone" }),
  ).toBeVisible();
});

test("movimento reduzido remove scrub, parallax e pinning", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Hero de teste" }),
  ).toBeVisible();
  await expect(page.locator('[data-motion-scene="hero"]')).toHaveAttribute(
    "data-motion-mode",
    "reduced",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Falar no WhatsApp/ }).first(),
  ).toBeVisible();
});

test("categoria agrupa por família e trata categoria vazia", async ({
  page,
}) => {
  const response = await page.goto("/mac");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Mac" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Família de teste Mac" }),
  ).toBeVisible();
  const text = await mainText(page);
  expect(text).toContain("A partir de");
  expect(text).toContain("R$ 8.999");
  // O selo aparece em caixa alta (CSS); o texto do painel é "Novo".
  expect(text.toLowerCase()).toContain("novo");

  await page.goto("/vision-pro");
  await expect(
    page.getByText("Ainda não há produtos de Vision Pro no site."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Visite a loja" }).first(),
  ).toBeVisible();
});

test("produto: variante muda preço, disponibilidade e mensagem do WhatsApp", async ({
  page,
}) => {
  const response = await page.goto("/produto/produto-com-variantes");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Produto com variantes" }),
  ).toBeVisible();

  let text = await mainText(page);
  expect(text).toContain("R$ 8.999");
  expect(text).toContain("ou 18x de R$ 549,90");
  expect(text).toContain("Disponível");
  const cta = page.getByRole("link", { name: /Consultar no WhatsApp/ });
  expect(whatsappMessage(await cta.getAttribute("href"))).toBe(
    "Olá! Vi no site da Moça do iPhone o Produto com variantes 256 GB Preto e gostaria de consultar disponibilidade e valor.",
  );

  // 512 GB só existe em Preto e está sob encomenda.
  await page
    .locator("label")
    .filter({ hasText: /^512 GB/ })
    .click();
  await expect(page.getByText("Sob encomenda")).toBeVisible();
  text = await mainText(page);
  expect(text).toContain("R$ 10.499");
  expect(whatsappMessage(await cta.getAttribute("href"))).toContain(
    "Produto com variantes 512 GB Preto",
  );

  // Branco não existe em 512 GB: a capacidade muda junto.
  await page
    .locator("label")
    .filter({ hasText: /^Branco/ })
    .click();
  await expect(
    page.getByText("Opção escolhida: 256 GB / Branco"),
  ).toBeVisible();
  expect(whatsappMessage(await cta.getAttribute("href"))).toContain(
    "256 GB Branco",
  );

  // Especificações e detalhes.
  await expect(
    page.getByRole("heading", { name: "Especificações" }),
  ).toBeVisible();
  await expect(page.getByText("14 polegadas (fictício)")).toBeVisible();
});

test("404 real para página inexistente e produto não publicado", async ({
  request,
}) => {
  for (const path of [
    "/produto/nao-existe",
    "/produto/produto-de-teste",
    "/linha-inexistente",
    "/a/b/c",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(await response.text()).toContain("Página não encontrada");
  }
  expect(
    (await request.get("/produto/produto-de-teste-publicado")).status(),
  ).toBe(200);
});

test("ofertas, lançamentos e loja física", async ({ page }) => {
  await page.goto("/lancamentos");
  await expect(
    page.getByRole("heading", { level: 1, name: "Lançamentos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Produto com variantes" }),
  ).toBeVisible();

  await page.goto("/ofertas");
  await expect(page.getByText("Nenhuma oferta no momento.")).toBeVisible();

  await page.goto("/loja");
  await expect(
    page.getByRole("heading", { level: 1, name: "Loja de teste" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Segunda a sábado"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Como chegar/ })).toHaveAttribute(
    "href",
    "https://maps.apple.com/?q=loja-de-teste",
  );
});

test("alteração da Home no painel aparece no site (CONTENT_EDITOR)", async ({
  page,
}) => {
  const newTitle = `Hero editado ${uniqueSuffix()}`;
  await login(page, CONTENT_EDITOR);
  await page.goto("/admin/home");
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();

  const item = page.getByRole("listitem").filter({ hasText: "Hero de teste" });
  await item.getByRole("button", { name: "Editar" }).click();
  const dialog = page.getByRole("dialog", { name: /Editar bloco: Hero/ });
  await dialog.getByLabel(/^Título/).fill(newTitle);
  await dialog.getByRole("button", { name: "Salvar bloco" }).click();
  await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: newTitle }),
  ).toBeVisible();

  // Restaura o seed.
  await page.goto("/admin/home");
  await page
    .getByRole("listitem")
    .filter({ hasText: newTitle })
    .getByRole("button", { name: "Editar" })
    .click();
  await page
    .getByRole("dialog", { name: /Editar bloco: Hero/ })
    .getByLabel(/^Título/)
    .fill("Hero de teste");
  await page
    .getByRole("dialog", { name: /Editar bloco: Hero/ })
    .getByRole("button", { name: "Salvar bloco" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hero de teste" }),
  ).toBeVisible();
});

test("loja física editada em Configurações aparece no site (OWNER)", async ({
  page,
}) => {
  const name = `Loja editada ${uniqueSuffix()}`;
  await login(page, OWNER);
  await page.goto("/admin/configuracoes");
  const form = page.getByRole("region", { name: "Loja física" });
  await form.getByLabel("Nome da loja").fill(name);
  await form.getByRole("button", { name: "Salvar loja física" }).click();
  await expect(form.getByText("Loja física salva.")).toBeVisible();

  await page.goto("/loja");
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

  await page.goto("/admin/configuracoes");
  await form.getByLabel("Nome da loja").fill("Loja de teste");
  await form.getByRole("button", { name: "Salvar loja física" }).click();
  await expect(form.getByText("Loja física salva.")).toBeVisible();
});
