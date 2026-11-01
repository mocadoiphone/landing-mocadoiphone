import { describe, expect, it } from "vitest";

import {
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  homeBlockCreateInput,
  parseBlockSettings,
  toBlockRow,
} from "./blocks";
import { resolveCta } from "./cta";
import { isBlockRenderable } from "./render";
import { type HomeBlockView } from "./types";

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";
const MEDIA_ID = "33333333-3333-4333-8333-333333333333";

function errorsOf(input: unknown): Record<string, string[] | undefined> {
  const result = homeBlockCreateInput.safeParse(input);
  if (result.success) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

describe("definições dos blocos", () => {
  it("cobre os 11 tipos do Brain §19", () => {
    expect(BLOCK_TYPES).toHaveLength(11);
    for (const type of BLOCK_TYPES) {
      const definition = BLOCK_DEFINITIONS[type];
      expect(definition.label.length).toBeGreaterThan(0);
      for (const field of definition.required) {
        expect(definition.fields).toContain(field);
      }
    }
  });
});

describe("homeBlockCreateInput", () => {
  it("aceita um hero completo", () => {
    const result = homeBlockCreateInput.safeParse({
      type: "HERO_PRODUCT",
      title: "iPhone 17 Pro",
      theme: "DARK",
      productId: PRODUCT_ID,
      primaryCta: { label: "Ver opções", target: "PRODUCT" },
      secondaryCta: { label: "", target: "WHATSAPP" },
    });
    expect(result.success).toBe(true);
    // Botão sem texto é descartado.
    expect(result.data?.secondaryCta).toBeNull();
  });

  it("exige os campos obrigatórios de cada tipo", () => {
    expect(
      errorsOf({ type: "HERO_PRODUCT", theme: "LIGHT" }).title,
    ).toBeDefined();
    expect(
      errorsOf({ type: "PRODUCT_STORY", theme: "LIGHT" }).productId,
    ).toBeDefined();
    expect(
      errorsOf({ type: "TEXT_AND_MEDIA", theme: "LIGHT", title: "Loja" })
        .mediaAssetId,
    ).toBeDefined();
    expect(
      errorsOf({ type: "CTA", theme: "LIGHT", title: "Fale" }).primaryCta,
    ).toBeDefined();
    expect(
      errorsOf({ type: "FEATURES", theme: "LIGHT", items: [] }).items,
    ).toBeDefined();
  });

  it("mídia em tela cheia aceita só vídeo", () => {
    expect(
      errorsOf({
        type: "FULLSCREEN_MEDIA",
        theme: "DARK",
        videoAssetId: MEDIA_ID,
      }),
    ).toEqual({});
  });

  it("grade por categoria exige a categoria", () => {
    expect(
      errorsOf({ type: "PRODUCT_GRID", theme: "LIGHT", source: "CATEGORY" })
        .categoryId,
    ).toBeDefined();
    expect(
      errorsOf({
        type: "PRODUCT_GRID",
        theme: "LIGHT",
        source: "CATEGORY",
        categoryId: CATEGORY_ID,
      }),
    ).toEqual({});
  });

  it("botão para o produto exige o produto do bloco", () => {
    expect(
      errorsOf({
        type: "CTA",
        theme: "LIGHT",
        title: "Conheça",
        primaryCta: { label: "Ver", target: "PRODUCT" },
      }).primaryCta,
    ).toBeDefined();
  });

  it("itens precisam da parte obrigatória do tipo", () => {
    expect(
      errorsOf({
        type: "REVIEWS",
        theme: "LIGHT",
        items: [{ title: "Ana", text: "" }],
      }).items,
    ).toBeDefined();
    expect(
      errorsOf({
        type: "FEATURES",
        theme: "LIGHT",
        items: [{ title: "Retirada em loja", text: "No mesmo dia" }],
      }),
    ).toEqual({});
  });

  it("recusa tipo, tema e limites inválidos", () => {
    expect(errorsOf({ type: "HTML", theme: "LIGHT" }).type).toBeDefined();
    expect(errorsOf({ type: "CTA", theme: "NEON" }).theme).toBeDefined();
    expect(
      errorsOf({ type: "HERO_PRODUCT", theme: "LIGHT", title: "x".repeat(161) })
        .title,
    ).toBeDefined();
    expect(
      errorsOf({
        type: "PRODUCT_GRID",
        theme: "LIGHT",
        source: "LAUNCH",
        limit: 40,
      }).limit,
    ).toBeDefined();
  });
});

describe("toBlockRow", () => {
  it("grava só o que o tipo usa", () => {
    const input = homeBlockCreateInput.parse({
      type: "CATEGORY_GRID",
      theme: "LIGHT",
      title: "Linhas Apple",
      content: "não usado",
      productId: PRODUCT_ID,
      primaryCta: { label: "Ver", target: "STORE" },
    });
    const row = toBlockRow(input);
    expect(row.title).toBe("Linhas Apple");
    expect(row.content).toBeNull();
    expect(row.product_id).toBeNull();
    expect(row.settings_json).toEqual({});
  });

  it("grade só guarda a categoria quando a origem é categoria", () => {
    const launch = toBlockRow(
      homeBlockCreateInput.parse({
        type: "PRODUCT_GRID",
        theme: "LIGHT",
        source: "LAUNCH",
        categoryId: CATEGORY_ID,
      }),
    );
    expect(launch.category_id).toBeNull();
    expect(launch.settings_json).toEqual({ source: "LAUNCH", limit: 8 });
  });

  it("itens vazios são descartados", () => {
    const row = toBlockRow(
      homeBlockCreateInput.parse({
        type: "FEATURES",
        theme: "DARK",
        items: [{ title: "Parcelamento" }, { title: "", text: "" }],
      }),
    );
    expect(row.settings_json.items).toEqual([
      { title: "Parcelamento", text: null, detail: null },
    ]);
  });
});

describe("parseBlockSettings", () => {
  it("descarta campos inválidos sem derrubar o bloco", () => {
    const settings = parseBlockSettings("HERO_PRODUCT", {
      eyebrow: "Novo",
      primaryCta: { label: "Ver", target: "javascript:alert(1)" },
      layout: "DIAGONAL",
    });
    expect(settings.eyebrow).toBe("Novo");
    expect(settings.primaryCta).toBeNull();
    expect(settings.layout).toBe("MEDIA_START");
  });

  it("ignora o que o tipo não usa e tolera JSON que não é objeto", () => {
    expect(
      parseBlockSettings("CATEGORY_GRID", {
        items: [{ title: "x" }],
        primaryCta: { label: "Ver", target: "STORE" },
      }),
    ).toMatchObject({ items: [], primaryCta: null });
    expect(parseBlockSettings("CTA", ["lista"]).primaryCta).toBeNull();
  });
});

describe("resolveCta", () => {
  const context = {
    productSlug: "iphone-17",
    categorySlug: "iphone",
    whatsappUrl: "https://wa.me/5511999999999?text=x",
  };

  it("resolve cada destino para um endereço do site ou o WhatsApp", () => {
    expect(resolveCta({ label: "Ver", target: "PRODUCT" }, context)?.href).toBe(
      "/produto/iphone-17",
    );
    expect(
      resolveCta({ label: "Ver", target: "CATEGORY" }, context)?.href,
    ).toBe("/iphone");
    expect(resolveCta({ label: "Loja", target: "STORE" }, context)?.href).toBe(
      "/loja",
    );
    expect(resolveCta({ label: "Of.", target: "OFFERS" }, context)?.href).toBe(
      "/ofertas",
    );
    const whatsapp = resolveCta({ label: "Fale", target: "WHATSAPP" }, context);
    expect(whatsapp?.external).toBe(true);
  });

  it("sem o vínculo necessário, o botão some", () => {
    const empty = { productSlug: null, categorySlug: null, whatsappUrl: null };
    expect(resolveCta({ label: "Ver", target: "PRODUCT" }, empty)).toBeNull();
    expect(resolveCta({ label: "Fale", target: "WHATSAPP" }, empty)).toBeNull();
    expect(resolveCta(null, context)).toBeNull();
  });
});

describe("isBlockRenderable", () => {
  const base: HomeBlockView = {
    id: "b1",
    type: "HERO_PRODUCT",
    theme: "light",
    eyebrow: null,
    title: null,
    subtitle: null,
    content: null,
    media: null,
    video: null,
    product: null,
    category: null,
    layout: "MEDIA_START",
    ctas: [],
    items: [],
    products: [],
    categories: [],
    store: null,
  };

  it("bloco sem o essencial não é renderizado", () => {
    expect(isBlockRenderable(base)).toBe(false);
    expect(isBlockRenderable({ ...base, title: "Olá" })).toBe(true);
    expect(isBlockRenderable({ ...base, type: "PRODUCT_STORY" })).toBe(false);
    expect(isBlockRenderable({ ...base, type: "PRODUCT_GRID" })).toBe(false);
    expect(isBlockRenderable({ ...base, type: "STORE" })).toBe(false);
    expect(
      isBlockRenderable({ ...base, type: "CTA", title: "Fale conosco" }),
    ).toBe(false);
  });
});
