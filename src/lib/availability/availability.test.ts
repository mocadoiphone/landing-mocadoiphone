import { describe, expect, it } from "vitest";

import {
  AVAILABILITY_LABELS,
  availabilityView,
  deriveProductAvailability,
  isSellableAvailability,
  isVisibleAvailability,
} from "./availability";

describe("rótulos (Brain §12)", () => {
  it("usa a interface em português definida no Brain", () => {
    expect(AVAILABILITY_LABELS).toEqual({
      AVAILABLE: "Disponível",
      PRE_ORDER: "Sob encomenda",
      ON_REQUEST: "Consulte disponibilidade",
      OUT_OF_STOCK: "Indisponível",
      DISCONTINUED: "Fora de linha",
      HIDDEN: "Oculto",
    });
    expect(availabilityView("PRE_ORDER")).toEqual({
      status: "PRE_ORDER",
      label: "Sob encomenda",
    });
  });
});

describe("deriveProductAvailability (MDI-D006)", () => {
  it("escolhe a melhor disponibilidade entre as variantes", () => {
    expect(
      deriveProductAvailability(["OUT_OF_STOCK", "PRE_ORDER", "DISCONTINUED"]),
    ).toBe("PRE_ORDER");
    expect(deriveProductAvailability(["ON_REQUEST", "AVAILABLE"])).toBe(
      "AVAILABLE",
    );
    expect(deriveProductAvailability(["DISCONTINUED", "OUT_OF_STOCK"])).toBe(
      "OUT_OF_STOCK",
    );
  });

  it("ignora variantes ocultas", () => {
    expect(deriveProductAvailability(["HIDDEN", "DISCONTINUED"])).toBe(
      "DISCONTINUED",
    );
    expect(deriveProductAvailability(["HIDDEN"])).toBeNull();
    expect(deriveProductAvailability([])).toBeNull();
  });
});

describe("visibilidade e venda", () => {
  it("HIDDEN não é visível; DISCONTINUED é visível mas não entra no 'a partir de'", () => {
    expect(isVisibleAvailability("HIDDEN")).toBe(false);
    expect(isVisibleAvailability("DISCONTINUED")).toBe(true);
    expect(isSellableAvailability("DISCONTINUED")).toBe(false);
    expect(isSellableAvailability("OUT_OF_STOCK")).toBe(true);
  });
});
