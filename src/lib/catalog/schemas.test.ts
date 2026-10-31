import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  categoryCreateInput,
  mediaAssetRegisterInput,
  productUpdateInput,
  reorderVariantsInput,
  variantCreateInput,
  variantUpdateInput,
} from "./schemas";

const ID = "aaaaaaaa-0000-4000-8000-000000000001";

function fieldErrors(result: { success: boolean; error?: z.ZodError }) {
  return result.error ? z.flattenError(result.error).fieldErrors : {};
}

describe("categoryCreateInput", () => {
  it("apara textos, transforma vazio em null e ignora slug vazio", () => {
    expect(
      categoryCreateInput.parse({
        name: "  iPhone ",
        slug: "",
        description: "   ",
      }),
    ).toEqual({ name: "iPhone", description: null });
  });

  it("recusa nome vazio e slug fora do formato", () => {
    const result = categoryCreateInput.safeParse({
      name: " ",
      slug: "iPhone 17",
    });
    expect(result.success).toBe(false);
    expect(Object.keys(fieldErrors(result)).sort()).toEqual(["name", "slug"]);
  });
});

describe("productUpdateInput", () => {
  it("categoria e família mudam juntas", () => {
    const result = productUpdateInput.safeParse({ id: ID, categoryId: ID });
    expect(fieldErrors(result)).toHaveProperty("familyId");
    expect(
      productUpdateInput.safeParse({ id: ID, categoryId: ID, familyId: ID })
        .success,
    ).toBe(true);
  });

  it("canonical exige https", () => {
    expect(
      productUpdateInput.safeParse({ id: ID, canonicalUrl: "http://x.com" })
        .success,
    ).toBe(false);
    expect(
      productUpdateInput.parse({ id: ID, canonicalUrl: "" }).canonicalUrl,
    ).toBeNull();
  });
});

describe("variantes", () => {
  it("aceita preços em centavos e disponibilidade do Brain", () => {
    expect(
      variantCreateInput.parse({
        productId: ID,
        storage: "256 GB",
        colorName: "Preto",
        priceCash: 899900,
        priceInstallment: 54990,
        installments: 18,
        availability: "AVAILABLE",
      }),
    ).toMatchObject({ priceCash: 899900, installments: 18 });
  });

  it("recusa preço 'de' menor ou igual ao à vista e parcela sem quantidade", () => {
    const result = variantCreateInput.safeParse({
      productId: ID,
      priceCash: 899900,
      priceOld: 899900,
      priceInstallment: 54990,
      installments: null,
    });
    expect(Object.keys(fieldErrors(result)).sort()).toEqual([
      "installments",
      "priceOld",
    ]);
  });

  it("recusa valores que não são centavos inteiros e parcelas fora de 1–36", () => {
    const result = variantUpdateInput.safeParse({
      id: ID,
      priceCash: 8999.9,
      installments: 48,
    });
    expect(Object.keys(fieldErrors(result)).sort()).toEqual([
      "installments",
      "priceCash",
    ]);
  });

  it("edição parcial não exige os pares de campos", () => {
    expect(
      variantUpdateInput.safeParse({ id: ID, priceOld: 999900 }).success,
    ).toBe(true);
  });
});

describe("mediaAssetRegisterInput", () => {
  const image = {
    storagePath: "products/x/iphone.webp",
    kind: "IMAGE",
    mimeType: "image/webp",
    sizeBytes: 2048,
    width: 1200,
    height: 1200,
    altText: "iPhone 17 Pro Max preto",
  };

  it("aceita imagem válida", () => {
    expect(mediaAssetRegisterInput.safeParse(image).success).toBe(true);
  });

  it("recusa formato, tamanho, dimensões e caminho inválidos", () => {
    const result = mediaAssetRegisterInput.safeParse({
      ...image,
      storagePath: "outros/../x.webp",
      mimeType: "image/gif",
      sizeBytes: 11 * 1024 * 1024,
      width: null,
    });
    expect(Object.keys(fieldErrors(result)).sort()).toEqual([
      "mimeType",
      "sizeBytes",
      "storagePath",
      "width",
    ]);
  });
});

describe("ordenação", () => {
  it("exige lista de ids válida", () => {
    expect(
      reorderVariantsInput.safeParse({ productId: ID, orderedIds: [] }).success,
    ).toBe(false);
    expect(
      reorderVariantsInput.safeParse({ productId: ID, orderedIds: ["x"] })
        .success,
    ).toBe(false);
  });
});
