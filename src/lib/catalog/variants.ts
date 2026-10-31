import {
  type AvailabilityStatus,
  isVisibleAvailability,
} from "@/lib/availability/availability";

/**
 * Regras de variante (Brain §10; MDI-D005, MDI-D021).
 */

type VariantOrder = {
  sortOrder: number;
  storage: string | null;
  colorName: string | null;
};

const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

/** "256 GB / Preto" (interface). */
export function variantLabel(variant: {
  storage: string | null;
  colorName: string | null;
}): string | null {
  const parts = [variant.storage, variant.colorName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" / ") : null;
}

/** "256 GB Preto" (mensagem do WhatsApp, Brain §13). */
export function variantMessageLabel(variant: {
  storage: string | null;
  colorName: string | null;
}): string | null {
  return variantLabel(variant)?.replace(" / ", " ") ?? null;
}

/** Ordem de exibição: `sort_order`, depois capacidade e cor em ordem natural. */
export function compareVariants(a: VariantOrder, b: VariantOrder): number {
  return (
    a.sortOrder - b.sortOrder ||
    collator.compare(a.storage ?? "", b.storage ?? "") ||
    collator.compare(a.colorName ?? "", b.colorName ?? "")
  );
}

/**
 * Variante padrão efetiva: a marcada como padrão, se visível; senão a primeira
 * visível na ordem de exibição. Cobre produtos cuja padrão foi ocultada.
 */
export function effectiveDefaultVariant<
  T extends VariantOrder & {
    isDefault: boolean;
    availability: AvailabilityStatus;
  },
>(variants: readonly T[]): T | null {
  const visible = variants
    .filter((variant) => isVisibleAvailability(variant.availability))
    .sort(compareVariants);
  return visible.find((variant) => variant.isDefault) ?? visible[0] ?? null;
}
