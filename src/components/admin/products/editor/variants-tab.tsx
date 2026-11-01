"use client";

import { useCallback, useState } from "react";

import { AVAILABILITY_LABELS } from "@/lib/availability/availability";
import { variantPrice } from "@/lib/pricing/pricing";
import type { EditorVariant } from "@/services/admin/queries";
import {
  deleteVariantAction,
  reorderVariantsAction,
  restoreVariantAction,
  setDefaultVariantAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionRunner } from "../../forms/use-action-form";
import { Button } from "../../ui/button";
import { ConfirmDialog, Dialog } from "../../ui/dialog";
import { Badge, EmptyState } from "../../ui/feedback";
import { ReorderButtons } from "../../ui/reorder-buttons";

import { VariantForm } from "./variant-form";
import { variantName, variantPriceFields } from "./variant-utils";

/** Aba Variantes (Brain §10): lista, padrão, ordem, editar, ocultar, excluir. */
export function VariantsTab({
  productId,
  variants,
}: {
  productId: string;
  variants: EditorVariant[];
}) {
  const { pending, result, run } = useActionRunner();
  const [editing, setEditing] = useState<EditorVariant | "new" | null>(null);
  const [deleting, setDeleting] = useState<EditorVariant | null>(null);
  const active = variants.filter((variant) => variant.deleted_at === null);
  const deleted = variants.filter((variant) => variant.deleted_at !== null);
  const ids = active.map((variant) => variant.id);
  const close = useCallback(() => setEditing(null), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-muted">
          A primeira variante visível vira a padrão automaticamente. A padrão
          abre selecionada no site.
        </p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          Nova variante
        </Button>
      </div>

      <ActionMessage result={result} success="Variantes atualizadas." />

      {active.length === 0 ? (
        <EmptyState title="Nenhuma variante cadastrada.">
          Produto e variante são entidades diferentes: o preço e a
          disponibilidade ficam na variante.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[40rem] text-left text-caption">
            <caption className="sr-only">Variantes do produto</caption>
            <thead className="border-b border-border bg-surface">
              <tr>
                {[
                  "Variante",
                  "Preço",
                  "Disponibilidade",
                  "Padrão",
                  "Ordem",
                  "Ações",
                ].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-3 py-2 font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {active.map((variant, index) => {
                const price = variantPrice(variantPriceFields(variant));
                const name = variantName(variant);
                return (
                  <tr key={variant.id}>
                    <th scope="row" className="px-3 py-2 font-medium">
                      {name}
                      {variant.sku ? (
                        <span className="block text-muted">
                          SKU {variant.sku}
                        </span>
                      ) : null}
                    </th>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {price.kind === "priced" ? price.amount : price.label}
                      {price.kind === "priced" && price.installment ? (
                        <span className="block text-muted">
                          {price.installment}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        tone={
                          variant.availability === "HIDDEN"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {AVAILABILITY_LABELS[variant.availability]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {variant.is_default ? (
                        <Badge tone="success">Padrão</Badge>
                      ) : variant.availability === "HIDDEN" ? (
                        "—"
                      ) : (
                        <Button
                          className="min-h-9"
                          pending={pending}
                          aria-label={`Definir ${name} como padrão`}
                          onClick={() =>
                            run(setDefaultVariantAction, { id: variant.id })
                          }
                        >
                          Definir padrão
                        </Button>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <ReorderButtons
                        ids={ids}
                        index={index}
                        label={name}
                        pending={pending}
                        onReorder={(orderedIds) =>
                          run(reorderVariantsAction, { productId, orderedIds })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          className="min-h-9"
                          onClick={() => setEditing(variant)}
                          aria-label={`Editar ${name}`}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="min-h-9"
                          onClick={() => setDeleting(variant)}
                          aria-label={`Excluir ${name}`}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleted.length > 0 ? (
        <details className="rounded-card border border-border p-3">
          <summary className="cursor-pointer text-caption font-medium">
            Variantes excluídas ({deleted.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {deleted.map((variant) => (
              <li
                key={variant.id}
                className="flex items-center justify-between gap-2 text-caption"
              >
                {variantName(variant)}
                <Button
                  className="min-h-9"
                  pending={pending}
                  onClick={() => run(restoreVariantAction, { id: variant.id })}
                >
                  Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Dialog
        open={editing !== null}
        onClose={close}
        title={
          editing === "new"
            ? "Nova variante"
            : `Editar ${editing ? variantName(editing) : ""}`
        }
        wide
      >
        {editing !== null ? (
          <VariantForm
            key={editing === "new" ? "new" : editing.id}
            productId={productId}
            variant={editing === "new" ? null : editing}
            onDone={close}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir variante?"
        message={
          <>
            A variante “{deleting ? variantName(deleting) : ""}” sai do site. Dá
            para restaurar depois. Se for a última variante visível de um
            produto publicado, despublique o produto antes.
          </>
        }
        confirmLabel="Excluir"
        danger
        pending={pending}
        onConfirm={() => {
          // Fecha já: o resultado (inclusive bloqueio do banco) aparece na tela.
          if (deleting) run(deleteVariantAction, { id: deleting.id });
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
