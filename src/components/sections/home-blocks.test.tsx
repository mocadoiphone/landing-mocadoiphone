import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { availabilityView } from "@/lib/availability/availability";
import { type ProductCard } from "@/lib/catalog/types";
import { type HomeBlockView } from "@/lib/home/types";
import { type StoreView } from "@/lib/site/types";

import { HomeBlocks } from "./home-blocks";

const MEDIA = {
  url: "http://127.0.0.1:54321/storage/v1/object/public/media/home/a.png",
  alt: "Imagem de teste",
  kind: "IMAGE" as const,
  width: 800,
  height: 600,
};

const PRODUCT: ProductCard = {
  id: "p1",
  slug: "produto",
  name: "Produto de teste",
  badge: null,
  shortDescription: null,
  category: { slug: "iphone", name: "iPhone" },
  family: { id: "f1", slug: "familia", name: "Família" },
  price: { kind: "on_request", label: "Consulte valores" },
  availability: availabilityView("AVAILABLE"),
  image: MEDIA,
  isLaunch: true,
  isPromotion: false,
  isFeatured: false,
};

const STORE: StoreView = {
  name: "Loja",
  description: null,
  addressLines: ["Rua Exemplo, 1"],
  hours: [{ label: "Seg a sáb", value: "10h às 22h" }],
  mapUrl: "https://maps.apple.com/?q=loja",
  photos: [],
  ctaLabel: null,
  whatsappUrl: "https://wa.me/5511999999999?text=oi",
};

function block(overrides: Partial<HomeBlockView>): HomeBlockView {
  return {
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
    ...overrides,
  };
}

describe("HomeBlocks", () => {
  it("o primeiro hero vira o título principal e respeita o tema da seção", () => {
    const { container } = render(
      <HomeBlocks
        blocks={[
          block({
            id: "hero",
            title: "Título do hero",
            theme: "dark",
            eyebrow: "Novo",
            media: MEDIA,
            ctas: [
              {
                label: "Ver",
                href: "/produto/x",
                external: false,
                target: "PRODUCT",
              },
              {
                label: "WhatsApp",
                href: "https://wa.me/5511999999999?text=oi",
                external: true,
                target: "WHATSAPP",
              },
            ],
          }),
          block({ id: "cta", type: "CTA", title: "Fechamento" }),
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Título do hero" }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 2, name: "Fechamento" }),
    ).toBeDefined();
    expect(
      container.querySelector('section[data-theme="dark"]'),
    ).not.toBeNull();
    const external = screen.getByRole("link", { name: /WhatsApp/ });
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("img", { name: "Imagem de teste" })).toBeDefined();
  });

  it("grade de produtos lista os cards com link para a página do produto", () => {
    render(
      <HomeBlocks
        blocks={[
          block({
            type: "PRODUCT_GRID",
            title: "Lançamentos",
            products: [PRODUCT],
          }),
        ]}
      />,
    );
    const region = screen.getByRole("region", {
      name: "Lista de produtos: Lançamentos",
    });
    expect(
      within(region)
        .getByRole("link", { name: "Produto de teste" })
        .getAttribute("href"),
    ).toBe("/produto/produto");
    expect(within(region).getByText("Consulte valores")).toBeDefined();
  });

  it("benefícios, depoimentos e loja física usam conteúdo do painel", () => {
    render(
      <HomeBlocks
        blocks={[
          block({
            id: "f",
            type: "FEATURES",
            title: "Benefícios",
            items: [
              { title: "Retirada em loja", text: "No mesmo dia", detail: null },
            ],
          }),
          block({
            id: "r",
            type: "REVIEWS",
            title: "Clientes",
            items: [
              { title: "Ana", text: "Atendimento ótimo", detail: "iPhone" },
            ],
          }),
          block({
            id: "s",
            type: "STORE",
            title: "Visite a loja",
            store: STORE,
          }),
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Retirada em loja" }),
    ).toBeDefined();
    expect(screen.getByText("“Atendimento ótimo”")).toBeDefined();
    expect(screen.getByText("Rua Exemplo, 1")).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Como chegar/ }).getAttribute("href"),
    ).toBe("https://maps.apple.com/?q=loja");
    expect(
      screen
        .getByRole("link", { name: /Fale com a loja/ })
        .getAttribute("href"),
    ).toBe("https://wa.me/5511999999999?text=oi");
  });
});
