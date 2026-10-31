import { describe, expect, it } from "vitest";

import {
  authorize,
  CATALOG_WRITE_ROLES,
  MEDIA_WRITE_ROLES,
} from "./authorization";

const admin = (
  role: "OWNER" | "ADMIN" | "CATALOG_MANAGER" | "CONTENT_EDITOR",
) =>
  ({
    status: "authorized",
    userId: "u1",
    email: null,
    role,
    displayName: "Teste",
  }) as const;

describe("authorize", () => {
  it("sem sessão: não autenticado", () => {
    expect(authorize({ status: "anonymous" }, CATALOG_WRITE_ROLES)).toEqual({
      ok: false,
      error: {
        code: "unauthorized",
        message: "Sua sessão expirou. Entre novamente.",
      },
    });
  });

  it("conta sem perfil ativo: sem permissão", () => {
    const result = authorize(
      { status: "forbidden", email: null },
      MEDIA_WRITE_ROLES,
    );
    expect(result.ok === false && result.error.code).toBe("forbidden");
  });

  it("catálogo: OWNER, ADMIN e CATALOG_MANAGER; editor de conteúdo não", () => {
    for (const role of ["OWNER", "ADMIN", "CATALOG_MANAGER"] as const) {
      expect(authorize(admin(role), CATALOG_WRITE_ROLES).ok).toBe(true);
    }
    expect(authorize(admin("CONTENT_EDITOR"), CATALOG_WRITE_ROLES).ok).toBe(
      false,
    );
  });

  it("biblioteca de mídia também aceita o editor de conteúdo", () => {
    expect(authorize(admin("CONTENT_EDITOR"), MEDIA_WRITE_ROLES)).toEqual({
      ok: true,
      data: { userId: "u1", role: "CONTENT_EDITOR" },
    });
  });
});
