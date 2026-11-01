/**
 * Tags de cache do site público (MDI-D011, MDI-D020). As consultas cacheadas se
 * marcam com elas; toda escrita do painel invalida a tag afetada com `updateTag`.
 */
export const CACHE_TAGS = {
  /** Categorias, famílias, produtos, variantes, mídia e especificações. */
  catalog: "catalog",
  /** Blocos da Home. */
  home: "home",
  /** Contato padrão e configurações públicas (WhatsApp, loja física, rodapé). */
  settings: "settings",
} as const;
