export type SiteRedirect = {
  source: string;
  destination: string;
  statusCode: 301;
};

/** URLs antigas confirmadas na MDI-D003. O status 301 é intencional para SEO. */
const wixCategoryRedirects: readonly SiteRedirect[] = [
  { source: "/macbook", destination: "/mac", statusCode: 301 },
  { source: "/applewatch", destination: "/apple-watch", statusCode: 301 },
  {
    source: "/apple-vision-pro",
    destination: "/vision-pro",
    statusCode: 301,
  },
];

/**
 * Mudanças futuras de slug publicado entram aqui na Etapa 08 após inventário.
 * A origem nunca é removida sem confirmar que deixou de receber tráfego.
 */
export const productSlugRedirects: readonly SiteRedirect[] = [];

export const legacyRedirects: readonly SiteRedirect[] = [
  ...wixCategoryRedirects,
  ...productSlugRedirects,
];
