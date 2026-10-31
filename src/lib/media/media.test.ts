import { describe, expect, it } from "vitest";

import {
  effectiveAlt,
  isAllowedMimeType,
  isValidStoragePath,
  publicMediaUrl,
  slotAcceptsKind,
} from "./media";

describe("isValidStoragePath", () => {
  it("aceita só as pastas do Brain §20", () => {
    expect(isValidStoragePath("products/abc/iphone.webp")).toBe(true);
    expect(isValidStoragePath("store/foto-loja.jpg")).toBe(true);
    expect(isValidStoragePath("outros/arquivo.png")).toBe(false);
    expect(isValidStoragePath("products/")).toBe(false);
  });

  it("recusa navegação de diretório e caracteres fora do padrão", () => {
    expect(isValidStoragePath("products/../segredo.png")).toBe(false);
    expect(isValidStoragePath("products/nome com espaço.png")).toBe(false);
  });
});

describe("tipos e slots", () => {
  it("valida o mime type pelo tipo da mídia", () => {
    expect(isAllowedMimeType("IMAGE", "image/avif")).toBe(true);
    expect(isAllowedMimeType("IMAGE", "image/gif")).toBe(false);
    expect(isAllowedMimeType("VIDEO", "video/mp4")).toBe(true);
    expect(isAllowedMimeType("VIDEO", "image/png")).toBe(false);
  });

  it("slot VIDEO só aceita vídeo e os demais só imagem", () => {
    expect(slotAcceptsKind("VIDEO", "VIDEO")).toBe(true);
    expect(slotAcceptsKind("MAIN", "VIDEO")).toBe(false);
    expect(slotAcceptsKind("GALLERY", "IMAGE")).toBe(true);
    expect(slotAcceptsKind("VIDEO", "IMAGE")).toBe(false);
  });
});

describe("alt e URL", () => {
  it("o alt do vínculo sobrepõe o da biblioteca", () => {
    expect(effectiveAlt("  Vista lateral ", "iPhone")).toBe("Vista lateral");
    expect(effectiveAlt(null, "iPhone")).toBe("iPhone");
    expect(effectiveAlt("   ", "iPhone")).toBe("iPhone");
  });

  it("monta a URL pública do bucket media", () => {
    expect(
      publicMediaUrl("https://exemplo.supabase.co/", "products/a b/x.webp"),
    ).toBe(
      "https://exemplo.supabase.co/storage/v1/object/public/media/products/a%20b/x.webp",
    );
  });
});
