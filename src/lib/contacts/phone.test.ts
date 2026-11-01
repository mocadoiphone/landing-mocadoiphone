import { describe, expect, it } from "vitest";

import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["(11) 99999-9999", "5511999999999"],
    ["11 3333-4444", "551133334444"],
    ["+55 11 99999-9999", "5511999999999"],
    ["0055 11 99999 9999", "5511999999999"],
    ["+1 415 555 0100", "14155550100"],
  ])("%s → %s", (input, digits) => {
    expect(normalizePhone(input)).toBe(digits);
  });

  it.each(["", "123", "abc", "+0 11 99999-9999", "+55 11 9999-99999999999"])(
    "recusa %j",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});

describe("formatPhone", () => {
  it("formata números brasileiros e mantém os demais com DDI", () => {
    expect(formatPhone("5511999999999")).toBe("+55 (11) 99999-9999");
    expect(formatPhone("551133334444")).toBe("+55 (11) 3333-4444");
    expect(formatPhone("14155550100")).toBe("+14155550100");
  });
});
