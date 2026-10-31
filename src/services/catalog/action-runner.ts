import "server-only";

import { updateTag } from "next/cache";
import { z } from "zod";

import { type AdminRole } from "@/lib/auth/roles";
import { type CatalogResult, failure } from "@/lib/catalog/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/services/auth/session";

import { authorize } from "./authorization";
import { type CatalogClient } from "./mutations/shared";

/**
 * Esqueleto comum das Server Actions do catálogo (MDI-D024). Cada action é uma
 * entrada pública não confiável (guia de Server Actions do Next 16), então:
 * 1. identidade e papel vêm da sessão, nunca do cliente;
 * 2. o input é validado com Zod;
 * 3. a escrita roda com a sessão do usuário (RLS + auditoria);
 * 4. em caso de sucesso, invalida as tags do site público;
 * 5. devolve só o resultado previsto, nunca a linha do banco nem o erro cru.
 */
export async function runCatalogAction<Schema extends z.ZodType, T>(options: {
  roles: readonly AdminRole[];
  schema: Schema;
  input: unknown;
  tags: readonly string[];
  run: (
    client: CatalogClient,
    input: z.output<Schema>,
  ) => Promise<CatalogResult<T>>;
}): Promise<CatalogResult<T>> {
  const access = authorize(await getAdminContext(), options.roles);
  if (!access.ok) return access;

  const parsed = options.schema.safeParse(options.input);
  if (!parsed.success) {
    return failure({
      code: "validation",
      message: "Revise os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const client = await createSupabaseServerClient();
  const result = await options.run(client, parsed.data);
  if (result.ok) {
    for (const tag of options.tags) updateTag(tag);
  }
  return result;
}
