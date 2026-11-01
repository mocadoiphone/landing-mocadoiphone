import { categoryPath, productPath, SITE_ROUTES } from "@/lib/site/routes";

import { type CtaSetting, type CtaTarget } from "./blocks";

/** Botão pronto para o componente: texto, destino resolvido e se abre fora do site. */
export type HomeCta = {
  label: string;
  href: string;
  external: boolean;
  target: CtaTarget;
};

export type CtaContext = {
  productSlug: string | null;
  categorySlug: string | null;
  /** WhatsApp do produto do bloco, se houver; senão o atendimento geral. */
  whatsappUrl: string | null;
};

/**
 * Destino do botão a partir da escolha do admin. Sem o que o destino precisa
 * (produto não publicado, categoria inativa, sem contato padrão), o botão some
 * em vez de levar a uma página inexistente.
 */
export function resolveCta(
  cta: CtaSetting | null,
  context: CtaContext,
): HomeCta | null {
  if (!cta) return null;
  const href = ctaHref(cta.target, context);
  if (!href) return null;
  return {
    label: cta.label,
    href,
    external: cta.target === "WHATSAPP",
    target: cta.target,
  };
}

function ctaHref(target: CtaTarget, context: CtaContext): string | null {
  switch (target) {
    case "PRODUCT":
      return context.productSlug ? productPath(context.productSlug) : null;
    case "CATEGORY":
      return context.categorySlug ? categoryPath(context.categorySlug) : null;
    case "WHATSAPP":
      return context.whatsappUrl;
    case "STORE":
      return SITE_ROUTES.store;
    case "OFFERS":
      return SITE_ROUTES.offers;
    case "LAUNCHES":
      return SITE_ROUTES.launches;
  }
}
