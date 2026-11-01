import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { availabilityView } from "@/lib/availability/availability";

import { AvailabilityBadge } from "./availability-badge";
import { PriceBlock } from "./price-block";

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
