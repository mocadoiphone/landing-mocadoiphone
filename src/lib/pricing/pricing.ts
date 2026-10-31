/**
 * Regras de preço (Brain §11; MDI-D005, MDI-D021).
 *
 * Valores sempre em centavos (`integer`). Esta é a ÚNICA fonte de formatação de
 * preço do projeto: componentes recebem `PriceView` pronto e nunca formatam valor.
 */

export const PRICE_ON_REQUEST_LABEL = "Consulte valores";
export const PRICE_FROM_PREFIX = "A partir de";

// Espaço não separável entre "R$" e o número: o valor nunca quebra de linha.
const NBSP = " ";
const integerFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});
const decimalFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Limite da coluna `integer` do Postgres.
const MAX_CENTS = 2_147_483_647;

export type PriceFields = {
  priceCash: number | null;
  priceOld: number | null;
  priceInstallment: number | null;
  installments: number | null;
  installmentText: string | null;
  priceOnRequest: boolean;
};

export type PriceView =
  | { kind: "on_request"; label: string }
  | {
      kind: "priced";
      /** "A partir de" quando as variantes têm preços diferentes. */
      prefix: string | null;
      /** Preço à vista: "R$ 8.999". */
      amount: string;
      /** Preço "de" (anterior), exibido riscado: "R$ 9.999". */
      previous: string | null;
      /** "ou 18x de R$ 549,90", ou o texto livre de parcelamento. */
      installment: string | null;
    };

/** 899900 → "R$ 8.999" · 54990 → "R$ 549,90". Valores inteiros saem sem centavos. */
export function formatBRL(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0 || cents > MAX_CENTS) {
    throw new RangeError("Valor em centavos inválido.");
  }
  const value = cents / 100;
  const text =
    cents % 100 === 0
      ? integerFormat.format(value)
      : decimalFormat.format(value);
  return `R$${NBSP}${text}`;
}

/** Linha de parcelamento. O texto livre (`installment_text`) substitui a linha gerada. */
export function installmentLine(
  fields: Pick<
    PriceFields,
    "priceInstallment" | "installments" | "installmentText"
  >,
): string | null {
  const text = fields.installmentText?.trim();
  if (text) return text;
  if (fields.priceInstallment !== null && fields.installments !== null) {
    return `ou ${fields.installments}x de ${formatBRL(fields.priceInstallment)}`;
  }
  return null;
}

/** "Consulte valores" quando marcado ou quando não há preço à vista. */
export function hasPrice<
  T extends Pick<PriceFields, "priceCash" | "priceOnRequest">,
>(fields: T): fields is T & { priceCash: number } {
  return !fields.priceOnRequest && fields.priceCash !== null;
}

/** Preço de uma variante. */
export function variantPrice(fields: PriceFields): PriceView {
  if (!hasPrice(fields)) {
    return { kind: "on_request", label: PRICE_ON_REQUEST_LABEL };
  }
  return {
    kind: "priced",
    prefix: null,
    amount: formatBRL(fields.priceCash),
    previous:
      fields.priceOld !== null && fields.priceOld > fields.priceCash
        ? formatBRL(fields.priceOld)
        : null,
    installment: installmentLine(fields),
  };
}

/**
 * Preço do produto (cards e cabeçalho), a partir das variantes vendáveis:
 * - nenhuma com preço → "Consulte valores";
 * - preços diferentes → "A partir de" + menor preço;
 * - parcela e preço "de" vêm da variante mais barata (a primeira, na ordem recebida).
 *
 * `sellable` deve conter só variantes visíveis e não descontinuadas, na ordem de exibição,
 * o mesmo critério do `products.price_from` no banco (MDI-D005).
 */
export function productPrice(sellable: readonly PriceFields[]): PriceView {
  const priced = sellable.filter(hasPrice);
  const cheapest = priced.reduce<(typeof priced)[number] | null>(
    (best, current) =>
      best === null || current.priceCash < best.priceCash ? current : best,
    null,
  );
  if (cheapest === null) {
    return { kind: "on_request", label: PRICE_ON_REQUEST_LABEL };
  }

  const view = variantPrice(cheapest);
  if (view.kind !== "priced") return view;
  const distinctPrices = new Set(priced.map((fields) => fields.priceCash));
  return {
    ...view,
    prefix: distinctPrices.size > 1 ? PRICE_FROM_PREFIX : null,
  };
}

/**
 * Converte o valor digitado no painel em centavos: "8.999", "8.999,90", "R$ 549,9", "8999".
 * Ponto só é aceito como separador de milhar. Retorna `null` se o texto não for um valor válido.
 */
export function parseBRLToCents(input: string): number | null {
  const text = input.replace(/R\$/i, "").replace(/[\s ]/g, "").trim();
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(text)) return null;

  const [integerPart = "", decimalPart = ""] = text.split(",");
  const reais = Number(integerPart.replace(/\./g, ""));
  const cents = reais * 100 + Number(decimalPart.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}
