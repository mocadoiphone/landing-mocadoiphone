import { type Route } from "next";
import Link from "next/link";

import { ProductFiltersForm } from "@/components/admin/products/product-filters";
import { RestoreProductButton } from "@/components/admin/products/restore-product-button";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { buttonClasses } from "@/components/admin/ui/button";
import {
  Badge,
  EmptyState,
  PageHeader,
  type Tone,
} from "@/components/admin/ui/feedback";
import {
  filterProducts,
  paginate,
  parseProductFilters,
  productFiltersQuery,
} from "@/lib/admin/filters";
import {
  adminProductState,
  PUBLICATION_STATUS_LABELS,
  type PublicationStatus,
} from "@/lib/admin/products";
import { AVAILABILITY_LABELS } from "@/lib/availability/availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listAdminProducts,
  listCategoryOptions,
} from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

const STATUS_TONE: Record<PublicationStatus, Tone> = {
  DRAFT: "neutral",
  REVIEWED: "warning",
  PUBLISHED: "success",
};

// Produtos (Brain §16): tabela com filtros, busca e lixeira.
export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/produtos">) {
  const access = await requireAdminPage("catalog");
  if (!access.ok) return <Forbidden />;

  const filters = parseProductFilters(await searchParams);
  const client = await createSupabaseServerClient();
  const [rows, categories] = await Promise.all([
    listAdminProducts(client),
    listCategoryOptions(client),
  ]);
  const page = paginate(filterProducts(rows, filters), filters.page);

  return (
    <>
      <PageHeader
        title={filters.trash ? "Produtos excluídos" : "Produtos"}
        description={
          filters.trash
            ? "Produtos excluídos podem ser restaurados. Nada é apagado de vez."
            : `${page.total} produto(s) encontrado(s).`
        }
        actions={
          <>
            <Link
              href={
                filters.trash ? "/admin/produtos" : "/admin/produtos?lixeira=1"
              }
              className={buttonClasses("ghost")}
            >
              {filters.trash ? "Ver produtos ativos" : "Ver excluídos"}
            </Link>
            {!filters.trash ? (
              <Link
                href="/admin/produtos/novo"
                className={buttonClasses("primary")}
              >
                Novo produto
              </Link>
            ) : null}
          </>
        }
      />

      <ProductFiltersForm filters={filters} categories={categories} />

      {page.items.length === 0 ? (
        <EmptyState title="Nenhum produto com estes filtros.">
          {filters.trash
            ? null
            : "Ajuste os filtros ou cadastre um produto novo."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[48rem] text-left text-caption">
            <caption className="sr-only">Lista de produtos</caption>
            <thead className="border-b border-border bg-surface">
              <tr>
                {[
                  "Produto",
                  "Categoria",
                  "Preço",
                  "Disponibilidade",
                  "Destaque",
                  "Status",
                  "Ações",
                ].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {page.items.map((product) => {
                const state = adminProductState(product);
                const flags = [
                  product.isLaunch ? "Lançamento" : null,
                  product.isFeatured ? "Destaque" : null,
                  product.isPromotion ? "Promoção" : null,
                ].filter(Boolean);
                return (
                  <tr key={product.id}>
                    <th scope="row" className="px-4 py-3 font-medium">
                      {product.isDeleted ? (
                        product.name
                      ) : (
                        <Link
                          href={`/admin/produtos/${product.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {product.name}
                        </Link>
                      )}
                    </th>
                    <td className="px-4 py-3">{product.categoryName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {state.price.kind === "priced"
                        ? `${state.price.prefix ? `${state.price.prefix} ` : ""}${state.price.amount}`
                        : state.price.label}
                    </td>
                    <td className="px-4 py-3">
                      {state.availability ? (
                        <Badge
                          tone={state.isUnavailable ? "danger" : "neutral"}
                        >
                          {AVAILABILITY_LABELS[state.availability]}
                        </Badge>
                      ) : (
                        <Badge tone="danger">Sem variante visível</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {flags.length ? flags.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[product.status]}>
                        {PUBLICATION_STATUS_LABELS[product.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {product.isDeleted ? (
                        <RestoreProductButton
                          id={product.id}
                          name={product.name}
                        />
                      ) : (
                        <Link
                          href={`/admin/produtos/${product.id}`}
                          className={buttonClasses("secondary", "min-h-9")}
                        >
                          Editar
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {page.pageCount > 1 ? (
        <nav
          aria-label="Paginação"
          className="flex items-center gap-3 text-caption"
        >
          {page.page > 1 ? (
            <Link
              href={
                `/admin/produtos${productFiltersQuery({ ...filters, page: page.page - 1 })}` as Route
              }
            >
              ← Anterior
            </Link>
          ) : null}
          <span>
            Página {page.page} de {page.pageCount}
          </span>
          {page.page < page.pageCount ? (
            <Link
              href={
                `/admin/produtos${productFiltersQuery({ ...filters, page: page.page + 1 })}` as Route
              }
            >
              Próxima →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
