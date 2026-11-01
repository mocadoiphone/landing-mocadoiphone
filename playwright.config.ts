import { defineConfig, devices } from "@playwright/test";

// Testes de ponta a ponta dos fluxos críticos (Brain §38; MDI-D029).
// Rodam SÓ contra o Supabase local (tests/e2e/serve.mjs recusa outro endereço),
// um teste por vez, porque todos compartilham o mesmo banco.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "node tests/e2e/serve.mjs",
    url: `http://localhost:${PORT}/admin/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { E2E_PORT: String(PORT) },
  },
});
