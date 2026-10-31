import Link from "next/link";

import { type ProductCard } from "@/lib/catalog/types";

import { AvailabilityBadge } from "./availability-badge";
import { MediaImage } from "./media-image";
import { PriceBlock } from "./price-block";

export function ProductCardItem({ product }: { product: ProductCard }) {
  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      {product.image ? (
        <MediaImage
          media={product.image}
          className="aspect-square h-auto w-full rounded-media object-contain"
        />
      ) : null}
      <div className="flex flex-col gap-1">
        {product.badge ? (
          <p className="text-caption font-medium">{product.badge}</p>
        ) : null}
        <h3 className="text-body font-semibold">
          <Link
            href={`/produto/${product.slug}`}
            className="rounded-control focus-visible:outline-2 focus-visible:outline-ring"
          >
            {product.name}
          </Link>
        </h3>
        {product.shortDescription ? (
          <p className="text-caption text-muted">{product.shortDescription}</p>
        ) : null}
      </div>
      <PriceBlock price={product.price} />
      <AvailabilityBadge availability={product.availability} />
    </li>
  );
}
