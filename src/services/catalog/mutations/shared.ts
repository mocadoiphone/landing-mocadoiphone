import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";

import { translateDbError } from "@/lib/catalog/errors";
import {
  nextSortOrder,
  planReorder,
  type ReorderPlan,
} from "@/lib/catalog/ordering";
import { type CatalogResult, failure, success } from "@/lib/catalog/result";
import { type Database } from "@/types/database";

/**
 * Utilitários do núcleo das escritas (MDI-D024). O núcleo recebe o cliente da
 * SESSÃO do administrador: a RLS decide o que pode ser alterado e `auth.uid()`
 * chega aos triggers de auditoria (MDI-D008).
 */
export type CatalogClient = SupabaseClient<Database>;

type DbError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export function dbFailure<T = never>(error: DbError): CatalogResult<T> {
  return failure(translateDbError(error));
}

export function nothingToUpdate<T = never>(): CatalogResult<T> {
  return failure({ code: "validation", message: "Nada para alterar." });
}

/** Remove chaves `undefined` (campo não enviado = não altera). */
export function definedOnly<T extends Record<string, unknown>>(
  values: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function isEmpty(values: Record<string, unknown>): boolean {
  return Object.keys(values).length === 0;
}

/** `sort_order` do próximo item do escopo (fim da lista). */
export function nextOrder(rows: readonly { sort_order: number }[]): number {
  return nextSortOrder(rows.map((row) => ({ sortOrder: row.sort_order })));
}

/**
 * Aplica uma reordenação: valida a lista recebida contra o escopo atual e grava
 * só o que mudou. As gravações são sequenciais (não atômicas): uma falha no
 * meio deixa a ordem parcial, sem perda de dados.
 */
export async function applyReorder(
  current: readonly { id: string; sort_order: number }[],
  orderedIds: readonly string[],
  update: (
    id: string,
    sortOrder: number,
  ) => PromiseLike<{ error: DbError | null; data: unknown }>,
): Promise<CatalogResult<{ updated: number }>> {
  const plan: ReorderPlan = planReorder(
    current.map((row) => ({ id: row.id, sortOrder: row.sort_order })),
    orderedIds,
  );
  if (!plan.ok) {
    return failure({
      code: "validation",
      field: "orderedIds",
      message:
        plan.reason === "duplicate"
          ? "A nova ordem repete itens."
          : "A nova ordem não corresponde aos itens atuais. Recarregue e tente de novo.",
    });
  }

  for (const { id, sortOrder } of plan.updates) {
    const { error, data } = await update(id, sortOrder);
    if (error) return dbFailure(error);
    if (data === null) {
      return failure({
        code: "forbidden",
        message: "Você não tem permissão para reordenar estes itens.",
      });
    }
  }
  return success({ updated: plan.updates.length });
}
