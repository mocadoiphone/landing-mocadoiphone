import "server-only";

import {
  type AvailabilityStatus,
  availabilityView,
  deriveProductAvailability,
  isSellableAvailability,
  isVisibleAvailability,
} from "@/lib/availability/availability";
import { mergeRelatedProducts } from "@/lib/catalog/related";
import {
  type CategoryPage,
  type CategorySummary,
  type MediaView,
  type ProductCard,
  type ProductDetail,
  type SpecGroup,
  type VariantView,
} from "@/lib/catalog/types";
import {
  compareVariants,
  effectiveDefaultVariant,
  variantLabel,
  variantMessageLabel,
} from "@/lib/catalog/variants";
import {
  effectiveAlt,
  type MediaKind,
  publicMediaUrl,
} from "@/lib/media/media";
import {
  type PriceFields,
  productPrice,
  variantPrice,
} from "@/lib/pricing/pricing";
import { type WhatsAppConfig, whatsAppLinkFor } from "@/lib/whatsapp/whatsapp";

/**
 * Linhas do banco (formato das consultas públicas) → DTOs das páginas.
 * Funções puras: recebem a URL do Supabase e a configuração do WhatsApp.
 */

export type MediaAssetRow = {
  storage_path: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  kind: MediaKind;
};

export type ProductMediaRow = {
  slot: string;
  variant_id: string | null;
  alt_text: string | null;
  sort_order: number;
  asset: MediaAssetRow | null;
};

export type VariantRow = {
  id: string;
  sku: string | null;
  storage: string | null;
  color_name: string | null;
  color_hex: string | null;
  sort_order: number;
  is_default: boolean;
  availability: AvailabilityStatus;
  price_cash: number | null;
  price_old: number | null;
  price_installment: number | null;
  installments: number | null;
  installment_text: string | null;
  price_on_request: boolean;
};

export type ProductCardRow = {
  id: string;
  slug: string;
  name: string;
  badge: string | null;
  short_description: string | null;
  is_launch: boolean;
  is_promotion: boolean;
  is_featured: boolean;
  category: { slug: string; name: string } | null;
  family: { id: string; slug: string; name: string; sort_order: number } | null;
  variants: VariantRow[];
  media: ProductMediaRow[];
};

export type ProductDetailRow = ProductCardRow & {
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  updated_at: string;
  og_image: MediaAssetRow | null;
  related: ProductCardRow | null;
  specs: {
    group_name: string | null;
    label: string;
    value: string;
    sort_order: number;
  }[];
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: MediaAssetRow | null;
};

export function toMediaView(
  supabaseUrl: string,
  asset: MediaAssetRow,
  altOverride?: string | null,
): MediaView {
  return {
    url: publicMediaUrl(supabaseUrl, asset.storage_path),
    alt: effectiveAlt(altOverride, asset.alt_text),
    kind: asset.kind,
    width: asset.width,
    height: asset.height,
  };
}

function toPriceFields(row: VariantRow): PriceFields {
  return {
    priceCash: row.price_cash,
    priceOld: row.price_old,
    priceInstallment: row.price_installment,
    installments: row.installments,
    installmentText: row.installment_text,
    priceOnRequest: row.price_on_request,
  };
}

function toOrderable(row: VariantRow) {
  return {
    row,
    sortOrder: row.sort_order,
    storage: row.storage,
    colorName: row.color_name,
    isDefault: row.is_default,
    availability: row.availability,
  };
}

// Defesa extra: a RLS do anônimo já exclui variantes ocultas.
function visibleVariants(rows: readonly VariantRow[]) {
  return rows
    .filter((row) => isVisibleAvailability(row.availability))
    .map(toOrderable)
    .sort(compareVariants);
}

function mediaBySlot(
  supabaseUrl: string,
  rows: readonly ProductMediaRow[],
  slot: string,
  variantId: string | null = null,
): MediaView[] {
  return rows
    .filter(
      (row) =>
        row.slot === slot && row.variant_id === variantId && row.asset !== null,
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((row) =>
      row.asset ? [toMediaView(supabaseUrl, row.asset, row.alt_text)] : [],
    );
}

export function toCategorySummary(
  supabaseUrl: string,
  row: CategoryRow,
): CategorySummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image ? toMediaView(supabaseUrl, row.image) : null,
  };
}

