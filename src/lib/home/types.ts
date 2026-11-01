import {
  type CategorySummary,
  type MediaView,
  type ProductCard,
} from "@/lib/catalog/types";
import { type StoreView } from "@/lib/site/types";

import { type BlockItem, type BlockLayout, type BlockType } from "./blocks";
import { type HomeCta } from "./cta";

/**
 * Bloco pronto para renderizar (MDI-D002): vínculos resolvidos, botões com
 * destino e produtos já com preço e disponibilidade calculados.
 */
export type HomeBlockView = {
  id: string;
  type: BlockType;
  theme: "light" | "dark";
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  media: MediaView | null;
  video: MediaView | null;
  /** Produto vinculado (só se publicado). */
  product: ProductCard | null;
  /** Categoria vinculada (só se ativa). */
  category: CategorySummary | null;
  layout: BlockLayout;
  ctas: HomeCta[];
  items: BlockItem[];
  /** PRODUCT_GRID. */
  products: ProductCard[];
  /** CATEGORY_GRID. */
  categories: CategorySummary[];
  /** STORE. */
  store: StoreView | null;
};

export type HomeView = {
  blocks: HomeBlockView[];
  /** Nenhum bloco ativo e válido: a Home usa a composição padrão. */
  isFallback: boolean;
};
