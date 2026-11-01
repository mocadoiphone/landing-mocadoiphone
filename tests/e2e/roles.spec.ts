import { expect, test } from "@playwright/test";

import { CONTENT_EDITOR, login, SEED_PASSWORD, VISITOR } from "./helpers";

// Autorização no servidor (MDI-D025): o menu é só UX; a URL direta também é barrada.
test("editor de conteúdo vê só Mídia e é barrado em Produtos pela URL", async ({
  page,
}) => {
  await login(page, CONTENT_EDITOR);
  const nav = page.getByRole("navigation", { name: "Painel" });
  await expect(nav.getByRole("link", { name: "Mídia" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Produtos" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Usuários" })).toHaveCount(0);

  await page.goto("/admin/produtos");
  await expect(
    page.getByRole("heading", { name: "Sem permissão para esta área" }),
  ).toBeVisible();
  await page.goto("/admin/usuarios");
  await expect(
    page.getByRole("heading", { name: "Sem permissão para esta área" }),
  ).toBeVisible();

  await page.goto("/admin/midia");
  await expect(page.getByRole("heading", { name: "Mídia" })).toBeVisible();
});

test("conta sem perfil administrativo não entra no painel", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(VISITOR);
  await page.getByLabel("Senha").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Acesso não autorizado" }),
  ).toBeVisible();
  await page.goto("/admin/produtos");
  await expect(
    page.getByRole("heading", { name: "Acesso não autorizado" }),
  ).toBeVisible();
});

test("sem sessão, o painel redireciona para o login", async ({ page }) => {
  await page.goto("/admin/produtos");
  await page.waitForURL(/\/admin\/login$/);
});
