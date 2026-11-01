import { type PriceFields } from "@/lib/pricing/pricing";
import type { EditorVariant } from "@/services/admin/queries";

/** Variante do editor (colunas do banco) → campos das regras de preço. */
export function variantPriceFields(variant: EditorVariant): PriceFields {
  return {
    priceCash: variant.price_cash,
    priceOld: variant.price_old,
    priceInstallment: variant.price_installment,
    installments: variant.installments,
    installmentText: variant.installment_text,
    priceOnRequest: variant.price_on_request,
  };
}

export function variantName(
  variant: Pick<EditorVariant, "storage" | "color_name">,
): string {
  const parts = [variant.storage, variant.color_name].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Modelo único";
}
