"use client";

import { useCallback, useState } from "react";

import {
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  type BlockType,
  SECTION_THEME_LABELS,
} from "@/lib/home/blocks";
import type {
  AdminHomeBlock,
  HomeCategoryOption,
  HomeProductOption,
} from "@/services/home/admin-queries";
import {
  deleteHomeBlockAction,
  reorderHomeBlocksAction,
  setHomeBlockActiveAction,
} from "@/services/home/actions";

import { ActionMessage } from "../forms/action-message";
import { useActionRunner } from "../forms/use-action-form";
import { type PanelMedia } from "../media/media-helpers";
import { Button } from "../ui/button";
import { ConfirmDialog, Dialog } from "../ui/dialog";
import { Badge, EmptyState } from "../ui/feedback";
import { SelectField } from "../ui/fields";
import { ReorderButtons } from "../ui/reorder-buttons";

import { HomeBlockForm } from "./home-block-form";

type Editing =
  | { mode: "choose" }
  | { mode: "create"; type: BlockType }
  | { mode: "edit"; block: AdminHomeBlock };

function blockName(block: AdminHomeBlock): string {
  return (
    block.title ?? block.productName ?? BLOCK_DEFINITIONS[block.type].label
  );
}

/**
 * Montagem da Home (Brain §18, §19; MDI-D030): ordem, ativação, edição e
 * exclusão dos blocos. O layout de cada tipo é do sistema.
 */
export function HomeBlocksManager({
  blocks,
  products,
  categories,
  library,
  videoEnabled,
}: {
  blocks: AdminHomeBlock[];
  products: HomeProductOption[];
  categories: HomeCategoryOption[];
  library: PanelMedia[];
  videoEnabled: boolean;
}) {
  const { pending, result, run } = useActionRunner();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [newType, setNewType] = useState<BlockType>("HERO_PRODUCT");
  const [removing, setRemoving] = useState<AdminHomeBlock | null>(null);
  const close = useCallback(() => setEditing(null), []);
  const ids = blocks.map((block) => block.id);

  const formType =
    editing?.mode === "create"
      ? editing.type
      : editing?.mode === "edit"
        ? editing.block.type
        : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption font-medium underline underline-offset-4"
        >
          Ver a Home no site
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        <Button
          variant="primary"
          onClick={() => setEditing({ mode: "choose" })}
        >
          Novo bloco
        </Button>
      </div>
      <ActionMessage result={result} success="Alterações salvas." />

      {blocks.length === 0 ? (
        <EmptyState title="Nenhum bloco na Home. Enquanto isso, o site mostra a composição padrão (linhas Apple, lançamentos e loja)." />
      ) : (
        <ol className="flex flex-col gap-3">
          {blocks.map((block, index) => (
            <li
              key={block.id}
              className="flex flex-col gap-3 rounded-card border border-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-caption text-muted">
                      {index + 1}.
                    </span>
                    <h2 className="text-body font-semibold">
                      {blockName(block)}
                    </h2>
                    <Badge tone={block.isActive ? "success" : "neutral"}>
                      {block.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-caption text-muted">
                    {BLOCK_DEFINITIONS[block.type].label} · Tema{" "}
                    {SECTION_THEME_LABELS[block.theme].toLowerCase()}
                  </p>
                  {block.warnings.map((warning) => (
                    <p key={warning} className="text-caption text-warning">
                      {warning}
                    </p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <ReorderButtons
                    ids={ids}
                    index={index}
                    label={blockName(block)}
                    pending={pending}
                    onReorder={(orderedIds) =>
                      run(reorderHomeBlocksAction, { orderedIds })
                    }
                  />
                  <Button onClick={() => setEditing({ mode: "edit", block })}>
                    Editar
                  </Button>
                  <Button
                    pending={pending}
                    onClick={() =>
                      run(setHomeBlockActiveAction, {
                        id: block.id,
                        isActive: !block.isActive,
                      })
                    }
                  >
                    {block.isActive ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="danger" onClick={() => setRemoving(block)}>
                    Excluir
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={editing?.mode === "choose"}
        onClose={close}
        title="Novo bloco"
        description="Escolha o tipo. Cada tipo tem um layout próprio do site."
      >
        <div className="flex flex-col gap-4">
          <SelectField
            label="Tipo de bloco"
            value={newType}
            onChange={(event) => setNewType(event.target.value as BlockType)}
            options={BLOCK_TYPES.map((type) => ({
              value: type,
              label: BLOCK_DEFINITIONS[type].label,
            }))}
            hint={BLOCK_DEFINITIONS[newType].description}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={close}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => setEditing({ mode: "create", type: newType })}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={formType !== null}
        onClose={close}
        wide
        title={
          formType
            ? `${editing?.mode === "edit" ? "Editar" : "Novo"} bloco: ${BLOCK_DEFINITIONS[formType].label}`
            : "Bloco"
        }
      >
        {formType ? (
          <HomeBlockForm
            key={editing?.mode === "edit" ? editing.block.id : formType}
            type={formType}
            block={editing?.mode === "edit" ? editing.block : null}
            products={products}
            categories={categories}
            library={library}
            videoEnabled={videoEnabled}
            onDone={close}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title="Excluir bloco"
        message={
          removing
            ? `Excluir o bloco "${blockName(removing)}" da Home? Para só tirar do site, use Desativar.`
            : ""
        }
        confirmLabel="Excluir bloco"
        danger
        pending={pending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) run(deleteHomeBlockAction, { id: removing.id });
          setRemoving(null);
        }}
      />
    </div>
  );
}
