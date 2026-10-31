/**
 * Ordenação manual (Brain §9 "ordem", §10, §19). A nova ordem é a lista completa
 * de ids do escopo (ex.: variantes de um produto), na sequência desejada.
 */
export const SORT_STEP = 10;

export type ReorderPlan =
  | { ok: true; updates: { id: string; sortOrder: number }[] }
  | { ok: false; reason: "duplicate" | "mismatch" };

/** Próximo `sort_order` para um item novo no fim do escopo. */
export function nextSortOrder(
  current: readonly { sortOrder: number }[],
): number {
  const highest = current.reduce(
    (max, item) => Math.max(max, item.sortOrder),
    0,
  );
  return highest + SORT_STEP;
}

/**
 * Valida que `orderedIds` é exatamente o conjunto atual (sem faltar, sobrar ou
 * repetir) e devolve só as gravações necessárias: 10, 20, 30…
 */
export function planReorder(
  current: readonly { id: string; sortOrder: number }[],
  orderedIds: readonly string[],
): ReorderPlan {
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { ok: false, reason: "duplicate" };
  }
  const currentOrder = new Map(
    current.map((item) => [item.id, item.sortOrder]),
  );
  if (
    orderedIds.length !== currentOrder.size ||
    orderedIds.some((id) => !currentOrder.has(id))
  ) {
    return { ok: false, reason: "mismatch" };
  }

  const updates = orderedIds
    .map((id, index) => ({ id, sortOrder: (index + 1) * SORT_STEP }))
    .filter(({ id, sortOrder }) => currentOrder.get(id) !== sortOrder);
  return { ok: true, updates };
}
