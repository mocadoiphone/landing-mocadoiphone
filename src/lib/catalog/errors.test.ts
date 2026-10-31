import { describe, expect, it } from "vitest";

import { translateDbError } from "./errors";

describe("translateDbError", () => {
  it("unicidade conhecida vira conflito no campo certo", () => {
    expect(
      translateDbError({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "products_slug_key"',
        details: "Key (slug)=(iphone-17) already exists.",
      }),
    ).toEqual({
      code: "conflict",
      field: "slug",
      message: "Já existe um produto com este endereço (slug).",
    });
  });

  it("CHECK conhecida vira validação; desconhecida usa mensagem genérica", () => {
    expect(
      translateDbError({
        code: "23514",
        message:
          'new row for relation "categories" violates check constraint "categories_slug_not_reserved"',
      }),
    ).toEqual({
      code: "validation",
      field: "slug",
      message: "Este endereço é reservado pelo site. Escolha outro.",
    });
    expect(
      translateDbError({
        code: "23514",
        message: 'violates check constraint "products_name_check"',
      }),
    ).toEqual({
      code: "validation",
      message: "Algum valor está fora do formato permitido.",
    });
  });

  it("família de outra categoria", () => {
    expect(
      translateDbError({
        code: "23503",
        message:
          'insert or update on table "products" violates foreign key constraint "products_family_matches_category"',
      }).field,
    ).toBe("familyId");
  });

  it("regra do banco (P0001) mantém a mensagem e associa o campo pelo hint", () => {
    expect(
      translateDbError({
        code: "P0001",
        message: "Produto publicado precisa de imagem principal.",
        hint: "publish:last_main_image",
      }),
    ).toEqual({
      code: "rule",
      field: "slot",
      message: "Produto publicado precisa de imagem principal.",
    });
  });

  it("permissão e linha inexistente", () => {
    expect(translateDbError({ code: "42501" }).code).toBe("forbidden");
    expect(translateDbError({ code: "PGRST116" }).code).toBe("not_found");
  });

  it("erro desconhecido não vaza detalhes internos", () => {
    const error = translateDbError({
      code: "XX000",
      message: 'relation "public.secret" does not exist',
      details: "internal",
    });
    expect(error).toEqual({
      code: "unexpected",
      message: "Não foi possível concluir a operação. Tente novamente.",
    });
    expect(JSON.stringify(error)).not.toContain("secret");
  });
});
