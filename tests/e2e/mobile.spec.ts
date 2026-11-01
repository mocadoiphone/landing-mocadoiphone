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
