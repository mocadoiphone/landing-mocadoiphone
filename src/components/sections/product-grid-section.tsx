import { ProductTile } from "@/components/product/product-tile";
import { RevealController } from "@/components/motion/reveal-controller";
import { SectionHeading } from "@/components/ui/section";
import { type ProductCard } from "@/lib/catalog/types";
import { type HomeBlockView } from "@/lib/home/types";

import { BlockCtas, headingId } from "./block-parts";

/**
 * Lista de produtos: no celular, carrossel com rolagem horizontal e encaixe
 * (Brain §28: composição própria, não a grade encolhida); a partir do tablet,
 * grade. A rolagem também funciona pelo teclado (região focável).
 */
export function ProductRail({
  products,
  label,
}: {
  products: ProductCard[];
  label: string;
}) {
  return (
    <>
      <div
        role="region"
        aria-label={`Lista de produtos: ${label}`}
        tabIndex={0}
        className="-mx-gutter [scrollbar-width:thin] overflow-x-auto px-gutter pb-2 focus-visible:outline-2 focus-visible:outline-ring md:mx-0 md:overflow-visible md:px-0"
      >
        <ul
          data-motion-reveal
          data-motion-group
          className="flex snap-x snap-mandatory gap-4 md:grid md:snap-none md:grid-cols-3 md:gap-6 lg:grid-cols-4"
        >
          {products.map((product) => (
            <li
              key={product.id}
              data-motion-item
              className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-auto"
            >
              <ProductTile product={product} />
            </li>
          ))}
        </ul>
      </div>
      <RevealController target="previous" />
    </>
  );
}

/** PRODUCT_GRID (Brain §7.3): lançamentos, promoções, destaques ou categoria. */
export function ProductGridSection({ block }: { block: HomeBlockView }) {
  const id = headingId(block);
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      className="py-section"
    >
      <div className="mx-auto flex w-full max-w-wide flex-col gap-10 px-gutter">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id={id}
            eyebrow={block.eyebrow}
            title={block.title}
            subtitle={block.subtitle}
          />
          <div className="hidden md:block">
            <BlockCtas ctas={block.ctas} />
          </div>
        </div>
        <ProductRail
          products={block.products}
          label={block.title ?? "Produtos"}
        />
        <div className="md:hidden">
          <BlockCtas ctas={block.ctas} />
        </div>
      </div>
    </section>
  );
}
