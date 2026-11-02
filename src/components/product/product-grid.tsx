import { type ProductCard } from "@/lib/catalog/types";
import { RevealController } from "@/components/motion/reveal-controller";

import { ProductTile } from "./product-tile";

/**
 * Grade das páginas de listagem (categoria, ofertas, lançamentos). Celular
 * pequeno: um card por linha, imagem grande; a partir de 480 px, dois; tablet,
 * três; desktop, quatro.
 */
export function ProductGrid({ products }: { products: ProductCard[] }) {
  return (
    <>
      <ul
        data-motion-reveal
        data-motion-group
        className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4"
      >
        {products.map((product) => (
          <li key={product.id} data-motion-item>
            <ProductTile
              product={product}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
            />
          </li>
        ))}
      </ul>
      <RevealController target="previous" />
    </>
  );
}
