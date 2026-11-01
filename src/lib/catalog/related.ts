/**
 * Produtos relacionados da página de produto: primeiro o relacionado escolhido
 * no painel (`related_product_id`), depois os da mesma família, sem repetir e
 * sem o próprio produto. Só entram produtos publicados (a RLS já filtra).
 */
export const RELATED_PRODUCTS_MAX = 4;

export function mergeRelatedProducts<T extends { id: string }>(
  currentId: string,
  explicit: T | null,
  sameFamily: readonly T[],
  max = RELATED_PRODUCTS_MAX,
): T[] {
  const result: T[] = [];
  const seen = new Set<string>([currentId]);
  for (const product of [explicit, ...sameFamily]) {
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
    if (result.length >= max) break;
  }
  return result;
}
