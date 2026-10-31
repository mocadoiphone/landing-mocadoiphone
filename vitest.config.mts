import { defineConfig } from "vitest/config";

// Projetos (MDI-D014):
// - unit: regras puras e configuração, em ambiente Node (`src/**/*.test.ts`);
// - components: componentes React em DOM simulado (`src/**/*.test.tsx`);
// - integration: API real do Supabase LOCAL (`tests/integration`), fora do `npm run test`.
export default defineConfig({
  resolve: { tsconfigPaths: true },
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
        },
      },
    ],
  },
});
