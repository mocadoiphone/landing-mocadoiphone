import { expect, type Page } from "@playwright/test";

// Usuários do seed LOCAL (supabase/seed.sql). Só existem no banco local.
export const SEED_PASSWORD = "Moca-Dev-2026";
export const OWNER = "dono@local.test";
export const CONTENT_EDITOR = "conteudo@local.test";
export const VISITOR = "visitante@local.test";

// PNG 1×1 válido para o envio de imagem.
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export async function login(page: Page, email: string) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin(\/dashboard)?$/);
}

/**
 * Texto visível do conteúdo (sem o espaço não separável do preço, "R$ 8.999").
 * Espera o título: durante o streaming, o `<main>` de carregamento ainda existe.
 */
export async function visibleText(page: Page): Promise<string> {
  const content = page.locator("main", {
    has: page.getByRole("heading", { level: 1 }),
  });
  await content.waitFor();
  return (await content.innerText()).replace(/ /g, " ");
}

export async function expectStatus(page: Page, text: string) {
  await expect(
    page.getByRole("status").filter({ hasText: text }).first(),
  ).toBeVisible();
}
