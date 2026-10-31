import { type AvailabilityView } from "@/lib/availability/availability";
import { type MediaKind } from "@/lib/media/media";
import { type PriceView } from "@/lib/pricing/pricing";

/**
 * Formatos de dados (DTOs) que as páginas e componentes recebem (MDI-D002).
 * Preço e disponibilidade já chegam calculados pelas regras de `src/lib`.
 */

export type MediaView = {
  url: string;
  alt: string;
  kind: MediaKind;
  width: number | null;
  height: number | null;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: MediaView | null;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  badge: string | null;
  shortDescription: string | null;
  category: { slug: string; name: string };
  family: { id: string; slug: string; name: string };
  price: PriceView;
  availability: AvailabilityView | null;
  image: MediaView | null;
  isLaunch: boolean;
  isPromotion: boolean;
  isFeatured: boolean;
};

export type VariantView = {
  id: string;
  /** "256 GB / Preto". */
  label: string | null;
  sku: string | null;
  storage: string | null;
  colorName: string | null;
  colorHex: string | null;
  price: PriceView;
  availability: AvailabilityView;
  isDefault: boolean;
  images: MediaView[];
  /** Link de WhatsApp com produto e variante; `null` sem contato padrão. */
  whatsappUrl: string | null;
};

export type SpecGroup = {
  name: string | null;
  items: { label: string; value: string }[];
};

export type ProductDetail = ProductCard & {
  description: string | null;
  variants: VariantView[];
  defaultVariantId: string | null;
  media: {
    main: MediaView | null;
    mobile: MediaView | null;
    gallery: MediaView[];
    videos: MediaView[];
  };
  specs: SpecGroup[];
  related: { slug: string; name: string } | null;
  /** WhatsApp do produto sem variante específica. */
  whatsappUrl: string | null;
};

export type CategoryPage = {
  category: CategorySummary;
  families: {
    id: string;
    slug: string;
    name: string;
    products: ProductCard[];
  }[];
};

export type ProductShowcase = "launch" | "promotion" | "featured";
