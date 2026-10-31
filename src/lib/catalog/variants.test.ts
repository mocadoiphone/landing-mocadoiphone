import { describe, expect, it } from "vitest";

import { type AvailabilityStatus } from "@/lib/availability/availability";

import {
  compareVariants,
  effectiveDefaultVariant,
  variantLabel,
  variantMessageLabel,
} from "./variants";

const variant = (
  id: string,
  overrides: Partial<{
    sortOrder: number;
    storage: string | null;
    colorName: string | null;
    isDefault: boolean;
    availability: AvailabilityStatus;
  }> = {},
) => ({
  id,
  sortOrder: 0,
  storage: null,
  colorName: null,
  isDefault: false,
  availability: "AVAILABLE" as AvailabilityStatus,
  ...overrides,
});

describe("rótulos", () => {
  it("interface usa barra; mensagem do WhatsApp usa espaço", () => {
    const v = { storage: "256 GB", colorName: "Preto" };
    expect(variantLabel(v)).toBe("256 GB / Preto");
    expect(variantMessageLabel(v)).toBe("256 GB Preto");
  });

  it("aceita variante só com capacidade, só com cor ou sem nenhuma", () => {
    expect(variantLabel({ storage: "1 TB", colorName: null })).toBe("1 TB");
    expect(variantLabel({ storage: null, colorName: " Azul " })).toBe("Azul");
    expect(variantMessageLabel({ storage: null, colorName: null })).toBeNull();
  });
});

describe("ordem", () => {
  it("ordena por sort_order e, no empate, em ordem natural da capacidade", () => {
    const list = [
      variant("c", { sortOrder: 10, storage: "1024 GB" }),
      variant("a", { sortOrder: 10, storage: "128 GB" }),
      variant("b", { sortOrder: 0, storage: "1 TB" }),
    ].sort(compareVariants);
    // Ordem natural: "128" < "1024" (alfabeticamente seria o contrário).
    expect(list.map((v) => v.id)).toEqual(["b", "a", "c"]);
  });
});

describe("effectiveDefaultVariant", () => {
  it("usa a variante marcada como padrão", () => {
    expect(
      effectiveDefaultVariant([
        variant("a"),
        variant("b", { isDefault: true, sortOrder: 20 }),
      ])?.id,
    ).toBe("b");
  });

  it("se a padrão estiver oculta, usa a primeira visível", () => {
    expect(
      effectiveDefaultVariant([
        variant("a", { isDefault: true, availability: "HIDDEN" }),
        variant("c", { sortOrder: 20 }),
        variant("b", { sortOrder: 10, availability: "OUT_OF_STOCK" }),
      ])?.id,
    ).toBe("b");
  });

  it("sem variante visível, não há padrão", () => {
    expect(
      effectiveDefaultVariant([variant("a", { availability: "HIDDEN" })]),
    ).toBeNull();
  });
});
