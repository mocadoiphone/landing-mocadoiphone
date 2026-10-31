import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.name} 2.0`,
  description: "Fundação técnica do projeto Moça do iPhone 2.0.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.locale} className="antialiased">
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
