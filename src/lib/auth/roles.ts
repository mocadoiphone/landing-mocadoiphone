import { type Database } from "@/types/database";

/** Perfis administrativos (Brain §23), derivados do enum do banco. */
export type AdminRole = Database["public"]["Enums"]["admin_role"];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  CATALOG_MANAGER: "Gestor de catálogo",
  CONTENT_EDITOR: "Editor de conteúdo",
};
