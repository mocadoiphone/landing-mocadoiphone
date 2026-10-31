import { execSync } from "node:child_process";

import { type TestProject } from "vitest/node";
import { z } from "zod";

declare module "vitest" {
  export interface ProvidedContext {
    supabaseUrl: string;
    supabaseKey: string;
  }
}

const localStatusSchema = z.object({
  API_URL: z.url(),
  PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Lê a URL e a chave PÚBLICA do Supabase local (`supabase status`).
 * Os valores não são impressos. Recusa qualquer endereço que não seja local.
 */
export default function setup(project: TestProject) {
  let output: string;
  try {
    output = execSync("supabase status -o json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "Supabase local não está rodando. Execute `npm run db:start` (e `npm run db:reset` para o seed).",
    );
  }

  const json = output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1);
  const status = localStatusSchema.parse(JSON.parse(json));

  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(status.API_URL)) {
    throw new Error(
      "Os testes de integração só rodam contra o Supabase local.",
    );
  }

  project.provide("supabaseUrl", status.API_URL);
  project.provide("supabaseKey", status.PUBLISHABLE_KEY);
}
