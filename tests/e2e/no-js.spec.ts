import { expect, test } from "@playwright/test";

// A animacao e melhoria progressiva: conteudo e conversao existem sem JS.
test("Home e produto mantem conteudo e WhatsApp sem JavaScript", async ({
  page,
}) => {
  const home = await page.goto("/");
  expect(home?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Hero de teste" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Falar no WhatsApp/ }).first(),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\//);

  const product = await page.goto("/produto/produto-com-variantes");
  expect(product?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Produto com variantes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Consultar no WhatsApp/ }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  await expect(page.getByText("14 polegadas (fictício)")).toBeVisible();
});
