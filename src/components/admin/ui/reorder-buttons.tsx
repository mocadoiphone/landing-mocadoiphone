"use client";

import { Button } from "./button";

/** Nova ordem com o item `index` movido uma posição (−1 sobe, +1 desce). */
export function moveItem<T>(
  items: readonly T[],
  index: number,
  delta: -1 | 1,
): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(target, 0, item);
  return next;
}

/**
 * Ordenação acessível por teclado (MDI-D025), sem arrastar e soltar: ↑ e ↓
 * enviam a lista completa na nova ordem para a action de reordenar.
 */
export function ReorderButtons({
  ids,
  index,
  label,
  pending,
  onReorder,
}: {
  ids: readonly string[];
  index: number;
  label: string;
  pending?: boolean;
  onReorder: (orderedIds: string[]) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        className="min-h-9 px-2"
        aria-label={`Subir ${label}`}
        disabled={index === 0 || pending}
        onClick={() => onReorder(moveItem(ids, index, -1))}
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        className="min-h-9 px-2"
        aria-label={`Descer ${label}`}
        disabled={index === ids.length - 1 || pending}
        onClick={() => onReorder(moveItem(ids, index, 1))}
      >
        ↓
      </Button>
    </div>
  );
}
