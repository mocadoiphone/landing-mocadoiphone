import { describe, expect, it } from "vitest";

import { canAccess } from "./permissions";

describe("canAccess (Brain §23, espelho da RLS)", () => {
  it("OWNER acessa tudo e é o único que gerencia usuários", () => {
    expect(canAccess("OWNER", "usersManage")).toBe(true);
    expect(canAccess("ADMIN", "usersManage")).toBe(false);
    expect(canAccess("ADMIN", "usersView")).toBe(true);
  });

  it("gestor de catálogo: catálogo e mídia; sem contatos, configurações e auditoria", () => {
    expect(canAccess("CATALOG_MANAGER", "catalog")).toBe(true);
    expect(canAccess("CATALOG_MANAGER", "media")).toBe(true);
    expect(canAccess("CATALOG_MANAGER", "contacts")).toBe(false);
    expect(canAccess("CATALOG_MANAGER", "settings")).toBe(false);
    expect(canAccess("CATALOG_MANAGER", "audit")).toBe(false);
  });

  it("editor de conteúdo: só dashboard e mídia nesta etapa", () => {
    expect(canAccess("CONTENT_EDITOR", "media")).toBe(true);
    expect(canAccess("CONTENT_EDITOR", "dashboard")).toBe(true);
    expect(canAccess("CONTENT_EDITOR", "catalog")).toBe(false);
  });
});
