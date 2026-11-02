import { expect, test } from "@playwright/test";

import { login, OWNER } from "./helpers";

// Painel utilizável em tela pequena: menu recolhível e lista de produtos.
test("no celular, o menu abre e leva à lista de produtos", async ({ page }) => {
  await login(page, OWNER);
  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await page
    .getByRole("navigation", { name: "Painel" })
    .getByRole("link", { name: "Produtos" })
    .click();
  await expect(page.getByRole("heading", { name: "Produtos" })).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Lista de produtos" }),
  ).toBeVisible();
});

// Site público no celular (Brain §28): composição própria, menu e CTA fixo.
test("no celular, o site abre o menu, navega e mantém o WhatsApp à mão", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Hero de teste" }),
  ).toBeVisible();
  // Nada de rolagem horizontal da página.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  // Navegação completa fica no menu (dialog modal com foco preso).
  await expect(
    page.getByRole("navigation", { name: "Principal" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Mac" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Mac" }),
  ).toBeVisible();
  await expect(menu).toBeHidden();

  // Produto: barra fixa com preço e WhatsApp da variante.
  await page.goto("/produto/produto-com-variantes");
  const bar = page.getByRole("link", { name: /^WhatsApp \(abre em nova aba/ });
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  const productOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(productOverflow).toBeLessThanOrEqual(0);
});