export function toProductCard(
  supabaseUrl: string,
  row: ProductCardRow,
): ProductCard {
  const visible = visibleVariants(row.variants);
  const sellable = visible.filter((variant) =>
    isSellableAvailability(variant.availability),
  );
  const availability = deriveProductAvailability(
    visible.map((variant) => variant.availability),
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    badge: row.badge,
    shortDescription: row.short_description,
    category: {
      slug: row.category?.slug ?? "",
      name: row.category?.name ?? "",
    },
    family: {
      id: row.family?.id ?? "",
      slug: row.family?.slug ?? "",
      name: row.family?.name ?? "",
    },
    price: productPrice(sellable.map((variant) => toPriceFields(variant.row))),
    availability: availability ? availabilityView(availability) : null,
    image: mediaBySlot(supabaseUrl, row.media, "MAIN")[0] ?? null,
    isLaunch: row.is_launch,
    isPromotion: row.is_promotion,
    isFeatured: row.is_featured,
  };
}

function groupSpecs(rows: ProductDetailRow["specs"]): SpecGroup[] {
  const groups = new Map<string | null, SpecGroup>();
  for (const spec of [...rows].sort((a, b) => a.sort_order - b.sort_order)) {
    const name = spec.group_name?.trim() || null;
    const group = groups.get(name) ?? { name, items: [] };
    group.items.push({ label: spec.label, value: spec.value });
    groups.set(name, group);
  }
  return [...groups.values()];
}

export function toProductDetail(
  supabaseUrl: string,
  row: ProductDetailRow,
  whatsapp: WhatsAppConfig,
  sameFamily: readonly ProductCardRow[] = [],
): ProductDetail {
  const visible = visibleVariants(row.variants);
  const defaultVariant = effectiveDefaultVariant(visible);

  const variants: VariantView[] = visible.map(({ row: variant }) => ({
    id: variant.id,
    label: variantLabel({
      storage: variant.storage,
      colorName: variant.color_name,
    }),
    sku: variant.sku,
    storage: variant.storage,
    colorName: variant.color_name,
    colorHex: variant.color_hex,
    priceCashCents: variant.price_on_request ? null : variant.price_cash,
    price: variantPrice(toPriceFields(variant)),
    availability: availabilityView(variant.availability),
    isDefault: variant.id === defaultVariant?.row.id,
    images: [
      ...mediaBySlot(supabaseUrl, row.media, "MAIN", variant.id),
      ...mediaBySlot(supabaseUrl, row.media, "GALLERY", variant.id),
    ],
    whatsappUrl: whatsAppLinkFor(whatsapp, {
      productName: row.name,
      variantLabel: variantMessageLabel({
        storage: variant.storage,
        colorName: variant.color_name,
      }),
    }),
  }));

  const card = toProductCard(supabaseUrl, row);
  return {
    ...card,
    description: row.description,
    variants,
    defaultVariantId: defaultVariant?.row.id ?? null,
    media: {
      main: mediaBySlot(supabaseUrl, row.media, "MAIN")[0] ?? null,
      mobile: mediaBySlot(supabaseUrl, row.media, "MOBILE")[0] ?? null,
      gallery: mediaBySlot(supabaseUrl, row.media, "GALLERY"),
      videos: mediaBySlot(supabaseUrl, row.media, "VIDEO"),
    },
    specs: groupSpecs(row.specs),
    seo: {
      title: row.meta_title?.trim() || row.name,
      description:
        row.meta_description?.trim() || row.short_description?.trim() || null,
      canonicalUrl: row.canonical_url,
      image: row.og_image ? toMediaView(supabaseUrl, row.og_image) : card.image,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
    },
    relatedProducts: mergeRelatedProducts(
      row.id,
      row.related ? toProductCard(supabaseUrl, row.related) : null,
      sameFamily.map((sibling) => toProductCard(supabaseUrl, sibling)),
    ),
    whatsappUrl: whatsAppLinkFor(whatsapp, { productName: row.name }),
  };
}

export function toCategoryPage(
  supabaseUrl: string,
  category: CategoryRow,
  products: readonly ProductCardRow[],
): CategoryPage {
  type FamilyGroup = CategoryPage["families"][number];
  const families = new Map<string, { sortOrder: number; group: FamilyGroup }>();
  for (const row of products) {
    if (!row.family) continue;
    const entry = families.get(row.family.id) ?? {
      sortOrder: row.family.sort_order,
      group: {
        id: row.family.id,
        slug: row.family.slug,
        name: row.family.name,
        products: [],
      },
    };
    entry.group.products.push(toProductCard(supabaseUrl, row));
    families.set(row.family.id, entry);
  }

  return {
    category: toCategorySummary(supabaseUrl, category),
    families: [...families.values()]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.group.name.localeCompare(b.group.name, "pt-BR"),
      )
      .map((entry) => entry.group),
  };
}
