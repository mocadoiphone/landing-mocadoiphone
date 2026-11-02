import { type MetadataRoute } from "next";

import { productPath } from "@/lib/site/routes";

import { absoluteUrl } from "./metadata";

export type SitemapSource = {
  categories: { slug: string; updatedAt: string }[];
  products: {
    slug: string;
    updatedAt: string;
    imageUrl: string | null;
  }[];
};

const FIXED_ROUTES = ["/", "/ofertas", "/lancamentos", "/loja"] as const;

export function createSitemap(
  source: SitemapSource,
  siteUrl: string,
): MetadataRoute.Sitemap {
  return [
    ...FIXED_ROUTES.map((path, index) => ({
      url: absoluteUrl(path, siteUrl),
      changeFrequency: "daily" as const,
      priority: index === 0 ? 1 : 0.7,
    })),
    ...source.categories.map((category) => ({
      url: absoluteUrl(`/${category.slug}`, siteUrl),
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...source.products.map((product) => ({
      url: absoluteUrl(productPath(product.slug), siteUrl),
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    })),
  ];
}
