import { describe, expect, it } from "vitest";

import { mergeRelatedProducts } from "@/lib/catalog/related";

import {
  copyrightLine,
  footerSettingsInput,
  hasStoreContent,
  parseFooterSettings,
  parseStoreSettings,
  storeAddressLines,
  storeSettingsInput,
  toFooterJson,
  toStoreJson,
} from "./settings";

const PHOTO = "33333333-3333-4333-8333-333333333333";

describe("loja física", () => {
  it("valida, normaliza e grava em snake_case", () => {
    const input = storeSettingsInput.parse({
      name: "Loja Centro",
      addressLine: "Rua Exemplo, 100",
      city: "São Paulo — SP",
      postalCode: "01000-000",
      hours: [{ label: "Segunda a sábado", value: "10h às 22h" }],
      mapUrl: "https://maps.app.goo.gl/abc",
      photoIds: [PHOTO],
      ctaLabel: "",
    });
    expect(toStoreJson(input)).toMatchObject({
      address_line: "Rua Exemplo, 100",
      postal_code: "01000-000",
      map_url: "https://maps.app.goo.gl/abc",
      photo_ids: [PHOTO],
      cta_label: null,
    });
  });

  it("recusa mapa fora dos domínios aceitos, CEP inválido e excesso de horários", () => {
    const result = storeSettingsInput.safeParse({
      mapUrl: "javascript:alert(1)",
      postalCode: "123",
      hours: Array.from({ length: 8 }, () => ({ label: "Dia", value: "10h" })),
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(["mapUrl", "postalCode", "hours"]),
    );
  });

  it("leitura tolerante: JSON estranho vira vazio e o mapa é revalidado", () => {
    const store = parseStoreSettings({
      address_line: "Rua Exemplo, 100",
      map_url: "https://evil.example/maps",
      hours: "todo dia",
    });
    expect(store.mapUrl).toBeNull();
    expect(store.hours).toEqual([]);
    expect(parseStoreSettings(null).addressLine).toBeNull();
  });

  it("monta o endereço em linhas e decide se há conteúdo", () => {
    const store = parseStoreSettings({
      address_line: "Rua Exemplo, 100",
      district: "Centro",
      city: "São Paulo — SP",
      postal_code: "01000-000",
    });
    expect(storeAddressLines(store)).toEqual([
      "Rua Exemplo, 100",
      "Centro",
      "São Paulo — SP · CEP 01000-000",
    ]);
    expect(hasStoreContent(store)).toBe(true);
    expect(hasStoreContent(parseStoreSettings({}))).toBe(false);
  });
});

describe("rodapé", () => {
  it("valida cada rede pelo próprio domínio", () => {
    expect(
      footerSettingsInput.safeParse({
        socialLinks: [{ network: "INSTAGRAM", url: "https://facebook.com/x" }],
      }).success,
    ).toBe(false);
    const input = footerSettingsInput.parse({
      socialLinks: [
        { network: "INSTAGRAM", url: "https://instagram.com/loja" },
      ],
      legalName: "Empresa Exemplo LTDA",
    });
    expect(toFooterJson(input).social_links).toEqual([
      { network: "INSTAGRAM", url: "https://instagram.com/loja" },
    ]);
  });

  it("leitura descarta link inválido gravado fora do painel", () => {
    const footer = parseFooterSettings({
      social_links: [
        { network: "INSTAGRAM", url: "https://instagram.com/loja" },
        { network: "X", url: "javascript:alert(1)" },
      ],
    });
    expect(footer.socialLinks).toEqual([
      {
        network: "INSTAGRAM",
        label: "Instagram",
        url: "https://instagram.com/loja",
      },
    ]);
  });

  it("copyright usa o texto do painel ou o padrão com ano e nome", () => {
    expect(copyrightLine(null, 2026, "Moça do iPhone")).toBe(
      "© 2026 Moça do iPhone. Todos os direitos reservados.",
    );
    expect(copyrightLine("© Loja", 2026, "Moça do iPhone")).toBe("© Loja");
  });
});

describe("mergeRelatedProducts", () => {
  const p = (id: string) => ({ id });

  it("relacionado do painel primeiro, depois a família, sem repetir nem o próprio", () => {
    expect(
      mergeRelatedProducts("atual", p("rel"), [
        p("atual"),
        p("a"),
        p("rel"),
        p("b"),
      ]).map((item) => item.id),
    ).toEqual(["rel", "a", "b"]);
  });

  it("respeita o máximo e funciona sem relacionado", () => {
    expect(
      mergeRelatedProducts("x", null, [p("a"), p("b"), p("c")], 2).map(
        (i) => i.id,
      ),
    ).toEqual(["a", "b"]);
  });
});
