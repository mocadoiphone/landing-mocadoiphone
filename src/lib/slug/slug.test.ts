import { describe, expect, it } from "vitest";

import { isValidSlug, slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["iPhone 17 Pro Max", "iphone-17-pro-max"],
    ["Acessórios", "acessorios"],
    ["TV & Casa", "tv-e-casa"],
    ["  Apple   Watch  ", "apple-watch"],
    ['MacBook Air 13" (M4)', "macbook-air-13-m4"],
    ["---", ""],
  ])("%j → %j", (text, slug) => {
    expect(slugify(text, 120)).toBe(slug);
  });

  it("respeita o tamanho máximo sem terminar em hífen", () => {
    expect(slugify("abc def", 4)).toBe("abc");
  });
});

describe("isValidSlug", () => {
  it("aceita o mesmo formato do banco", () => {
    expect(isValidSlug("iphone-17-pro-max", 120)).toBe(true);
    expect(isValidSlug("mac", 80)).toBe(true);
  });

  it.each(["", "Iphone", "iphone_17", "-iphone", "iphone-", "a--b", "ação"])(
    "recusa %j",
    (slug) => {
      expect(isValidSlug(slug, 120)).toBe(false);
    },
  );

  it("recusa acima do limite", () => {
    expect(isValidSlug("a".repeat(81), 80)).toBe(false);
  });
});
