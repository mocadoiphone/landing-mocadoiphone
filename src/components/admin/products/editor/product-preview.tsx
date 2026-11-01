"use client";

import { useState } from "react";

import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { MediaImage } from "@/components/catalog/media-image";
import { PriceBlock } from "@/components/catalog/price-block";
import {
  PUBLICATION_STATUS_LABELS,
  type PublicationStatus,
} from "@/lib/admin/products";
import {
  availabilityView,
  deriveProductAvailability,
  isSellableAvailability,
  isVisibleAvailability,
} from "@/lib/availability/availability";
import { effectiveDefaultVariant } from "@/lib/catalog/variants";
import { productPrice, variantPrice } from "@/lib/pricing/pricing";
import type { EditorVariant } from "@/services/admin/queries";

import { type PanelMedia, toMediaView } from "../../media/media-helpers";
import { Badge } from "../../ui/feedback";

import { variantName, variantPriceFields } from "./variant-utils";

/**
 * Pré-visualização com as MESMAS regras do site (MDI-D021): preço do produto,
 * parcelamento, disponibilidade derivada, variante selecionada e publicação.
 */
export function ProductPreview({
  name,
  status,
  variants,
  mainImage,
  issuesCount,
}: {
  name: string;
  status: PublicationStatus;
  variants: EditorVariant[];
  mainImage: (PanelMedia & { altOverride: string | null }) | null;
  issuesCount: number;
}) {
  const active = variants.filter((variant) => variant.deleted_at === null);
  const orderable = active.map((variant) => ({
    variant,
    sortOrder: variant.sort_order,
    storage: variant.storage,
    colorName: variant.color_name,
    isDefault: variant.is_default,
    availability: variant.availability,
  }));
  const effectiveDefault = effectiveDefaultVariant(orderable)?.variant ?? null;
  const [selectedId, setSelectedId] = useState(
    effectiveDefault?.id ?? active[0]?.id ?? "",
  );
  const selected = active.find((variant) => variant.id === selectedId) ?? null;

  const visible = active.filter((variant) =>
    isVisibleAvailability(variant.availability),
  );
  const price = productPrice(
    visible
      .filter((variant) => isSellableAvailability(variant.availability))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(variantPriceFields),
  );
  const availability = deriveProductAvailability(
    visible.map((variant) => variant.availability),
  );

  return (
    <section
      aria-labelledby="previa-titulo"
      className="flex flex-col gap-4 rounded-card border border-border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="previa-titulo" className="text-body font-semibold">
          Pré-visualização
        </h2>
        <Badge tone={status === "PUBLISHED" ? "success" : "neutral"}>
          {PUBLICATION_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 rounded-control bg-surface p-3">
        <p className="text-caption text-muted">Como aparece no card do site</p>
        {mainImage ? (
          <MediaImage
            media={toMediaView(mainImage, mainImage.altOverride)}
            className="aspect-square h-auto w-full max-w-48 rounded-media object-contain"
          />
        ) : (
          <p className="text-caption text-warning">Sem imagem principal.</p>
        )}
        <p className="text-body font-semibold">{name}</p>
        <PriceBlock price={price} />
        {availability ? (
          <AvailabilityBadge availability={availabilityView(availability)} />
        ) : (
          <p className="text-caption text-danger">Sem variante visível.</p>
        )}
      </div>

      {active.length > 0 ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-caption font-medium">
            Variante selecionada
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="min-h-10 rounded-control border border-border bg-background px-3 text-body"
            >
              {active.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variantName(variant)}
                  {variant.id === effectiveDefault?.id ? " (padrão)" : ""}
                  {variant.availability === "HIDDEN" ? " (oculta)" : ""}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <div
              className="flex flex-col gap-1 rounded-control border border-border p-3"
              aria-live="polite"
            >
              <PriceBlock price={variantPrice(variantPriceFields(selected))} />
              <AvailabilityBadge
                availability={availabilityView(selected.availability)}
              />
              {selected.availability === "HIDDEN" ? (
                <p className="text-caption text-muted">
                  Variante oculta: não aparece no site.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-caption text-muted">
          Cadastre uma variante para ver preço e disponibilidade.
        </p>
      )}

      <p className="text-caption text-muted">
        {status === "PUBLISHED"
          ? "Publicado: alterações salvas aparecem no site na próxima visita."
          : issuesCount > 0
            ? `Não publicado: ${issuesCount} pendência(s) para publicar.`
            : "Não publicado: pronto para publicar."}
      </p>
    </section>
  );
}
