import { type Metadata } from "next";

import { ShowcasePage } from "@/components/product/showcase-page";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getShowcase } from "@/services/catalog/queries";
import { getSiteChrome } from "@/services/site/queries";

export const metadata: Metadata = createPageMetadata({
  title: "Lançamentos",
  description: "Os produtos Apple mais recentes disponíveis na loja.",
  path: "/lancamentos",
  siteName: siteConfig.name,
  siteUrl: siteConfig.url,
});

// Produtos marcados como lançamento no painel (Brain §6, §7.3).
export default async function LaunchesPage() {
  const [products, chrome] = await Promise.all([
    getShowcase("launch"),
    getSiteChrome(),
  ]);
  return (
    <ShowcasePage
      title="Lançamentos"
      description="Os produtos Apple mais recentes disponíveis na loja."
      products={products}
      emptyTitle="Nenhum lançamento no momento."
      whatsappUrl={chrome.contact.whatsappUrl}
    />
  );
}
