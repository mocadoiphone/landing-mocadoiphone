import { type AdminRole } from "./roles";

/**
 * Papéis por área do painel (Brain §23; MDI-D025). Espelha as políticas RLS:
 * o menu usa isto só para UX; páginas e Server Actions conferem no servidor, e a
 * garantia final é sempre a RLS do banco.
 */
const ALL: readonly AdminRole[] = [
  "OWNER",
  "ADMIN",
  "CATALOG_MANAGER",
  "CONTENT_EDITOR",
];

export const AREA_ROLES = {
  dashboard: ALL,
  /** Leitura de `audit_logs` (RLS: OWNER e ADMIN). */
  audit: ["OWNER", "ADMIN"],
  catalog: ["OWNER", "ADMIN", "CATALOG_MANAGER"],
  media: ALL,
  contacts: ["OWNER", "ADMIN"],
  settings: ["OWNER", "ADMIN"],
  usersView: ["OWNER", "ADMIN"],
  usersManage: ["OWNER"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type AdminArea = keyof typeof AREA_ROLES;

export function canAccess(role: AdminRole, area: AdminArea): boolean {
  return (AREA_ROLES[area] as readonly AdminRole[]).includes(role);
}
