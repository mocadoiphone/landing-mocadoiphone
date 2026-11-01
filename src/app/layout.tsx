import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

// Título e descrição básicos; SEO completo (OG, JSON-LD, sitemap) na Etapa 07.
export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: "Produtos Apple com atendimento especializado.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.locale} className="antialiased">
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
