/**
 * Seletor de variante da página de produto (Brain §10; MDI-D021). Só escolhe
 * QUAL variante mostrar: preço, disponibilidade e WhatsApp já chegam calculados
 * em cada variante, então a regra comercial não é repetida aqui.
 */

type SelectableVariant = {
  id: string;
  storage: string | null;
  colorName: string | null;
  colorHex: string | null;
};

export type StorageOption = {
  value: string;
  /** Existe na cor escolhida (senão, escolher troca também a cor). */
  matchesSelection: boolean;
  selected: boolean;
};

export type ColorOption = StorageOption & { hex: string | null };

export type VariantOptions = {
  storages: StorageOption[];
  colors: ColorOption[];
};

const same = (a: string | null, b: string | null) =>
  (a?.trim() ?? "") === (b?.trim() ?? "");

function distinct(values: (string | null)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value?.trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

/** Opções de capacidade e cor, na ordem das variantes (já ordenadas pelo serviço). */
export function variantOptions<T extends SelectableVariant>(
  variants: readonly T[],
  selected: T | null,
): VariantOptions {
  const storages = distinct(variants.map((variant) => variant.storage)).map(
    (value) => ({
      value,
      selected: same(selected?.storage ?? null, value),
      matchesSelection: variants.some(
        (variant) =>
          same(variant.storage, value) &&
          same(variant.colorName, selected?.colorName ?? null),
      ),
    }),
  );

  const colors = distinct(variants.map((variant) => variant.colorName)).map(
    (value) => ({
      value,
      hex:
        variants.find((variant) => same(variant.colorName, value))?.colorHex ??
        null,
      selected: same(selected?.colorName ?? null, value),
      matchesSelection: variants.some(
        (variant) =>
          same(variant.colorName, value) &&
          same(variant.storage, selected?.storage ?? null),
      ),
    }),
  );

  return { storages, colors };
}

/**
 * Variante após o cliente trocar capacidade ou cor: mantém o outro atributo se a
 * combinação existir; senão, a primeira variante com o valor escolhido.
 */
export function selectVariant<T extends SelectableVariant>(
  variants: readonly T[],
  current: T | null,
  change: { storage: string } | { colorName: string },
): T | null {
  const key = "storage" in change ? "storage" : "colorName";
  const other = key === "storage" ? "colorName" : "storage";
  const value = "storage" in change ? change.storage : change.colorName;

  const withValue = variants.filter((variant) => same(variant[key], value));
  return (
    withValue.find((variant) =>
      same(variant[other], current?.[other] ?? null),
    ) ??
    withValue[0] ??
    current
  );
}
