import { defineConfig } from "vitest/config";

// Dois projetos (MDI-D014):
// - unit: regras puras e configuração, em ambiente Node (`*.test.ts`);
// - components: componentes React em DOM simulado (`*.test.tsx`).
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
    ],
  },
});
