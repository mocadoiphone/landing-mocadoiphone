import { type Route } from "next";
import Link from "next/link";

import { Forbidden } from "@/components/admin/shell/forbidden";
import { EmptyState, PageHeader } from "@/components/admin/ui/feedback";
import { canAccess } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboard } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Dashboard (Brain §15): indicadores do catálogo e alterações recentes.
export default async function DashboardPage() {
  const access = await requireAdminPage("dashboard");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const { metrics, recent } = await getDashboard(client, access.admin.role);
  const linkable = canAccess(access.admin.role, "catalog");

  const cards: { label: string; value: number; href: Route; hint: string }[] = [
    {
      label: "Publicados",
      value: metrics.published,
      href: "/admin/produtos?status=PUBLISHED",
      hint: "Visíveis no site",
    },
    {
      label: "Em preparação",
      value: metrics.inProgress,
      href: "/admin/produtos",
      hint: "Rascunhos e revisados",
    },
    {
      label: "Indisponíveis",
      value: metrics.unavailable,
      href: "/admin/produtos?disponibilidade=unavailable",
      hint: "Publicados sem como comprar",
    },
    {
      label: "Sem preço",
      value: metrics.withoutPrice,
      href: "/admin/produtos?semPreco=1",
      hint: "Mostram “Consulte valores”",
    },
    {
      label: "Lançamentos",
      value: metrics.launches,
      href: "/admin/produtos?status=PUBLISHED&lancamento=1",
      hint: "Publicados",
    },
    {
      label: "Promoções",
      value: metrics.promotions,
      href: "/admin/produtos?status=PUBLISHED&promocao=1",
      hint: "Publicados",
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do catálogo." />

      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        {cards.map((card) => {
          const content = (
            <>
              <span className="text-caption text-muted">{card.label}</span>
              <span className="text-display-md">{card.value}</span>
              <span className="text-caption text-muted">{card.hint}</span>
            </>
          );
          return linkable ? (
            <Link
              key={card.label}
              href={card.href}
              className="flex flex-col gap-1 rounded-card border border-border p-4 hover:bg-surface focus-visible:outline-2 focus-visible:outline-ring"
            >
              {content}
            </Link>
          ) : (
            <div
              key={card.label}
              className="flex flex-col gap-1 rounded-card border border-border p-4"
            >
              {content}
            </div>
          );
        })}
      </section>

      {recent ? (
        <section aria-labelledby="alteracoes" className="flex flex-col gap-3">
          <h2 id="alteracoes" className="text-body font-semibold">
            Alterações recentes
          </h2>
          {recent.length === 0 ? (
            <EmptyState title="Nenhuma alteração registrada ainda." />
          ) : (
            <ul className="divide-y divide-border rounded-card border border-border">
              {recent.map((change) => (
                <li
                  key={change.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
                >
                  <p className="text-caption">
                    <strong>{change.actorName}</strong> {change.summary}{" "}
                    {change.entityLabel.toLowerCase()}
                    {change.entityName ? <> “{change.entityName}”</> : null}
                    {change.fields ? (
                      <span className="text-muted"> ({change.fields})</span>
                    ) : null}
                  </p>
                  <time
                    dateTime={change.createdAt}
                    className="text-caption text-muted"
                  >
                    {dateFormat.format(new Date(change.createdAt))}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
