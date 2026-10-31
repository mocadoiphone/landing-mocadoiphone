/**
 * Resultado das operações do catálogo (MDI-D024). É o que as Server Actions
 * devolvem ao cliente: só ids/slugs e mensagens prontas, nunca a linha do banco
 * nem detalhes internos do erro.
 */
export type CatalogErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rule"
  | "unexpected";

export type CatalogError = {
  code: CatalogErrorCode;
  message: string;
  /** Campo do formulário relacionado ao erro (camelCase), quando houver. */
  field?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CatalogResult<T> =
  { ok: true; data: T } | { ok: false; error: CatalogError };

export function success<T>(data: T): CatalogResult<T> {
  return { ok: true, data };
}

export function failure<T = never>(error: CatalogError): CatalogResult<T> {
  return { ok: false, error };
}

export const NOT_FOUND_MESSAGE =
  "Registro não encontrado ou sem permissão para alterá-lo.";

export function notFound<T = never>(): CatalogResult<T> {
  return failure({ code: "not_found", message: NOT_FOUND_MESSAGE });
}
