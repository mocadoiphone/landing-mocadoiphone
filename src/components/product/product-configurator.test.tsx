import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { availabilityView } from "@/lib/availability/availability";
import { type VariantView } from "@/lib/catalog/types";
import { variantPrice } from "@/lib/pricing/pricing";

import {
  type ConfiguratorProduct,
  ProductConfigurator,
} from "./product-configurator";

const link = (text: string) =>
  `https://wa.me/5511999999999?text=${encodeURIComponent(text)}`;

function variant(
  id: string,
  storage: string,
  colorName: string,
  cents: number,
  status: VariantView["availability"]["status"] = "AVAILABLE",
): VariantView {
  return {
    id,
    label: `${storage} / ${colorName}`,
    sku: null,
    storage,
    colorName,
    colorHex: "#000000",
    price: variantPrice({
      priceCash: cents,
      priceOld: null,
      priceInstallment: null,
      installments: null,
      installmentText: null,
      priceOnRequest: false,
    }),
    availability: availabilityView(status),
    isDefault: id === "256-preto",
    images: [],
    whatsappUrl: link(`Produto ${storage} ${colorName}`),
  };
}

const VARIANTS = [
  variant("256-preto", "256 GB", "Preto", 899900),
  variant("256-branco", "256 GB", "Branco", 899900),
  variant("512-preto", "512 GB", "Preto", 1049900, "PRE_ORDER"),
];

const PRODUCT: ConfiguratorProduct = {
  name: "Produto",
  badge: "Novo",
  familyName: "Família",
  shortDescription: "Resumo",
  price: { kind: "on_request", label: "Consulte valores" },
  availability: availabilityView("AVAILABLE"),
  whatsappUrl: link("Produto"),
  media: { main: null, mobile: null, gallery: [], videos: [] },
};

function whatsappHref(): string {
  return (
    screen
      .getByRole("link", { name: /Consultar no WhatsApp/ })
      .getAttribute("href") ?? ""
  );
}

describe("ProductConfigurator", () => {
  it("abre na variante padrão com preço, disponibilidade e WhatsApp dela", () => {
    render(
      <ProductConfigurator
        product={PRODUCT}
        variants={VARIANTS}
        defaultVariantId="256-preto"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Produto" }),
    ).toBeDefined();
    expect(screen.getAllByText(/R\$\s8\.999/).length).toBeGreaterThan(0);
    expect(screen.getByText("Disponível")).toBeDefined();
    expect(whatsappHref()).toBe(link("Produto 256 GB Preto"));
    expect(
      (screen.getByRole("radio", { name: "256 GB" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it("trocar a capacidade atualiza preço, disponibilidade e mensagem", () => {
    render(
      <ProductConfigurator
        product={PRODUCT}
        variants={VARIANTS}
        defaultVariantId="256-preto"
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "512 GB" }));
    expect(screen.getAllByText(/R\$\s10\.499/).length).toBeGreaterThan(0);
    expect(screen.getByText("Sob encomenda")).toBeDefined();
    expect(whatsappHref()).toBe(link("Produto 512 GB Preto"));
  });

  it("cor inexistente na capacidade escolhida troca a capacidade junto", () => {
    render(
      <ProductConfigurator
        product={PRODUCT}
        variants={VARIANTS}
        defaultVariantId="512-preto"
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /Branco/ }));
    expect(screen.getByText("Opção escolhida: 256 GB / Branco")).toBeDefined();
    expect(whatsappHref()).toBe(link("Produto 256 GB Branco"));
  });

  it("sem contato padrão, explica e oferece a loja física", () => {
    render(
      <ProductConfigurator
        product={{ ...PRODUCT, whatsappUrl: null }}
        variants={VARIANTS.map((item) => ({ ...item, whatsappUrl: null }))}
        defaultVariantId="256-preto"
      />,
    );
    expect(
      screen.queryByRole("link", { name: /Consultar no WhatsApp/ }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Fale com a loja física" }),
    ).toBeDefined();
  });

  it("produto sem variações não mostra seletor", () => {
    render(
      <ProductConfigurator
        product={PRODUCT}
        variants={[]}
        defaultVariantId={null}
      />,
    );
    expect(screen.queryByRole("radio")).toBeNull();
    // Bloco de preço e barra fixa do celular.
    expect(screen.getAllByText("Consulte valores").length).toBeGreaterThan(0);
  });
});
