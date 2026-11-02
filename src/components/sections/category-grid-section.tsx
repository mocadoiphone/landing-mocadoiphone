import { type Route } from "next";
import Link from "next/link";

import { SiteImage } from "@/components/media/site-image";
import { RevealController } from "@/components/motion/reveal-controller";
import { SectionHeading } from "@/components/ui/section";
import { type CategorySummary } from "@/lib/catalog/types";
import { type HomeBlockView } from "@/lib/home/types";
import { categoryPath } from "@/lib/site/routes";

/** Grade das linhas Apple (Brain §7.4); também usada no rodapé de categorias. */
export function CategoryTiles({
  categories,
  currentSlug,
}: {
  categories: CategorySummary[];
  currentSlug?: string;
}) {
  return (
    <>
      <ul
        data-motion-reveal
        data-motion-group
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
      >
        {categories.map((category) => (
          <li key={category.id} data-motion-item>
            <Link
              href={categoryPath(category.slug) as Route}
              aria-current={category.slug === currentSlug ? "page" : undefined}
              className="group flex h-full flex-col items-center gap-3 rounded-card bg-surface p-4 text-center transition-shadow duration-300 ease-premium hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6"
            >
              <span className="relative flex aspect-square w-full items-center justify-center">
                {category.image ? (
                  <SiteImage
                    media={category.image}
                    sizes="(min-width: 768px) 22vw, 45vw"
                    className="h-full w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-display-md font-semibold text-muted"
                  >
                    {category.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="text-body font-semibold">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <RevealController target="previous" />
    </>
  );
}

/** CATEGORY_GRID (Brain §7.4): todas as categorias ativas, na ordem do painel. */
export function CategoryGridSection({ block }: { block: HomeBlockView }) {
  const id = block.title ? `bloco-${block.id}` : undefined;
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      className="py-section"
    >
      <div className="mx-auto flex w-full max-w-wide flex-col gap-10 px-gutter">
        <SectionHeading
          id={id}
          eyebrow={block.eyebrow}
          title={block.title}
          subtitle={block.subtitle}
        />
        <CategoryTiles categories={block.categories} />
      </div>
    </section>
  );
}
