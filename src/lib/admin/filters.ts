import { type AvailabilityStatus } from "@/lib/availability/availability";

import {
  adminProductState,
  type AdminProductRow,
  type PublicationStatus,
} from "./products";

/**
 * Filtros da lista de produtos (Brain §16), guardados na URL para que a lista
 * filtrada possa ser compartilhada, recarregada e aberta pelos cartões do dashboard.
 */
export const PRODUCTS_PAGE_SIZE = 50;

export type ProductFilters = {
  q: string;
  category: string | null;
  status: PublicationStatus | null;
  /** Disponibilidade derivada, mais os atalhos do dashboard. */
  availability: AvailabilityStatus | "unavailable" | null;
  withoutPrice: boolean;
  launch: boolean;
  featured: boolean;
  promotion: boolean;
  trash: boolean;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const STATUSES: readonly PublicationStatus[] = [
  "DRAFT",
  "REVIEWED",
  "PUBLISHED",
];
const AVAILABILITIES: readonly string[] = [
  "AVAILABLE",
  "PRE_ORDER",
  "ON_REQUEST",
  "OUT_OF_STOCK",
  "DISCONTINUED",
  "unavailable",
];

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseProductFilters(params: SearchParams): ProductFilters {
  const status = first(params.status);
  const availability = first(params.disponibilidade);
  const page = Number.parseInt(first(params.pagina), 10);
  return {
    q: first(params.q).slice(0, 100),
    category: first(params.categoria) || null,
    status: (STATUSES as readonly string[]).includes(status)
      ? (status as PublicationStatus)
      : null,
    availability: AVAILABILITIES.includes(availability)
      ? (availability as ProductFilters["availability"])
      : null,
    withoutPrice: first(params.semPreco) === "1",
    launch: first(params.lancamento) === "1",
    featured: first(params.destaque) === "1",
    promotion: first(params.promocao) === "1",
    trash: first(params.lixeira) === "1",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Query string dos filtros (sem os vazios), para links e paginação. */
export function productFiltersQuery(filters: Partial<ProductFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("categoria", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.availability) params.set("disponibilidade", filters.availability);
  if (filters.withoutPrice) params.set("semPreco", "1");
  if (filters.launch) params.set("lancamento", "1");
  if (filters.featured) params.set("destaque", "1");
  if (filters.promotion) params.set("promocao", "1");
  if (filters.trash) params.set("lixeira", "1");
  if (filters.page && filters.page > 1)
    params.set("pagina", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Aplica os filtros que dependem de regra (disponibilidade derivada, preço, busca). */
export function filterProducts<T extends AdminProductRow>(
  rows: readonly T[],
  filters: ProductFilters,
): T[] {
  const query = normalize(filters.q);
  return rows.filter((row) => {
    if (row.isDeleted !== filters.trash) return false;
    if (query && !normalize(row.name).includes(query)) return false;
    if (filters.category && row.categoryId !== filters.category) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.launch && !row.isLaunch) return false;
    if (filters.featured && !row.isFeatured) return false;
    if (filters.promotion && !row.isPromotion) return false;

    if (filters.availability || filters.withoutPrice) {
      const state = adminProductState(row);
      if (filters.withoutPrice && state.hasPrice) return false;
      if (filters.availability === "unavailable") {
        if (row.status !== "PUBLISHED" || !state.isUnavailable) return false;
      } else if (
        filters.availability &&
        state.availability !== filters.availability
      ) {
        return false;
      }
    }
    return true;
  });
}

export function paginate<T>(
  rows: readonly T[],
  page: number,
): { items: T[]; page: number; pageCount: number; total: number } {
  const pageCount = Math.max(1, Math.ceil(rows.length / PRODUCTS_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  return {
    items: rows.slice(
      (current - 1) * PRODUCTS_PAGE_SIZE,
      current * PRODUCTS_PAGE_SIZE,
    ),
    page: current,
    pageCount,
    total: rows.length,
  };
}
