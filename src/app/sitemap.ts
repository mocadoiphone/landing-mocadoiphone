import { type MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { createSitemap } from "@/lib/seo/sitemap";
import { getSitemapSource } from "@/services/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await getSitemapSource(), siteConfig.url);
}
