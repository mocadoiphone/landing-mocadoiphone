import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { pageRobots } from "@/lib/seo/metadata";
import "@/styles/globals.css";

const siteDescription = "Produtos Apple com atendimento especializado.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteDescription,
  },
  robots: pageRobots(siteConfig.indexingEnabled),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.locale} className="antialiased">
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
