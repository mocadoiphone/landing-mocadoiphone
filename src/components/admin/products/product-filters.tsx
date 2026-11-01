import Link from "next/link";

import { type ProductFilters } from "@/lib/admin/filters";
import { PUBLICATION_STATUS_LABELS } from "@/lib/admin/products";
import { AVAILABILITY_LABELS } from "@/lib/availability/availability";

import { buttonClasses } from "../ui/button";

const CONTROL =
  "min-h-10 rounded-control border border-border bg-background px-3 text-caption focus-visible:outline-2 focus-visible:outline-ring";

/** Filtros da lista (Brain §16) em formulário GET: funcionam sem JavaScript. */
export function ProductFiltersForm({
  filters,
  categories,
}: {
  filters: ProductFilters;
  categories: { id: string; name: string }[];
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-card border border-border p-4"
      role="search"
    >
      {filters.trash ? <input type="hidden" name="lixeira" value="1" /> : null}
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-caption font-medium">
        Buscar por nome
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          className={CONTROL}
        />
      </label>
      <label className="flex flex-col gap-1 text-caption font-medium">
        Categoria
        <select
          name="categoria"
          defaultValue={filters.category ?? ""}
          className={CONTROL}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-caption font-medium">
        Status
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className={CONTROL}
        >
          <option value="">Todos</option>
          {Object.entries(PUBLICATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-caption font-medium">
        Disponibilidade
        <select
          name="disponibilidade"
          defaultValue={filters.availability ?? ""}
          className={CONTROL}
        >
          <option value="">Todas</option>
          <option value="unavailable">Publicados indisponíveis</option>
          {(
            [
              "AVAILABLE",
              "PRE_ORDER",
              "ON_REQUEST",
              "OUT_OF_STOCK",
              "DISCONTINUED",
            ] as const
          ).map((status) => (
            <option key={status} value={status}>
              {AVAILABILITY_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-wrap gap-3">
        <legend className="sr-only">Destaques</legend>
        {[
          { name: "lancamento", label: "Lançamento", checked: filters.launch },
          { name: "destaque", label: "Destaque", checked: filters.featured },
          { name: "promocao", label: "Promoção", checked: filters.promotion },
          {
            name: "semPreco",
            label: "Sem preço",
            checked: filters.withoutPrice,
          },
        ].map((flag) => (
          <label
            key={flag.name}
            className="flex min-h-10 items-center gap-2 text-caption"
          >
            <input
              type="checkbox"
              name={flag.name}
              value="1"
              defaultChecked={flag.checked}
              className="size-4 accent-accent"
            />
            {flag.label}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses("primary")}>
          Filtrar
        </button>
        <Link
          href={filters.trash ? "/admin/produtos?lixeira=1" : "/admin/produtos"}
          className={buttonClasses("ghost")}
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
