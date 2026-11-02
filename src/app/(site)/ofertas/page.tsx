import { type Metadata } from "next";

import { ShowcasePage } from "@/components/product/showcase-page";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getShowcase } from "@/services/catalog/queries";
import { getSiteChrome } from "@/services/site/queries";

export const metadata: Metadata = createPageMetadata({
  title: "Ofertas",
  description: "Condições especiais selecionadas pela loja.",
  path: "/ofertas",
  siteName: siteConfig.name,
  siteUrl: siteConfig.url,
});

// Produtos marcados como promoção no painel (Brain §6).
export default async function OffersPage() {
  const [products, chrome] = await Promise.all([
    getShowcase("promotion"),
    getSiteChrome(),
  ]);
  return (
    <ShowcasePage
      title="Ofertas"
      description="Condições especiais selecionadas pela loja."
      products={products}
      emptyTitle="Nenhuma oferta no momento."
      whatsappUrl={chrome.contact.whatsappUrl}
    />
  );
}
