import { type HomeBlockView } from "@/lib/home/types";

import { CategoryGridSection } from "./category-grid-section";
import { HeroSection } from "./hero-section";
import {
  FullscreenMediaSection,
  PromoBannerSection,
  TextAndMediaSection,
} from "./media-sections";
import { ProductGridSection } from "./product-grid-section";
import { ProductStorySection } from "./product-story-section";
import { StoreSection } from "./store-section";
import { CtaSection, FeaturesSection, ReviewsSection } from "./text-sections";

/**
 * Renderiza os blocos da Home na ordem do painel (Brain §19; MDI-D009). Cada tipo
 * tem um layout fixo do sistema; o primeiro bloco recebe a prioridade de imagem
 * (LCP) e, se for hero, o título principal da página.
 */
function HomeBlock({
  block,
  priority,
}: {
  block: HomeBlockView;
  priority: boolean;
}) {
  switch (block.type) {
    case "HERO_PRODUCT":
      return <HeroSection block={block} priority={priority} />;
    case "PRODUCT_STORY":
      return <ProductStorySection block={block} priority={priority} />;
    case "PRODUCT_GRID":
      return <ProductGridSection block={block} />;
    case "CATEGORY_GRID":
      return <CategoryGridSection block={block} />;
    case "FULLSCREEN_MEDIA":
      return <FullscreenMediaSection block={block} priority={priority} />;
    case "TEXT_AND_MEDIA":
      return <TextAndMediaSection block={block} />;
    case "FEATURES":
      return <FeaturesSection block={block} />;
    case "PROMO_BANNER":
      return <PromoBannerSection block={block} />;
    case "STORE":
      return block.store ? (
        <StoreSection
          store={block.store}
          theme={block.theme}
          eyebrow={block.eyebrow}
          title={block.title}
          subtitle={block.subtitle}
          id={`bloco-${block.id}`}
        />
      ) : null;
    case "REVIEWS":
      return <ReviewsSection block={block} />;
    case "CTA":
      return <CtaSection block={block} />;
  }
}

export function HomeBlocks({ blocks }: { blocks: HomeBlockView[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <HomeBlock key={block.id} block={block} priority={index === 0} />
      ))}
    </>
  );
}
