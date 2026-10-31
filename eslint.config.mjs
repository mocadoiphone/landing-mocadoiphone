import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Cor literal em classe utilitária (ex.: `bg-[#ff0000]`) contorna os design tokens (MDI-D013).
const HARDCODED_COLOR_CLASS = String.raw`/-\[(#|rgb|hsl|oklch|oklab)/`;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Código próprio usa `unknown` + validação, nunca `any` (MDI-D014).
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${HARDCODED_COLOR_CLASS}]`,
          message:
            "Use os design tokens (src/styles/tokens.css) em vez de cor literal.",
        },
        {
          selector: `TemplateElement[value.raw=${HARDCODED_COLOR_CLASS}]`,
          message:
            "Use os design tokens (src/styles/tokens.css) em vez de cor literal.",
        },
      ],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
