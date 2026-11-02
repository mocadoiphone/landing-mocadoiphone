import { type Metadata, type MetadataRoute } from "next";

import { type MediaView } from "@/lib/catalog/types";

export type PageMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  siteName: string;
  siteUrl: string;
  canonicalUrl?: string | null;
  image?: MediaView | null;
};

export function absoluteUrl(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}

export function resolveCanonicalUrl(
  candidate: string | null | undefined,
  path: string,
  siteUrl: string,
): string {
  const fallback = absoluteUrl(path, siteUrl);
  if (!candidate?.trim()) return fallback;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function socialImage(image: MediaView) {
  return {
    url: image.url,
    alt: image.alt,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };
}

/** Metadata compartilhada pelas páginas públicas, sem fabricar texto ou mídia. */
export function createPageMetadata(input: PageMetadataInput): Metadata {
  const description = input.description?.trim() || undefined;
  const canonical = resolveCanonicalUrl(
    input.canonicalUrl,
    input.path,
    input.siteUrl,
  );
  const images = input.image ? [socialImage(input.image)] : undefined;

  return {
    title: input.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: input.siteName,
      title: input.title,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: input.image ? "summary_large_image" : "summary",
      title: input.title,
      description,
      images: input.image
        ? [{ url: input.image.url, alt: input.image.alt }]
        : undefined,
    },
  };
}

/** Crawling e indexação só são liberados por configuração explícita. */
export function createRobots(
  indexingEnabled: boolean,
  siteUrl: string,
): MetadataRoute.Robots {
  if (!indexingEnabled) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      host: new URL(siteUrl).origin,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml", siteUrl),
    host: new URL(siteUrl).origin,
  };
}

export function pageRobots(indexingEnabled: boolean): Metadata["robots"] {
  return indexingEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true };
}
