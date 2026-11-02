import { describe, expect, it } from "vitest";

import { createSecurityHeaders } from "./security";

describe("createSecurityHeaders", () => {
  it("inclui CSP compatível com Supabase, JSON-LD e frame-ancestors", () => {
    const headers = createSecurityHeaders({
      supabaseUrl: "https://project.supabase.co",
      productionHttps: false,
      development: false,
    });
    const csp = headers.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("https://project.supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(
      headers.some((header) => header.key === "Strict-Transport-Security"),
    ).toBe(false);
  });

  it("só adiciona HSTS para produção HTTPS confirmada", () => {
    const headers = createSecurityHeaders({
      supabaseUrl: undefined,
      productionHttps: true,
      development: false,
    });
    expect(headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  });
});
