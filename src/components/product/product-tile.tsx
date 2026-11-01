import Link from "next/link";

import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { PriceBlock } from "@/components/catalog/price-block";
import { SiteImage } from "@/components/media/site-image";
import { type ProductCard } from "@/lib/catalog/types";
import { productPath } from "@/lib/site/routes";

const UNAVAILABLE = new Set(["OUT_OF_STOCK", "DISCONTINUED"]);

/**
 * Card de produto do site: imagem como protagonista, nome, selo, preço e
 * disponibilidade. O card inteiro é clicável pelo link do nome (um só alvo de
 * foco, sem links duplicados para leitor de tela).
 */
export function ProductTile({
  product,
  headingLevel = 3,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 75vw",
}: {
  product: ProductCard;
  headingLevel?: 2 | 3;
  sizes?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const unavailable = product.availability
    ? UNAVAILABLE.has(product.availability.status)
    : true;

  return (
    <article
      className="group relative flex h-full flex-col gap-4 rounded-card bg-surface p-5 transition-shadow duration-300 ease-premium focus-within:shadow-elevated hover:shadow-elevated"
      data-unavailable={unavailable || undefined}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-control">
        {product.image ? (
          <SiteImage
            media={product.image}
            sizes={sizes}
            className={`h-full w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.03] ${unavailable ? "opacity-60" : ""}`}
          />
        ) : (
          <span className="text-caption text-muted">Imagem em breve</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {product.badge ? (
          <p className="w-fit rounded-pill border border-border px-3 py-1 text-eyebrow font-semibold tracking-wide uppercase">
            {product.badge}
          </p>
        ) : null}
        <Heading className="text-lead font-semibold text-balance">
          <Link
            href={productPath(product.slug)}
            className="rounded-control after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {product.name}
          </Link>
        </Heading>
        {product.shortDescription ? (
          <p className="line-clamp-2 text-caption text-muted">
            {product.shortDescription}
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <PriceBlock price={product.price} size="sm" />
          <AvailabilityBadge availability={product.availability} />
        </div>
      </div>
    </article>
  );
}
