/**
 * Endereços públicos do site (Brain §6; MDI-D003). Um único lugar para montar
 * links, para os componentes não espalharem caminhos.
 */
export const SITE_ROUTES = {
  home: "/",
  store: "/loja",
  offers: "/ofertas",
  launches: "/lancamentos",
} as const;

export function productPath(slug: string): `/produto/${string}` {
  return `/produto/${slug}`;
}

export function categoryPath(slug: string): `/${string}` {
  return `/${slug}`;
}

/**
 * Parâmetro usado quando ainda não há nada publicado: o Next exige ao menos um
 * para pré-gerar uma rota dinâmica (MDI-D034). Não é um slug válido, então a
 * página responde 404.
 */
export const EMPTY_STATIC_PARAM = "_";

export function staticParams<K extends string>(
  key: K,
  values: readonly string[],
): Record<K, string>[] {
  const list = values.length > 0 ? values : [EMPTY_STATIC_PARAM];
  return list.map((value) => ({ [key]: value }) as Record<K, string>);
}
