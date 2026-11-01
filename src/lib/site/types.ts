import { type CategorySummary, type MediaView } from "@/lib/catalog/types";

import { type FooterSettings } from "./settings";

/** Loja física pronta para o site (Brain §7.7). */
export type StoreView = {
  name: string | null;
  description: string | null;
  addressLines: string[];
  hours: { label: string; value: string }[];
  mapUrl: string | null;
  photos: MediaView[];
  ctaLabel: string | null;
  /** Atendimento geral pelo WhatsApp; `null` sem contato padrão. */
  whatsappUrl: string | null;
};

/** Contato público do rodapé (contato padrão, MDI-D012). */
export type PublicContact = {
  /** "+55 (11) 99999-9999". */
  phoneLabel: string | null;
  phoneHref: string | null;
  whatsappLabel: string | null;
  whatsappUrl: string | null;
};

/**
 * Dados do cabeçalho e do rodapé, comuns a todas as páginas públicas. Uma consulta
 * cacheada só, para o layout não repetir leituras.
 */
export type SiteChrome = {
  siteName: string;
  categories: CategorySummary[];
  hasOffers: boolean;
  hasLaunches: boolean;
  contact: PublicContact;
  store: StoreView;
  footer: FooterSettings & { copyrightLine: string };
};
