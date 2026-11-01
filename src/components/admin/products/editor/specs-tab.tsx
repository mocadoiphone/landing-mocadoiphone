"use client";

import { useEffect, useRef, useState } from "react";

import {
  createSpecAction,
  deleteSpecAction,
  reorderSpecsAction,
  updateSpecAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionForm, useActionRunner } from "../../forms/use-action-form";
import { Button } from "../../ui/button";
import { ConfirmDialog, Dialog } from "../../ui/dialog";
import { EmptyState } from "../../ui/feedback";
import { TextField } from "../../ui/fields";
import { ReorderButtons } from "../../ui/reorder-buttons";

type Spec = {
  id: string;
  groupName: string | null;
  label: string;
  value: string;
};

const SPEC_SPEC = { groupName: "text", label: "text", value: "text" } as const;

function SpecForm({
  productId,
  spec,
  onDone,
}: {
  productId: string;
  spec: Spec | null;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, formAction, pending, errors } = useActionForm(
    spec ? updateSpecAction : createSpecAction,
    SPEC_SPEC,
    spec ? { id: spec.id } : { productId },
  );

  // Depois de salvar: o formulário de inclusão fica limpo para a próxima; o de edição fecha.
  useEffect(() => {
    if (!state?.ok) return;
    if (!spec) formRef.current?.reset();
    onDone?.();
  }, [state, spec, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Grupo"
          name="groupName"
          maxLength={80}
          defaultValue={spec?.groupName ?? ""}
          hint="Ex.: Tela, Câmera"
          errors={errors("groupName")}
        />
        <TextField
          label="Nome"
          name="label"
          required
          maxLength={120}
          defaultValue={spec?.label ?? ""}
          hint="Ex.: Tamanho"
          errors={errors("label")}
        />
        <TextField
          label="Valor"
          name="value"
          required
          maxLength={500}
          defaultValue={spec?.value ?? ""}
          hint={'Ex.: 6,9"'}
          errors={errors("value")}
        />
      </div>
      <ActionMessage
        result={state}
        success={spec ? "Especificação salva." : "Especificação adicionada."}
      />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        {spec ? "Salvar" : "Adicionar especificação"}
      </Button>
    </form>
  );
}

/** Aba Conteúdo (Brain §17): especificações. Blocos editoriais entram na Etapa 05 (MDI-D028). */
export function SpecsTab({
  productId,
  specs,
}: {
  productId: string;
  specs: Spec[];
}) {
  const { pending, result, run } = useActionRunner();
  const [editing, setEditing] = useState<Spec | null>(null);
  const [removing, setRemoving] = useState<Spec | null>(null);
  const ids = specs.map((spec) => spec.id);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-caption text-muted">
        Benefícios e seções editoriais do produto entram na Etapa 05, junto com
        o design da página.
      </p>
      <ActionMessage result={result} success="Especificações atualizadas." />
      {specs.length === 0 ? (
        <EmptyState title="Nenhuma especificação cadastrada." />
      ) : (
        <ul className="divide-y divide-border rounded-card border border-border">
          {specs.map((spec, index) => (
            <li
              key={spec.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-caption"
            >
              <span>
                {spec.groupName ? (
                  <span className="text-muted">{spec.groupName} · </span>
                ) : null}
                <strong>{spec.label}:</strong> {spec.value}
              </span>
              <span className="flex gap-1">
                <ReorderButtons
                  ids={ids}
                  index={index}
                  label={spec.label}
                  pending={pending}
                  onReorder={(orderedIds) =>
                    run(reorderSpecsAction, { productId, orderedIds })
                  }
                />
                <Button className="min-h-9" onClick={() => setEditing(spec)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9"
                  onClick={() => setRemoving(spec)}
                >
                  Excluir
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3 rounded-card border border-border p-4">
        <h3 className="text-body font-semibold">Nova especificação</h3>
        <SpecForm productId={productId} spec={null} />
      </section>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar especificação"
      >
        {editing ? (
          <SpecForm
            key={editing.id}
            productId={productId}
            spec={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title="Excluir especificação?"
        message={`“${removing?.label ?? ""}” será removida do produto.`}
        confirmLabel="Excluir"
        danger
        pending={pending}
        onConfirm={() => {
          if (removing) run(deleteSpecAction, { id: removing.id });
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
