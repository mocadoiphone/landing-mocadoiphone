import { describe, expect, it } from "vitest";

import { selectVariant, variantOptions } from "./variant-selection";

const v = (id: string, storage: string | null, colorName: string | null) => ({
  id,
  storage,
  colorName,
  colorHex: colorName === "Preto" ? "#000000" : "#FFFFFF",
});

const VARIANTS = [
  v("256-preto", "256 GB", "Preto"),
  v("256-branco", "256 GB", "Branco"),
  v("512-preto", "512 GB", "Preto"),
  v("1tb-azul", "1 TB", "Azul"),
];

describe("variantOptions", () => {
  it("lista capacidades e cores sem repetir, na ordem das variantes", () => {
    const options = variantOptions(VARIANTS, VARIANTS[0] ?? null);
    expect(options.storages.map((option) => option.value)).toEqual([
      "256 GB",
      "512 GB",
      "1 TB",
    ]);
    expect(options.colors.map((option) => option.value)).toEqual([
      "Preto",
      "Branco",
      "Azul",
    ]);
    expect(options.colors[0]?.hex).toBe("#000000");
  });

  it("marca a seleção e as combinações que existem", () => {
    const options = variantOptions(VARIANTS, VARIANTS[0] ?? null);
    expect(options.storages.find((o) => o.selected)?.value).toBe("256 GB");
    // 1 TB não existe em Preto.
    expect(
      options.storages.find((o) => o.value === "1 TB")?.matchesSelection,
    ).toBe(false);
    expect(
      options.colors.find((o) => o.value === "Branco")?.matchesSelection,
    ).toBe(true);
  });

  it("produto sem capacidade nem cor não tem opções", () => {
    const options = variantOptions([v("unico", null, null)], null);
    expect(options.storages).toEqual([]);
    expect(options.colors).toEqual([]);
  });
});

describe("selectVariant", () => {
  it("troca a cor mantendo a capacidade quando a combinação existe", () => {
    expect(
      selectVariant(VARIANTS, VARIANTS[0] ?? null, { colorName: "Branco" })?.id,
    ).toBe("256-branco");
  });

  it("combinação inexistente leva à primeira variante com o valor escolhido", () => {
    expect(
      selectVariant(VARIANTS, VARIANTS[1] ?? null, { storage: "512 GB" })?.id,
    ).toBe("512-preto");
    expect(
      selectVariant(VARIANTS, VARIANTS[0] ?? null, { colorName: "Azul" })?.id,
    ).toBe("1tb-azul");
  });

  it("valor desconhecido mantém a seleção atual", () => {
    expect(
      selectVariant(VARIANTS, VARIANTS[2] ?? null, { storage: "2 TB" })?.id,
    ).toBe("512-preto");
  });
});
