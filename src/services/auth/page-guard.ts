import "server-only";

import { redirect } from "next/navigation";

import { type AdminArea, canAccess } from "@/lib/auth/permissions";

import { type AdminContext, getAdminContext } from "./session";

export type AuthorizedAdmin = Extract<AdminContext, { status: "authorized" }>;

/**
 * Proteção de cada página do painel no servidor (MDI-D025). O menu oculto por
 * papel é só UX: quem abrir a URL direto passa por aqui.
 * - sem sessão → login;
 * - sem perfil ativo ou sem o papel da área → `{ ok: false }` (a página mostra
 *   "Sem permissão").
 */
export async function requireAdminPage(
  area: AdminArea,
): Promise<{ ok: true; admin: AuthorizedAdmin } | { ok: false }> {
  const context = await getAdminContext();
  if (context.status === "anonymous") redirect("/admin/login");
  if (context.status !== "authorized" || !canAccess(context.role, area)) {
    return { ok: false };
  }
  return { ok: true, admin: context };
}
