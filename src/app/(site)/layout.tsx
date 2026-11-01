import { type Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteChrome } from "@/services/site/queries";

// Site público (Etapa 05). Fica fora dos buscadores até a Etapa 07 (SEO) e o
// go-live (Etapa 10). Cabeçalho e rodapé vêm de uma consulta cacheada (MDI-D031).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const chrome = await getSiteChrome();
  return (
    <>
      <SiteHeader chrome={chrome} />
      <div id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <SiteFooter chrome={chrome} />
    </>
  );
}
