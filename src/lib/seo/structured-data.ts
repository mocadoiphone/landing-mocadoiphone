import { type AvailabilityStatus } from "@/lib/availability/availability";
import {
  type CategorySummary,
  type MediaView,
  type ProductDetail,
} from "@/lib/catalog/types";
import { categoryPath, productPath } from "@/lib/site/routes";
import { type SiteChrome } from "@/lib/site/types";

import { absoluteUrl } from "./metadata";

export type JsonLdValue = Record<string, unknown>;

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const schemaAvailability: Partial<Record<AvailabilityStatus, string>> = {
  AVAILABLE: "https://schema.org/InStock",
  PRE_ORDER: "https://schema.org/PreOrder",
  ON_REQUEST: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  DISCONTINUED: "https://schema.org/Discontinued",
};

export function organizationJsonLd(
  chrome: SiteChrome,
  siteUrl: string,
): JsonLdValue {
  const organizationId = `${new URL(siteUrl).origin}/#organization`;
  const graph: JsonLdValue[] = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: chrome.siteName,
      url: new URL(siteUrl).origin,
    },
  ];

  if (chrome.store.addressLines.length > 0) {
    graph.push({
      "@type": "LocalBusiness",
      "@id": `${absoluteUrl("/loja", siteUrl)}#local-business`,
      name: chrome.store.name ?? chrome.siteName,
      url: absoluteUrl("/loja", siteUrl),
      parentOrganization: { "@id": organizationId },
      address: {
        "@type": "PostalAddress",
        streetAddress: chrome.store.addressLines.join(", "),
      },
      ...(chrome.contact.phoneLabel
        ? { telephone: chrome.contact.phoneLabel }
        : {}),
      ...(chrome.store.photos.length > 0
        ? { image: chrome.store.photos.map((photo) => photo.url) }
        : {}),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function breadcrumbJsonLd(
  items: readonly { name: string; path: string }[],
  siteUrl: string,
): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

function productImages(product: ProductDetail): string[] {
  const images: (MediaView | null)[] = [
    product.seo.image,
    product.media.main,
    ...product.media.gallery,
  ];
  return [...new Set(images.flatMap((image) => (image ? [image.url] : [])))];
}

export function productJsonLd(
  product: ProductDetail,
  canonicalUrl: string,
): JsonLdValue {
  const offers = product.variants.flatMap((variant) => {
    const availability = schemaAvailability[variant.availability.status];
    if (variant.priceCashCents === null || !availability) return [];
    return [
      {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "BRL",
        price: (variant.priceCashCents / 100).toFixed(2),
        availability,
        ...(variant.label ? { name: variant.label } : {}),
      },
    ];
  });
  const images = productImages(product);
  const description =
    product.seo.description ??
    product.shortDescription ??
    product.description ??
    undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: product.name,
    url: canonicalUrl,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(offers.length > 0 ? { offers } : {}),
  };
}

export function categoryBreadcrumbJsonLd(
  category: CategorySummary,
  siteUrl: string,
): JsonLdValue {
  return breadcrumbJsonLd(
    [
      { name: "Início", path: "/" },
      { name: category.name, path: categoryPath(category.slug) },
    ],
    siteUrl,
  );
}

export function productBreadcrumbJsonLd(
  product: ProductDetail,
  siteUrl: string,
): JsonLdValue {
  return breadcrumbJsonLd(
    [
      { name: "Início", path: "/" },
      {
        name: product.category.name,
        path: categoryPath(product.category.slug),
      },
      { name: product.name, path: productPath(product.slug) },
    ],
    siteUrl,
  );
}
