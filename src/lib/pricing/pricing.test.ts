import { describe, expect, it } from "vitest";

import {
  formatBRL,
  installmentLine,
  parseBRLToCents,
  type PriceFields,
  productPrice,
  variantPrice,
} from "./pricing";

const NBSP = " ";
const brl = (text: string) => `R$${NBSP}${text}`;

const fields = (overrides: Partial<PriceFields> = {}): PriceFields => ({
  priceCash: null,
  priceOld: null,
  priceInstallment: null,
  installments: null,
  installmentText: null,
  priceOnRequest: false,
  ...overrides,
});

describe("formatBRL", () => {
  it("formata valores inteiros sem centavos e com separador de milhar", () => {
    expect(formatBRL(899900)).toBe(brl("8.999"));
    expect(formatBRL(1234567800)).toBe(brl("12.345.678"));
    expect(formatBRL(0)).toBe(brl("0"));
  });

  it("formata centavos com duas casas", () => {
    expect(formatBRL(54990)).toBe(brl("549,90"));
    expect(formatBRL(5)).toBe(brl("0,05"));
  });

  it("recusa valores que não são centavos válidos", () => {
    expect(() => formatBRL(-1)).toThrow(RangeError);
    expect(() => formatBRL(10.5)).toThrow(RangeError);
  });
});

describe("variantPrice", () => {
  it("reproduz o exemplo do Brain §11", () => {
    expect(
      variantPrice(
        fields({
          priceCash: 899900,
          priceInstallment: 54990,
          installments: 18,
        }),
      ),
    ).toEqual({
      kind: "priced",
      prefix: null,
      amount: brl("8.999"),
      previous: null,
      installment: `ou 18x de ${brl("549,90")}`,
    });
  });

  it("mostra 'Consulte valores' quando marcado, mesmo com preço", () => {
    expect(
      variantPrice(fields({ priceCash: 899900, priceOnRequest: true })),
    ).toEqual({ kind: "on_request", label: "Consulte valores" });
  });

  it("mostra 'Consulte valores' quando não há preço à vista", () => {
    expect(variantPrice(fields())).toEqual({
      kind: "on_request",
      label: "Consulte valores",
    });
  });

  it("exibe o preço 'de' só quando é maior que o à vista", () => {
    const promo = variantPrice(fields({ priceCash: 799900, priceOld: 899900 }));
    expect(promo.kind === "priced" && promo.previous).toBe(brl("8.999"));

    const invalid = variantPrice(
      fields({ priceCash: 799900, priceOld: 799900 }),
    );
    expect(invalid.kind === "priced" && invalid.previous).toBeNull();
  });
});

describe("installmentLine", () => {
  it("o texto livre substitui a linha gerada", () => {
    expect(
      installmentLine({
        priceInstallment: 54990,
        installments: 18,
        installmentText: "  em até 12x sem juros  ",
      }),
    ).toBe("em até 12x sem juros");
  });

  it("sem parcela nem texto, não há linha", () => {
    expect(
      installmentLine({
        priceInstallment: null,
        installments: null,
        installmentText: "   ",
      }),
    ).toBeNull();
  });
});

describe("productPrice", () => {
  it("usa 'A partir de' quando as variantes têm preços diferentes", () => {
    const view = productPrice([
      fields({ priceCash: 999900 }),
      fields({ priceCash: 899900, priceInstallment: 54990, installments: 18 }),
      fields({ priceOnRequest: true }),
    ]);
    expect(view).toEqual({
      kind: "priced",
      prefix: "A partir de",
      amount: brl("8.999"),
      previous: null,
      installment: `ou 18x de ${brl("549,90")}`,
    });
  });

  it("sem prefixo quando todas custam o mesmo", () => {
    const view = productPrice([
      fields({ priceCash: 899900 }),
      fields({ priceCash: 899900 }),
    ]);
    expect(view.kind === "priced" && view.prefix).toBeNull();
  });

  it("sem variante com preço, 'Consulte valores'", () => {
    expect(productPrice([fields({ priceOnRequest: true })])).toEqual({
      kind: "on_request",
      label: "Consulte valores",
    });
    expect(productPrice([])).toEqual({
      kind: "on_request",
      label: "Consulte valores",
    });
  });
});

describe("parseBRLToCents", () => {
  it.each([
    ["8.999", 899900],
    ["8.999,90", 899990],
    ["8999", 899900],
    ["549,9", 54990],
    ["R$ 8.999,00", 899900],
    [`R$${NBSP}1.234.567,89`, 123456789],
    ["0,05", 5],
  ])("%s → %i centavos", (input, cents) => {
    expect(parseBRLToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "8.99", "8,999", "-10", "1.2345", "99999999999"])(
    "recusa %j",
    (input) => {
      expect(parseBRLToCents(input)).toBeNull();
    },
  );
});
