import { describe, expect, it } from "vitest";

import {
  buildGeneralWhatsAppMessage,
  buildWhatsAppLink,
  buildWhatsAppMessage,
  DEFAULT_GENERAL_WHATSAPP_MESSAGE,
  DEFAULT_WHATSAPP_TEMPLATE,
  generalWhatsAppLink,
  whatsAppLinkFor,
} from "./whatsapp";

// Exemplo literal do Brain §13.
const BRAIN_EXAMPLE =
  "Olá! Vi no site da Moça do iPhone o iPhone 17 Pro Max 256 GB Preto e gostaria de consultar disponibilidade e valor.";

describe("buildWhatsAppMessage", () => {
  it("reproduz exatamente o exemplo do Brain §13", () => {
    expect(
      buildWhatsAppMessage(DEFAULT_WHATSAPP_TEMPLATE, {
        productName: "iPhone 17 Pro Max",
        variantLabel: "256 GB Preto",
      }),
    ).toBe(BRAIN_EXAMPLE);
  });

  it("sem template configurado, usa o texto padrão", () => {
    expect(
      buildWhatsAppMessage(null, {
        productName: "iPhone 17 Pro Max",
        variantLabel: "256 GB Preto",
      }),
    ).toBe(BRAIN_EXAMPLE);
    expect(
      buildWhatsAppMessage("   ", { productName: "AirPods Pro" }),
    ).toContain("o AirPods Pro e gostaria");
  });

  it("sem variante, não deixa espaços sobrando", () => {
    expect(
      buildWhatsAppMessage(DEFAULT_WHATSAPP_TEMPLATE, {
        productName: "AirPods Pro",
        variantLabel: null,
      }),
    ).toBe(
      "Olá! Vi no site da Moça do iPhone o AirPods Pro e gostaria de consultar disponibilidade e valor.",
    );
  });

  it("substitui a origem e remove espaço antes de pontuação", () => {
    expect(
      buildWhatsAppMessage("Quero o {produto} {variante}. Origem: {origem}.", {
        productName: "iPad Air",
        variantLabel: "",
        origin: "Site",
      }),
    ).toBe("Quero o iPad Air. Origem: Site.");
  });
});

describe("buildWhatsAppLink", () => {
  it("monta o link wa.me com a mensagem codificada", () => {
    expect(buildWhatsAppLink("5511999999999", "Olá! Vi o iPhone & cia")).toBe(
      "https://wa.me/5511999999999?text=Ol%C3%A1!%20Vi%20o%20iPhone%20%26%20cia",
    );
  });

  it("sem número válido, não há link", () => {
    expect(buildWhatsAppLink(null, "Olá")).toBeNull();
    expect(buildWhatsAppLink("+55 11 99999-9999", "Olá")).toBeNull();
    expect(buildWhatsAppLink("0011999999999", "Olá")).toBeNull();
  });
});

describe("whatsAppLinkFor", () => {
  it("combina template, origem e contato da configuração pública", () => {
    const link = whatsAppLinkFor(
      {
        phone: "5511999999999",
        template: "Olá! {produto} {variante} ({origem})",
        origin: "Site",
      },
      { productName: "iPhone 17", variantLabel: "128 GB Azul" },
    );
    expect(link).toBe(
      `https://wa.me/5511999999999?text=${encodeURIComponent("Olá! iPhone 17 128 GB Azul (Site)")}`,
    );
  });

  it("sem contato padrão, não há link", () => {
    expect(
      whatsAppLinkFor(
        { phone: null, template: null, origin: null },
        { productName: "iPhone 17" },
      ),
    ).toBeNull();
  });
});

describe("atendimento geral (cabeçalho, loja, rodapé)", () => {
  it("sem mensagem configurada, usa o texto padrão", () => {
    expect(buildGeneralWhatsAppMessage(null, "Site")).toBe(
      DEFAULT_GENERAL_WHATSAPP_MESSAGE,
    );
  });

  it("aplica a origem e descarta marcadores de produto", () => {
    expect(
      buildGeneralWhatsAppMessage(
        "Olá! Quero atendimento {produto} {variante} ({origem}).",
        "Instagram",
      ),
    ).toBe("Olá! Quero atendimento (Instagram).");
  });

  it("monta o link com o contato padrão e codifica acentos, & e emoji", () => {
    const link = generalWhatsAppLink({
      phone: "5511999999999",
      template: null,
      origin: null,
      generalMessage: "Olá & bom dia 😀",
    });
    expect(link).toBe(
      "https://wa.me/5511999999999?text=Ol%C3%A1%20%26%20bom%20dia%20%F0%9F%98%80",
    );
    expect(decodeURIComponent(link?.split("text=")[1] ?? "")).toBe(
      "Olá & bom dia 😀",
    );
  });

  it("sem contato padrão (fallback), não há link", () => {
    expect(
      generalWhatsAppLink({ phone: null, template: null, origin: null }),
    ).toBeNull();
  });
});
