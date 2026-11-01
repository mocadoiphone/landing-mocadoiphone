import { describe, expect, it } from "vitest";

import {
  filterProducts,
  paginate,
  parseProductFilters,
  productFiltersQuery,
} from "./filters";
import {
  adminProductState,
  type AdminProductRow,
  type AdminVariantRow,
  dashboardMetrics,
} from "./products";

const variant = (
  overrides: Partial<AdminVariantRow> = {},
): AdminVariantRow => ({
  priceCash: null,
  priceOld: null,
  priceInstallment: null,
  installments: null,
  installmentText: null,
  priceOnRequest: false,
  availability: "AVAILABLE",
  isDeleted: false,
  sortOrder: 0,
  ...overrides,
});

const product = (
  id: string,
  overrides: Partial<AdminProductRow> = {},
): AdminProductRow => ({
  id,
  name: `Produto ${id}`,
  slug: `produto-${id}`,
  status: "PUBLISHED",
  categoryId: "cat-1",
  isDeleted: false,
  isLaunch: false,
  isFeatured: false,
  isPromotion: false,
  variants: [variant({ priceCash: 100000 })],
  ...overrides,
});

describe("adminProductState", () => {
  it("deriva disponibilidade e preço das variantes não excluídas", () => {
    const state = adminProductState(
      product("a", {
        variants: [
          variant({ availability: "OUT_OF_STOCK", priceCash: 200000 }),
          variant({
            availability: "AVAILABLE",
            priceCash: 150000,
            isDeleted: true,
          }),
          variant({ availability: "HIDDEN", priceCash: 50000 }),
        ],
      }),
    );
    expect(state.availability).toBe("OUT_OF_STOCK");
    expect(state.isUnavailable).toBe(true);
    expect(state.price.kind === "priced" && state.price.prefix).toBeNull();
  });

  it("sem variante visível: indisponível e sem preço", () => {
    const state = adminProductState(
      product("a", {
        variants: [variant({ availability: "HIDDEN", priceCash: 1 })],
      }),
    );
    expect(state).toMatchObject({
      availability: null,
      hasPrice: false,
      isUnavailable: true,
    });
  });
});

describe("dashboardMetrics (Brain §15)", () => {
  // "Sem preço" = o site mostra "Consulte valores": inclui produto só com variante fora de linha.
  it("conta publicados, em andamento, indisponíveis, sem preço, lançamentos e promoções", () => {
    expect(
      dashboardMetrics([
        product("1", { isLaunch: true }),
        product("2", {
          isPromotion: true,
          variants: [
            variant({ availability: "DISCONTINUED", priceCash: 1000 }),
          ],
        }),
        product("3", {
          status: "DRAFT",
          variants: [variant({ priceOnRequest: true })],
        }),
        product("4", { status: "REVIEWED", isLaunch: true }),
        product("5", { isDeleted: true }),
      ]),
    ).toEqual({
      published: 2,
      inProgress: 2,
      unavailable: 1,
      withoutPrice: 2,
      launches: 1,
      promotions: 1,
    });
  });
});

describe("filtros da lista (Brain §16)", () => {
  const rows = [
    product("1", { name: "iPhone 17 Pró", isLaunch: true }),
    product("2", { name: "iPad Air", status: "DRAFT", categoryId: "cat-2" }),
    product("3", {
      name: "AirPods",
      variants: [
        variant({ availability: "OUT_OF_STOCK", priceOnRequest: true }),
      ],
    }),
    product("4", { name: "Excluído", isDeleted: true }),
  ];

  it("lê e escreve os filtros na URL", () => {
    const filters = parseProductFilters({
      q: " iphone ",
      status: "PUBLISHED",
      disponibilidade: "unavailable",
      lancamento: "1",
      pagina: "2",
      categoria: "cat-1",
    });
    expect(filters).toMatchObject({
      q: "iphone",
      status: "PUBLISHED",
      availability: "unavailable",
      launch: true,
      page: 2,
      category: "cat-1",
    });
    expect(productFiltersQuery(filters)).toBe(
      "?q=iphone&categoria=cat-1&status=PUBLISHED&disponibilidade=unavailable&lancamento=1&pagina=2",
    );
    expect(
      parseProductFilters({ status: "INVALIDO", pagina: "-3" }),
    ).toMatchObject({
      status: null,
      page: 1,
    });
  });

  it("busca sem acento, por categoria, status, flags, disponibilidade e sem preço", () => {
    const base = parseProductFilters({});
    expect(
      filterProducts(rows, { ...base, q: "pro" }).map((r) => r.id),
    ).toEqual(["1"]);
    expect(
      filterProducts(rows, { ...base, category: "cat-2" }).map((r) => r.id),
    ).toEqual(["2"]);
    expect(
      filterProducts(rows, { ...base, launch: true }).map((r) => r.id),
    ).toEqual(["1"]);
    expect(
      filterProducts(rows, { ...base, availability: "unavailable" }).map(
        (r) => r.id,
      ),
    ).toEqual(["3"]);
    expect(
      filterProducts(rows, { ...base, withoutPrice: true }).map((r) => r.id),
    ).toEqual(["3"]);
  });

  it("lixeira mostra só os excluídos", () => {
    const base = parseProductFilters({ lixeira: "1" });
    expect(filterProducts(rows, base).map((r) => r.id)).toEqual(["4"]);
  });

  it("pagina sem passar do fim", () => {
    const many = Array.from({ length: 120 }, (_, index) => index);
    expect(paginate(many, 9)).toMatchObject({
      page: 3,
      pageCount: 3,
      total: 120,
    });
    expect(paginate(many, 1).items).toHaveLength(50);
  });
});
