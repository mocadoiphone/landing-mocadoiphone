import { type Database } from "@/types/database";

/**
 * Disponibilidade (Brain §12; MDI-D006). Existe só na variante; a do produto é derivada.
 */
export type AvailabilityStatus =
  Database["public"]["Enums"]["availability_status"];

export type AvailabilityView = { status: AvailabilityStatus; label: string };

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Disponível",
  PRE_ORDER: "Sob encomenda",
  ON_REQUEST: "Consulte disponibilidade",
  OUT_OF_STOCK: "Indisponível",
  DISCONTINUED: "Fora de linha",
  HIDDEN: "Oculto",
};

// Prioridade da disponibilidade exibida para o produto (MDI-D006).
const PRODUCT_PRIORITY: readonly AvailabilityStatus[] = [
  "AVAILABLE",
  "PRE_ORDER",
  "ON_REQUEST",
  "OUT_OF_STOCK",
  "DISCONTINUED",
];

/** HIDDEN oculta a variante do público (não é um estado comercial). */
export function isVisibleAvailability(status: AvailabilityStatus): boolean {
  return status !== "HIDDEN";
}

/** Variante entra no "a partir de": visível e não descontinuada (igual a price_from). */
export function isSellableAvailability(status: AvailabilityStatus): boolean {
  return status !== "HIDDEN" && status !== "DISCONTINUED";
}

export function availabilityView(status: AvailabilityStatus): AvailabilityView {
  return { status, label: AVAILABILITY_LABELS[status] };
}

/** Disponibilidade do produto = a melhor entre as variantes visíveis. */
export function deriveProductAvailability(
  statuses: Iterable<AvailabilityStatus>,
): AvailabilityStatus | null {
  const present = new Set(statuses);
  return PRODUCT_PRIORITY.find((status) => present.has(status)) ?? null;
}
