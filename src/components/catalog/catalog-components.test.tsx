import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { availabilityView } from "@/lib/availability/availability";
import { type VariantView } from "@/lib/catalog/types";
import { variantPrice } from "@/lib/pricing/pricing";

import { AvailabilityBadge } from "./availability-badge";
import { PriceBlock } from "./price-block";
import { VariantList } from "./variant-list";

const NBSP = " ";

describe("PriceBlock", () => {
  it("mostra preço, parcela e 'a partir de'", () => {
    render(
      <PriceBlock
        price={{
          kind: "priced",
          prefix: "A partir de",
          amount: `R$${NBSP}8.999`,
          previous: null,
          installment: `ou 18x de R$${NBSP}549,90`,
        }}
      />,
    );
    // A Testing Library normaliza o espaço não separável na busca por texto.
    expect(screen.getByText("A partir de")).toBeDefined();
    expect(screen.getByText(/R\$\s8\.999$/)).toBeDefined();
    expect(screen.getByText(/^ou 18x de R\$\s549,90$/)).toBeDefined();
  });

  it("promoção mostra o preço anterior riscado com texto para leitor de tela", () => {
    const { container } = render(
      <PriceBlock
        price={{
          kind: "priced",
          prefix: null,
          amount: `R$${NBSP}7.999`,
          previous: `R$${NBSP}8.999`,
          installment: null,
        }}
      />,
    );
    expect(container.querySelector("s")?.textContent).toBe(`R$${NBSP}8.999`);
    expect(screen.getByText("Preço anterior:", { exact: false })).toBeDefined();
  });

  it("sem preço mostra 'Consulte valores'", () => {
    render(
      <PriceBlock price={{ kind: "on_request", label: "Consulte valores" }} />,
    );
    expect(screen.getByText("Consulte valores")).toBeDefined();
  });
});

describe("AvailabilityBadge", () => {
  it("mostra o rótulo do Brain §12 para indisponível", () => {
    render(
      <AvailabilityBadge availability={availabilityView("OUT_OF_STOCK")} />,
    );
    const badge = screen.getByText("Indisponível");
    expect(badge.dataset.status).toBe("OUT_OF_STOCK");
  });

  it("sem disponibilidade não renderiza nada", () => {
    const { container } = render(<AvailabilityBadge availability={null} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("VariantList", () => {
  const variant = (overrides: Partial<VariantView>): VariantView => ({
    id: "v1",
    label: "256 GB / Preto",
    sku: null,
    storage: "256 GB",
    colorName: "Preto",
    colorHex: "#000000",
    price: variantPrice({
      priceCash: 899900,
      priceOld: null,
      priceInstallment: null,
      installments: null,
      installmentText: null,
      priceOnRequest: false,
    }),
    availability: availabilityView("AVAILABLE"),
    isDefault: false,
    images: [],
    whatsappUrl: "https://wa.me/5511999999999?text=ol%C3%A1",
    ...overrides,
  });

  it("lista variantes com WhatsApp contextual e marca a padrão", () => {
    render(
      <VariantList
        variants={[
          variant({ id: "v1", isDefault: true }),
          variant({ id: "v2", label: "512 GB / Preto", whatsappUrl: null }),
        ]}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe(
      "https://wa.me/5511999999999?text=ol%C3%A1",
    );
    expect(links[0]?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText("(padrão)")).toBeDefined();
    expect(screen.getByText("512 GB / Preto")).toBeDefined();
  });
});
