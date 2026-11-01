import "server-only";

import { AREA_ROLES } from "@/lib/auth/permissions";
import { type AdminRole } from "@/lib/auth/roles";
import { type CatalogResult, failure, success } from "@/lib/catalog/result";
import { type AdminContext } from "@/services/auth/session";

/**
 * Papéis por operação (Brain §23). Vêm de `AREA_ROLES`, que espelha as políticas
 * RLS: servem para recusar cedo, com mensagem clara. A garantia final é a RLS.
 */
export const CATALOG_WRITE_ROLES = AREA_ROLES.catalog;
export const MEDIA_WRITE_ROLES = AREA_ROLES.media;

export function authorize(
  context: AdminContext,
  roles: readonly AdminRole[],
): CatalogResult<{ userId: string; role: AdminRole }> {
  if (context.status === "anonymous") {
    return failure({
      code: "unauthorized",
      message: "Sua sessão expirou. Entre novamente.",
    });
  }
  if (context.status === "forbidden" || !roles.includes(context.role)) {
    return failure({
      code: "forbidden",
      message: "Você não tem permissão para esta operação.",
    });
  }
  return success({ userId: context.userId, role: context.role });
}
