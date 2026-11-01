import {
  type AvailabilityStatus,
  deriveProductAvailability,
  isSellableAvailability,
  isVisibleAvailability,
} from "@/lib/availability/availability";
import {
  type PriceFields,
  productPrice,
  type PriceView,
} from "@/lib/pricing/pricing";
import { type Database } from "@/types/database";

/**
 * Estado administrativo do produto (Brain §15, §16): disponibilidade derivada,
 * preço exibido e indicadores do dashboard, a partir das variantes não excluídas.
 * Mesmas regras do site (MDI-D021), aplicadas à visão do staff.
 */
export type PublicationStatus =
  Database["public"]["Enums"]["publication_status"];

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: "Rascunho",
  REVIEWED: "Revisado",
  PUBLISHED: "Publicado",
};

export type AdminVariantRow = PriceFields & {
  availability: AvailabilityStatus;
  isDeleted: boolean;
  sortOrder: number;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  status: PublicationStatus;
  categoryId: string;
  isDeleted: boolean;
  isLaunch: boolean;
  isFeatured: boolean;
  isPromotion: boolean;
  variants: AdminVariantRow[];
};

export type AdminProductState = {
  /** Disponibilidade derivada (MDI-D006); `null` sem variante visível. */
  availability: AvailabilityStatus | null;
  price: PriceView;
  hasPrice: boolean;
  /** Publicado, mas sem como comprar: indisponível, fora de linha ou sem variante visível. */
  isUnavailable: boolean;
};

export function adminProductState(row: AdminProductRow): AdminProductState {
  const visible = row.variants
    .filter(
      (variant) =>
        !variant.isDeleted && isVisibleAvailability(variant.availability),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const availability = deriveProductAvailability(
    visible.map((variant) => variant.availability),
  );
  const price = productPrice(
    visible.filter((variant) => isSellableAvailability(variant.availability)),
  );
  return {
    availability,
    price,
    hasPrice: price.kind === "priced",
    isUnavailable:
      availability === null ||
      availability === "OUT_OF_STOCK" ||
      availability === "DISCONTINUED",
  };
}

export type DashboardMetrics = {
  published: number;
  inProgress: number;
  unavailable: number;
  withoutPrice: number;
  launches: number;
  promotions: number;
};

/** Indicadores do dashboard (Brain §15). Considera só produtos não excluídos. */
export function dashboardMetrics(
  rows: readonly AdminProductRow[],
): DashboardMetrics {
  const metrics: DashboardMetrics = {
    published: 0,
    inProgress: 0,
    unavailable: 0,
    withoutPrice: 0,
    launches: 0,
    promotions: 0,
  };
  for (const row of rows) {
    if (row.isDeleted) continue;
    const state = adminProductState(row);
    const published = row.status === "PUBLISHED";
    if (published) metrics.published += 1;
    else metrics.inProgress += 1;
    if (published && state.isUnavailable) metrics.unavailable += 1;
    if (!state.hasPrice) metrics.withoutPrice += 1;
    if (published && row.isLaunch) metrics.launches += 1;
    if (published && row.isPromotion) metrics.promotions += 1;
  }
  return metrics;
}
