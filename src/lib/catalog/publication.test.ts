import { describe, expect, it } from "vitest";

import {
  describePublicationIssues,
  getPublicationIssues,
  type PublicationAggregate,
} from "./publication";

const ready: PublicationAggregate = {
  category: { isActive: true, isDeleted: false },
  family: { isDeleted: false },
  variants: [{ availability: "OUT_OF_STOCK", isDeleted: false }],
  mainImage: { assetDeleted: false },
};

describe("getPublicationIssues", () => {
  it("produto completo não tem pendências (variante indisponível ainda é visível)", () => {
    expect(getPublicationIssues(ready)).toEqual([]);
  });

  it("lista todas as pendências de uma vez", () => {
    expect(
      getPublicationIssues({
        category: { isActive: false, isDeleted: false },
        family: { isDeleted: true },
        variants: [
          { availability: "HIDDEN", isDeleted: false },
          { availability: "AVAILABLE", isDeleted: true },
        ],
        mainImage: null,
      }),
    ).toEqual([
      "category_inactive",
      "family_deleted",
      "no_visible_variant",
      "no_main_image",
    ]);
  });

  it("imagem principal com mídia excluída não conta; categoria excluída também não", () => {
    expect(
      getPublicationIssues({
        ...ready,
        category: { isActive: true, isDeleted: true },
        mainImage: { assetDeleted: true },
      }),
    ).toEqual(["category_inactive", "no_main_image"]);
  });
});

describe("describePublicationIssues", () => {
  it("monta uma mensagem única em português", () => {
    expect(
      describePublicationIssues(["no_visible_variant", "no_main_image"]),
    ).toBe(
      "Para publicar: Cadastre ao menos uma variante visível. Defina a imagem principal.",
    );
  });
});
