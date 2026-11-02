import { type Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { pageRobots } from "@/lib/seo/metadata";
import { organizationJsonLd } from "@/lib/seo/structured-data";
import { getSiteChrome } from "@/services/site/queries";

// A indexação continua bloqueada até o go-live e só muda por variável explícita.
export const metadata: Metadata = {
  robots: pageRobots(siteConfig.indexingEnabled),
};

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const chrome = await getSiteChrome();
  return (
    <>
      <JsonLd value={organizationJsonLd(chrome, siteConfig.url)} />
      <SiteHeader chrome={chrome} />
      <div id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <SiteFooter chrome={chrome} />
    </>
  );
}
