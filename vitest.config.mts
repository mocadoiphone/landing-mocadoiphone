import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Projetos (MDI-D014):
// - unit: regras puras e configuração, em ambiente Node (`src/**/*.test.ts`);
// - components: componentes React em DOM simulado (`src/**/*.test.tsx`);
// - integration: API real do Supabase LOCAL (`tests/integration`), fora do `npm run test`.
// `server-only` aponta para um stub: a proteção é do bundler do Next (MDI-D024).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["./tests/integration/global-setup.ts"],
          testTimeout: 15000,
          // Um arquivo por vez: todos compartilham o mesmo banco local.
          fileParallelism: false,
        },
      },
    ],
  },
});
