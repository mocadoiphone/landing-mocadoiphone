"use client";

import { type Route } from "next";
import Link from "next/link";
import { useId, useState } from "react";

import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { PriceBlock } from "@/components/catalog/price-block";
import { SceneController } from "@/components/motion/scene-controller";
import { ctaClasses } from "@/components/ui/cta-link";
import { type AvailabilityView } from "@/lib/availability/availability";
import { type MediaView, type VariantView } from "@/lib/catalog/types";
import { selectVariant, variantOptions } from "@/lib/catalog/variant-selection";
import { type PriceView } from "@/lib/pricing/pricing";
import { SITE_ROUTES } from "@/lib/site/routes";

import { ProductGallery } from "./product-gallery";

export type ConfiguratorProduct = {
  name: string;
  badge: string | null;
  familyName: string;
  shortDescription: string | null;
  price: PriceView;
  availability: AvailabilityView | null;
  whatsappUrl: string | null;
  media: {
    main: MediaView | null;
    mobile: MediaView | null;
    gallery: MediaView[];
    videos: MediaView[];
  };
};

const OPTION =
  "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border px-4 text-body transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

function optionState(selected: boolean, matches: boolean): string {
  if (selected) return "border-foreground font-semibold";
  return matches
    ? "border-border hover:border-foreground"
    : "border-dashed border-border text-muted hover:border-foreground";
}

/**
 * Compra da página de produto (Brain §9–§13): galeria, opções de capacidade e
 * cor, preço, disponibilidade e WhatsApp da variante escolhida. Preço,
 * disponibilidade e link já chegam calculados por variante (MDI-D021); aqui só
 * se escolhe qual mostrar. Sem JavaScript, a variante padrão aparece completa.
 */
export function ProductConfigurator({
  product,
  variants,
  defaultVariantId,
}: {
  product: ConfiguratorProduct;
  variants: VariantView[];
  defaultVariantId: string | null;
}) {
  const groupId = useId();
  const [selectedId, setSelectedId] = useState(
    defaultVariantId ?? variants[0]?.id ?? null,
  );
  const selected =
    variants.find((variant) => variant.id === selectedId) ?? null;
  const options = variantOptions(variants, selected);

  const price = selected?.price ?? product.price;
  const availability = selected?.availability ?? product.availability;
  const whatsappUrl = selected?.whatsappUrl ?? product.whatsappUrl;

  const base = [
    ...(product.media.main ? [product.media.main] : []),
    ...product.media.gallery,
  ];
  const variantImages = selected?.images ?? [];
  const images =
    variantImages.length > 0
      ? [
          ...variantImages,
          ...product.media.gallery.filter(
            (image) => !variantImages.some((own) => own.url === image.url),
          ),
        ]
      : base;

  const choose = (change: { storage: string } | { colorName: string }) => {
    const next = selectVariant(variants, selected, change);
    if (next) setSelectedId(next.id);
  };

  const cta = whatsappUrl ? (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={ctaClasses("primary", "w-full")}
    >
      Consultar no WhatsApp
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  ) : null;

  return (
    <div data-motion-scene="product" className="contents">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <div
          key={selected?.id ?? "produto"}
          data-motion-product-gallery
          className="motion-variant-media"
        >
          <ProductGallery
            images={images}
            mobileMain={variantImages.length > 0 ? null : product.media.mobile}
            videos={product.media.videos}
            productName={product.name}
          />
        </div>

        <div
          data-motion-product-panel
          className="flex flex-col gap-8 md:sticky md:top-[calc(var(--spacing-header)+2rem)] md:self-start"
        >
          <div className="flex flex-col gap-3">
            <p className="text-eyebrow font-semibold tracking-wide text-muted uppercase">
              {product.familyName}
            </p>
            <h1 className="text-display-md font-semibold text-balance">
              {product.name}
            </h1>
            {product.badge ? (
              <p className="w-fit rounded-pill border border-border px-3 py-1 text-eyebrow font-semibold tracking-wide uppercase">
                {product.badge}
              </p>
            ) : null}
            {product.shortDescription ? (
              <p className="text-lead text-pretty text-muted">
                {product.shortDescription}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3" aria-live="polite">
            <PriceBlock price={price} size="lg" />
            <AvailabilityBadge availability={availability} />
          </div>

          {options.storages.length > 0 ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-caption font-semibold">
                Capacidade
              </legend>
              <div className="flex flex-wrap gap-2">
                {options.storages.map((option, index) => {
                  const inputId = `${groupId}-capacidade-${index}`;
                  return (
                    <div key={option.value}>
                      <input
                        id={inputId}
                        type="radio"
                        name={`${groupId}-capacidade`}
                        value={option.value}
                        checked={option.selected}
                        onChange={() => choose({ storage: option.value })}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={inputId}
                        className={`${OPTION} ${optionState(option.selected, option.matchesSelection)}`}
                      >
                        {option.value}
                        {option.matchesSelection ? null : (
                          <span className="sr-only"> (troca a cor)</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {options.colors.length > 0 ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-caption font-semibold">
                Cor{selected?.colorName ? `: ${selected.colorName}` : ""}
              </legend>
              <div className="flex flex-wrap gap-2">
                {options.colors.map((option, index) => {
                  const inputId = `${groupId}-cor-${index}`;
                  return (
                    <div key={option.value}>
                      <input
                        id={inputId}
                        type="radio"
                        name={`${groupId}-cor`}
                        value={option.value}
                        checked={option.selected}
                        onChange={() => choose({ colorName: option.value })}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={inputId}
                        className={`${OPTION} ${optionState(option.selected, option.matchesSelection)}`}
                      >
                        {option.hex ? (
                          <span
                            aria-hidden="true"
                            className="size-5 rounded-full border border-border"
                            style={{ backgroundColor: option.hex }}
                          />
                        ) : null}
                        {option.value}
                        {option.matchesSelection ? null : (
                          <span className="sr-only"> (troca a capacidade)</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <div className="flex flex-col gap-3">
            {cta ?? (
              <p className="text-caption text-muted">
                O atendimento pelo WhatsApp está indisponível no momento.{" "}
                <Link
                  href={SITE_ROUTES.store as Route}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Fale com a loja física
                </Link>
                .
              </p>
            )}
            {selected?.label ? (
              <p className="text-caption text-muted">
                Opção escolhida: {selected.label}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {whatsappUrl ? (
        <div
          data-sticky-cta
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-gutter py-3 backdrop-blur-md md:hidden"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="min-w-0 truncate text-caption">
              <span className="block truncate font-semibold">
                {product.name}
              </span>
              <span className="text-muted">
                {price.kind === "priced" ? price.amount : price.label}
              </span>
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaClasses("primary", "shrink-0 px-5")}
            >
              WhatsApp
              <span className="sr-only">
                {" "}
                (abre em nova aba, {product.name})
              </span>
            </a>
          </div>
        </div>
      ) : null}
      <SceneController scene="product" />
    </div>
  );
}
