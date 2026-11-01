"use client";

import { type Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  PUBLICATION_STATUS_LABELS,
  type PublicationStatus,
} from "@/lib/admin/products";
import {
  PUBLICATION_ISSUE_MESSAGES,
  type PublicationIssue,
} from "@/lib/catalog/publication";
import {
  deleteProductAction,
  restoreProductAction,
  setProductStatusAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionRunner } from "../../forms/use-action-form";
import { Button, buttonClasses } from "../../ui/button";
import { ConfirmDialog } from "../../ui/dialog";
import { Badge } from "../../ui/feedback";

const ISSUE_LINKS: Record<PublicationIssue, (id: string) => Route> = {
  category_inactive: () => "/admin/categorias",
  family_deleted: (id) => `/admin/produtos/${id}?aba=geral` as Route,
  no_visible_variant: (id) => `/admin/produtos/${id}?aba=variantes` as Route,
  no_main_image: (id) => `/admin/produtos/${id}?aba=midia` as Route,
};

/**
 * Publicação (MDI-D006, D024): as pendências aparecem ANTES de clicar, e o botão
 * Publicar só fica ativo quando não há nenhuma. O banco continua garantindo a regra.
 */
export function PublicationPanel({
  productId,
  slug,
  status,
  isDeleted,
  issues,
}: {
  productId: string;
  slug: string;
  status: PublicationStatus;
  isDeleted: boolean;
  issues: PublicationIssue[];
}) {
  const router = useRouter();
  const { pending, result, run } = useActionRunner();
  const [confirm, setConfirm] = useState<"unpublish" | "delete" | null>(null);
  const setStatus = (next: PublicationStatus) => {
    // Fecha a confirmação já: o resultado (inclusive bloqueio do banco) aparece no painel.
    setConfirm(null);
    run(setProductStatusAction, { id: productId, status: next });
  };

  if (isDeleted) {
    return (
      <section
        aria-label="Publicação"
        className="flex flex-col gap-3 rounded-card border border-danger p-4"
      >
        <p className="text-body font-semibold">Produto excluído</p>
        <p className="text-caption text-muted">
          Ele não aparece no site. Restaure para voltar a editar.
        </p>
        <Button
          pending={pending}
          onClick={() => run(restoreProductAction, { id: productId })}
          className="w-fit"
        >
          Restaurar produto
        </Button>
        <ActionMessage result={result} success="Produto restaurado." />
      </section>
    );
  }

  const published = status === "PUBLISHED";
  return (
    <section
      aria-label="Publicação"
      className="flex flex-col gap-3 rounded-card border border-border p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption text-muted">Status:</span>
        <Badge
          tone={
            published
              ? "success"
              : status === "REVIEWED"
                ? "warning"
                : "neutral"
          }
        >
          {PUBLICATION_STATUS_LABELS[status]}
        </Badge>
        <span className="text-caption text-muted">
          {published ? "Aparece no site." : "Não aparece no site."}
        </span>
      </div>

      {!published ? (
        issues.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-control border border-warning p-3">
            <p className="text-caption font-semibold">Para publicar, falta:</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-caption">
              {issues.map((issue) => (
                <li key={issue}>
                  <Link
                    href={ISSUE_LINKS[issue](productId)}
                    className="underline"
                  >
                    {PUBLICATION_ISSUE_MESSAGES[issue]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-caption text-success">
            Pronto para publicar: nenhuma pendência.
          </p>
        )
      ) : null}

      <div className="flex flex-wrap gap-2">
        {published ? (
          <>
            <a
              href={`/produto/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary")}
            >
              Ver no site<span className="sr-only"> (abre em nova aba)</span>
            </a>
            <Button onClick={() => setConfirm("unpublish")}>Despublicar</Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              pending={pending}
              disabled={issues.length > 0}
              aria-describedby={
                issues.length > 0 ? "pendencias-publicacao" : undefined
              }
              onClick={() => setStatus("PUBLISHED")}
            >
              Publicar
            </Button>
            {status === "DRAFT" ? (
              <Button pending={pending} onClick={() => setStatus("REVIEWED")}>
                Marcar como revisado
              </Button>
            ) : (
              <Button pending={pending} onClick={() => setStatus("DRAFT")}>
                Voltar a rascunho
              </Button>
            )}
          </>
        )}
        <Button variant="ghost" onClick={() => setConfirm("delete")}>
          Excluir produto
        </Button>
      </div>
      {issues.length > 0 && !published ? (
        <p id="pendencias-publicacao" className="sr-only">
          Publicar está indisponível até resolver as pendências listadas.
        </p>
      ) : null}
      <ActionMessage result={result} success="Status atualizado." />

      <ConfirmDialog
        open={confirm === "unpublish"}
        title="Despublicar produto?"
        message="O produto sai do site na hora e volta para “Revisado”. Você pode publicar de novo depois."
        confirmLabel="Despublicar"
        pending={pending}
        onConfirm={() => setStatus("REVIEWED")}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Excluir produto?"
        message="O produto sai do site e vai para os excluídos. Nada é apagado de vez: dá para restaurar."
        confirmLabel="Excluir"
        danger
        pending={pending}
        onConfirm={() => {
          setConfirm(null);
          run(deleteProductAction, { id: productId }, () =>
            router.push("/admin/produtos?lixeira=1"),
          );
        }}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
