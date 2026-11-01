import { type HomeBlockView } from "./types";

/**
 * O bloco só vai para a página com o que o layout dele precisa. Produto
 * despublicado, categoria inativa ou mídia excluída somem sem quebrar a Home
 * (Brain §19: "admin não pode quebrar o layout").
 */
export function isBlockRenderable(block: HomeBlockView): boolean {
  switch (block.type) {
    case "HERO_PRODUCT":
    case "PROMO_BANNER":
      return Boolean(block.title);
    case "PRODUCT_STORY":
      return block.product !== null;
    case "PRODUCT_GRID":
      return block.products.length > 0;
    case "CATEGORY_GRID":
      return block.categories.length > 0;
    case "FULLSCREEN_MEDIA":
      return block.media !== null || block.video !== null;
    case "TEXT_AND_MEDIA":
      return Boolean(block.title) && block.media !== null;
    case "FEATURES":
    case "REVIEWS":
      return block.items.length > 0;
    case "STORE":
      return block.store !== null;
    case "CTA":
      return Boolean(block.title) && block.ctas.length > 0;
  }
}
