import { describe, expect, it } from "vitest";

import { availabilityView } from "@/lib/availability/availability";
import { type ProductDetail } from "@/lib/catalog/types";

import { createPageMetadata, createRobots } from "./metadata";
import { createSitemap } from "./sitemap";
import { productJsonLd, serializeJsonLd } from "./structured-data";

const SITE_URL = "https://mocadoiphone.com";
const image = {
  url: "https://project.supabase.co/storage/v1/object/public/media/products/p.png",
  alt: "Produto de teste",
  kind: "IMAGE" as const,
  width: 1200,
  height: 630,
};

const product: ProductDetail = {
  id: "produto-1",
  slug: "produto-de-teste",
  name: "Produto de teste",
  badge: null,
  shortDescription: "Descrição real do produto.",
  category: { slug: "mac", name: "Mac" },
  family: { id: "familia-1", slug: "familia", name: "Família" },
  price: {
    kind: "priced",
    prefix: null,
    amount: "R$ 8.999",
    previous: null,
    installment: null,
  },
  availability: availabilityView("AVAILABLE"),
  image,
  isLaunch: false,
  isPromotion: false,
  isFeatured: false,
  description: null,
  variants: [
    {
      id: "variante-1",
      label: "256 GB / Preto",
      sku: null,
      storage: "256 GB",
      colorName: "Preto",
      colorHex: null,
      priceCashCents: 899900,
      price: {
        kind: "priced",
        prefix: null,
        amount: "R$ 8.999",
        previous: null,
        installment: null,
      },
      availability: availabilityView("AVAILABLE"),
      isDefault: true,
      images: [],
      whatsappUrl: null,
    },
  ],
  defaultVariantId: "variante-1",
  media: { main: image, mobile: null, gallery: [], videos: [] },
  specs: [],
  seo: {
    title: "Título cadastrado",
    description: "Descrição cadastrada",
    canonicalUrl: null,
    image,
    publishedAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-02T10:00:00.000Z",
  },
  relatedProducts: [],
  whatsappUrl: null,
};

describe("SEO", () => {
  it("gera canonical, Open Graph e Twitter com a imagem real", () => {
    const metadata = createPageMetadata({
      title: product.seo.title,
      description: product.seo.description,
      path: "/produto/produto-de-teste",
      siteName: "Moça do iPhone",
      siteUrl: SITE_URL,
      image,
    });

    expect(metadata.alternates).toEqual({
      canonical: "https://mocadoiphone.com/produto/produto-de-teste",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Título cadastrado",
      images: [{ url: image.url, alt: image.alt }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("mantém crawling bloqueado até a configuração explícita", () => {
    expect(createRobots(false, SITE_URL)).toMatchObject({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(createRobots(true, SITE_URL)).toMatchObject({
      rules: { allow: "/", disallow: ["/admin", "/admin/", "/api/"] },
      sitemap: "https://mocadoiphone.com/sitemap.xml",
    });
  });

  it("gera sitemap só com as fontes públicas recebidas", () => {
    const sitemap = createSitemap(
      {
        categories: [{ slug: "mac", updatedAt: "2026-11-01" }],
        products: [
          {
            slug: "produto-de-teste",
            updatedAt: "2026-11-02",
            imageUrl: image.url,
          },
        ],
      },
      SITE_URL,
    );

    expect(sitemap.map((entry) => entry.url)).toEqual([
      "https://mocadoiphone.com/",
      "https://mocadoiphone.com/ofertas",
      "https://mocadoiphone.com/lancamentos",
      "https://mocadoiphone.com/loja",
      "https://mocadoiphone.com/mac",
      "https://mocadoiphone.com/produto/produto-de-teste",
    ]);
    expect(JSON.stringify(sitemap)).not.toContain("admin");
  });

  it("gera Product e Offer apenas com preço e disponibilidade reais", () => {
    const jsonLd = productJsonLd(
      product,
      "https://mocadoiphone.com/produto/produto-de-teste",
    );
    expect(jsonLd).toMatchObject({
      "@type": "Product",
      name: "Produto de teste",
      offers: [
        {
          "@type": "Offer",
          price: "8999.00",
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        },
      ],
    });
    expect(jsonLd).not.toHaveProperty("brand");
    expect(jsonLd).not.toHaveProperty("aggregateRating");
    expect(jsonLd).not.toHaveProperty("gtin");
  });

  it("escapa fechamento de script no JSON-LD", () => {
    expect(serializeJsonLd({ name: "</script><script>" })).toContain(
      "\\u003c/script>",
    );
  });
});
