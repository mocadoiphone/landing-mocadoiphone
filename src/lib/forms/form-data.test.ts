import { describe, expect, it } from "vitest";

import {
  centsToInput,
  INT_FORMAT_ERROR,
  MONEY_FORMAT_ERROR,
  parseForm,
} from "./form-data";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("parseForm", () => {
  it("converte reais em centavos, inteiros, checkboxes e textos", () => {
    const parsed = parseForm(
      form([
        ["name", "  iPhone 17 "],
        ["priceCash", "8.999,90"],
        ["priceOld", ""],
        ["installments", "18"],
        ["priceOnRequest", "on"],
      ]),
      {
        name: "text",
        priceCash: "money",
        priceOld: "money",
        installments: "int",
        priceOnRequest: "boolean",
        isLaunch: "boolean",
        description: "text",
      },
    );
    expect(parsed).toEqual({
      values: {
        name: "iPhone 17",
        priceCash: 899990,
        priceOld: null,
        installments: 18,
        priceOnRequest: true,
        isLaunch: false,
      },
      errors: {},
    });
  });

  it("aponta valor em reais e inteiro ilegíveis antes do envio", () => {
    const parsed = parseForm(
      form([
        ["priceCash", "8,999"],
        ["installments", "1,5"],
      ]),
      { priceCash: "money", installments: "int" },
    );
    expect(parsed.errors).toEqual({
      priceCash: [MONEY_FORMAT_ERROR],
      installments: [INT_FORMAT_ERROR],
    });
    expect(parsed.values).toEqual({});
  });

  it("lista mantém a ordem dos valores", () => {
    const parsed = parseForm(
      form([
        ["orderedIds", "b"],
        ["orderedIds", "a"],
      ]),
      { orderedIds: "list" },
    );
    expect(parsed.values.orderedIds).toEqual(["b", "a"]);
  });
});

describe("centsToInput", () => {
  it("formata centavos para o campo em reais", () => {
    expect(centsToInput(899990)).toBe("8.999,90");
    expect(centsToInput(54990)).toBe("549,90");
    expect(centsToInput(5)).toBe("0,05");
    expect(centsToInput(null)).toBe("");
  });
});
