import { describe, expect, it } from "vitest";

import { safeExternalUrl, safeMapUrl, safeSocialUrl } from "./links";

describe("safeExternalUrl", () => {
  it("aceita https do domínio esperado e subdomínios", () => {
    expect(
      safeExternalUrl("https://instagram.com/loja", ["instagram.com"]),
    ).toBe("https://instagram.com/loja");
    expect(
      safeExternalUrl(" https://www.instagram.com/loja ", ["instagram.com"]),
    ).toBe("https://www.instagram.com/loja");
  });

  it("recusa http, javascript:, credenciais, porta e domínio parecido", () => {
    const hosts = ["instagram.com"];
    expect(safeExternalUrl("http://instagram.com/loja", hosts)).toBeNull();
    expect(safeExternalUrl("javascript:alert(1)", hosts)).toBeNull();
    expect(safeExternalUrl("https://user:pw@instagram.com", hosts)).toBeNull();
    expect(safeExternalUrl("https://instagram.com:8443/x", hosts)).toBeNull();
    expect(safeExternalUrl("https://instagram.com.evil.io", hosts)).toBeNull();
    expect(safeExternalUrl("https://notinstagram.com", hosts)).toBeNull();
    expect(safeExternalUrl("não é url", hosts)).toBeNull();
    expect(safeExternalUrl("", hosts)).toBeNull();
  });

  it("recusa endereço longo demais", () => {
    const long = `https://instagram.com/${"a".repeat(600)}`;
    expect(safeExternalUrl(long, ["instagram.com"])).toBeNull();
  });
});

describe("links do mapa e das redes", () => {
  it("mapa aceita Google Maps, Apple Maps e Waze", () => {
    expect(safeMapUrl("https://maps.app.goo.gl/abc123")).not.toBeNull();
    expect(safeMapUrl("https://www.google.com/maps/place/x")).not.toBeNull();
    expect(safeMapUrl("https://maps.apple.com/?q=loja")).not.toBeNull();
    expect(safeMapUrl("https://waze.com/ul?ll=1,2")).not.toBeNull();
    expect(safeMapUrl("https://example.com/maps")).toBeNull();
  });

  it("cada rede só aceita o próprio domínio", () => {
    expect(
      safeSocialUrl("TIKTOK", "https://www.tiktok.com/@loja"),
    ).not.toBeNull();
    expect(safeSocialUrl("TIKTOK", "https://instagram.com/loja")).toBeNull();
    expect(safeSocialUrl("X", "https://twitter.com/loja")).not.toBeNull();
    expect(safeSocialUrl("YOUTUBE", "https://youtu.be/abc")).not.toBeNull();
  });
});
