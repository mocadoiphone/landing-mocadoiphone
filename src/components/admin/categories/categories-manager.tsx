"use client";

import { useCallback, useEffect, useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import type { AdminCategory } from "@/services/admin/queries";
import {
  createCategoryAction,
  createFamilyAction,
  deleteCategoryAction,
  deleteFamilyAction,
  reorderCategoriesAction,
  reorderFamiliesAction,
  restoreCategoryAction,
  restoreFamilyAction,
  updateCategoryAction,
  updateFamilyAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../forms/action-message";
import { useActionForm, useActionRunner } from "../forms/use-action-form";
import { MediaPicker } from "../media/media-picker";
import { type PanelMedia, toMediaView } from "../media/media-helpers";
import { Button } from "../ui/button";
import { ConfirmDialog, Dialog } from "../ui/dialog";
import { Badge, EmptyState } from "../ui/feedback";
import { CheckboxField, TextAreaField, TextField } from "../ui/fields";
import { ReorderButtons } from "../ui/reorder-buttons";

type Family = AdminCategory["families"][number];

function CategoryForm({
  category,
  library,
  onDone,
}: {
  category: AdminCategory | null;
  library: PanelMedia[];
  onDone: () => void;
}) {
  const [imageId, setImageId] = useState(category?.image?.id ?? "");
  const [picking, setPicking] = useState(false);
  const image =
    library.find((item) => item.id === imageId) ??
    (category?.image?.id === imageId ? category.image : null);
  const { state, formAction, pending, errors } = useActionForm(
    category ? updateCategoryAction : createCategoryAction,
    {
      name: "text",
      slug: "text",
      description: "text",
      isActive: "boolean",
      imageAssetId: "text",
    },
    category ? { id: category.id } : {},
  );
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Nome"
        name="name"
        required
        maxLength={80}
        defaultValue={category?.name ?? ""}
        errors={errors("name")}
      />
      <TextField
        label="Endereço (slug)"
        name="slug"
        maxLength={80}
        defaultValue={category?.slug ?? ""}
        hint="Vira a página /<slug> do site (ex.: iphone). Vazio = gerado pelo nome."
        errors={errors("slug")}
      />
      <TextAreaField
        label="Descrição"
        name="description"
        maxLength={500}
        defaultValue={category?.description ?? ""}
        errors={errors("description")}
      />
      <CheckboxField
        label="Ativa (aparece no site)"
        name="isActive"
        defaultChecked={category?.isActive ?? false}
        hint="Desativar tira a linha inteira do site sem apagar nada."
      />
      <input type="hidden" name="imageAssetId" value={imageId} />
      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium">Imagem</span>
        {image ? (
          <MediaImage
            media={toMediaView(image)}
            className="h-auto w-32 rounded-media border border-border object-contain"
          />
        ) : null}
        <div className="flex gap-2">
          <Button onClick={() => setPicking(true)}>
            {image ? "Trocar imagem" : "Escolher imagem"}
          </Button>
          {imageId ? (
            <Button variant="ghost" onClick={() => setImageId("")}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" pending={pending}>
          {category ? "Salvar categoria" : "Criar categoria"}
        </Button>
      </div>
      <MediaPicker
        open={picking}
        title="Imagem da categoria"
        kind="IMAGE"
        library={library}
        folder="categories"
        videoEnabled={false}
        onClose={() => setPicking(false)}
        onSelect={(id) => {
          setImageId(id);
          setPicking(false);
        }}
      />
    </form>
  );
}

function FamilyForm({
  categoryId,
  family,
  onDone,
}: {
  categoryId: string;
  family: Family | null;
  onDone: () => void;
}) {
  const { state, formAction, pending, errors } = useActionForm(
    family ? updateFamilyAction : createFamilyAction,
    { name: "text", slug: "text" },
    family ? { id: family.id } : { categoryId },
  );
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Nome"
        name="name"
        required
        maxLength={120}
        defaultValue={family?.name ?? ""}
        hint="Ex.: iPhone 17"
        errors={errors("name")}
      />
      <TextField
        label="Endereço (slug)"
        name="slug"
        maxLength={120}
        defaultValue={family?.slug ?? ""}
        hint="Vazio = gerado pelo nome."
        errors={errors("slug")}
      />
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" pending={pending}>
          {family ? "Salvar família" : "Criar família"}
        </Button>
      </div>
    </form>
  );
}

type Editing =
  | { kind: "category"; category: AdminCategory | null }
  | { kind: "family"; categoryId: string; family: Family | null };

type Removing =
  { kind: "category"; item: AdminCategory } | { kind: "family"; item: Family };

/** Categorias e famílias (Brain §8): ordem, ativação, edição e exclusão segura. */
export function CategoriesManager({
  categories,
  library,
}: {
  categories: AdminCategory[];
  library: PanelMedia[];
}) {
  const { pending, result, run } = useActionRunner();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [removing, setRemoving] = useState<Removing | null>(null);
  const close = useCallback(() => setEditing(null), []);
  const active = categories.filter((category) => !category.isDeleted);
  const deleted = categories.filter((category) => category.isDeleted);
  const categoryIds = active.map((category) => category.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => setEditing({ kind: "category", category: null })}
        >
          Nova categoria
        </Button>
      </div>
      <ActionMessage result={result} success="Alterações salvas." />

      {active.length === 0 ? (
        <EmptyState title="Nenhuma categoria cadastrada." />
      ) : (
        <ul className="flex flex-col gap-3">
          {active.map((category, index) => {
            const families = category.families.filter(
              (family) => !family.isDeleted,
            );
            const deletedFamilies = category.families.filter(
              (family) => family.isDeleted,
            );
            const familyIds = families.map((family) => family.id);
            return (
              <li
                key={category.id}
                className="flex flex-col gap-3 rounded-card border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-body font-semibold">{category.name}</h2>
                    <span className="text-caption text-muted">
                      /{category.slug}
                    </span>
                    <Badge tone={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    <span className="text-caption text-muted">
                      {category.productCount} produto(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <ReorderButtons
                      ids={categoryIds}
                      index={index}
                      label={category.name}
                      pending={pending}
                      onReorder={(orderedIds) =>
                        run(reorderCategoriesAction, { orderedIds })
                      }
                    />
                    <Button
                      className="min-h-9"
                      onClick={() => setEditing({ kind: "category", category })}
                    >
                      Editar
                    </Button>
                    <Button
                      className="min-h-9"
                      pending={pending}
                      onClick={() =>
                        run(updateCategoryAction, {
                          id: category.id,
                          isActive: !category.isActive,
                        })
                      }
                    >
                      {category.isActive ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-9"
                      onClick={() =>
                        setRemoving({ kind: "category", item: category })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-caption font-semibold">Famílias</h3>
                    <Button
                      className="min-h-9"
                      onClick={() =>
                        setEditing({
                          kind: "family",
                          categoryId: category.id,
                          family: null,
                        })
                      }
                    >
                      Nova família
                    </Button>
                  </div>
                  {families.length === 0 ? (
                    <p className="text-caption text-muted">
                      Nenhuma família. Produtos precisam de uma família.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {families.map((family, familyIndex) => (
                        <li
                          key={family.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2 text-caption"
                        >
                          <span>
                            {family.name}{" "}
                            <span className="text-muted">
                              · {family.productCount} produto(s)
                            </span>
                          </span>
                          <span className="flex gap-1">
                            <ReorderButtons
                              ids={familyIds}
                              index={familyIndex}
                              label={family.name}
                              pending={pending}
                              onReorder={(orderedIds) =>
                                run(reorderFamiliesAction, {
                                  categoryId: category.id,
                                  orderedIds,
                                })
                              }
                            />
                            <Button
                              className="min-h-9"
                              onClick={() =>
                                setEditing({
                                  kind: "family",
                                  categoryId: category.id,
                                  family,
                                })
                              }
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              className="min-h-9"
                              onClick={() =>
                                setRemoving({ kind: "family", item: family })
                              }
                            >
                              Excluir
                            </Button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {deletedFamilies.length > 0 ? (
                    <details>
                      <summary className="cursor-pointer text-caption text-muted">
                        Famílias excluídas ({deletedFamilies.length})
                      </summary>
                      <ul className="mt-2 flex flex-col gap-1">
                        {deletedFamilies.map((family) => (
                          <li
                            key={family.id}
                            className="flex items-center justify-between text-caption"
                          >
                            {family.name}
                            <Button
                              className="min-h-9"
                              pending={pending}
                              onClick={() =>
                                run(restoreFamilyAction, { id: family.id })
                              }
                            >
                              Restaurar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleted.length > 0 ? (
        <details className="rounded-card border border-border p-3">
          <summary className="cursor-pointer text-caption font-medium">
            Categorias excluídas ({deleted.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {deleted.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-2 text-caption"
              >
                {category.name}
                <Button
                  className="min-h-9"
                  pending={pending}
                  onClick={() =>
                    run(restoreCategoryAction, { id: category.id })
                  }
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
          editing?.kind === "family"
            ? editing.family
              ? `Editar família ${editing.family.name}`
              : "Nova família"
            : editing?.category
              ? `Editar ${editing.category.name}`
              : "Nova categoria"
        }
      >
        {editing?.kind === "category" ? (
          <CategoryForm
            key={editing.category?.id ?? "nova"}
            category={editing.category}
            library={library}
            onDone={close}
          />
        ) : editing?.kind === "family" ? (
          <FamilyForm
            key={editing.family?.id ?? "nova"}
            categoryId={editing.categoryId}
            family={editing.family}
            onDone={close}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title={
          removing?.kind === "family"
            ? "Excluir família?"
            : "Excluir categoria?"
        }
        message={
          removing?.kind === "family"
            ? "A família só pode ser excluída sem produtos ativos. Dá para restaurar depois."
            : "A categoria só pode ser excluída sem famílias e produtos ativos. Para tirar do site sem excluir, use Desativar."
        }
        confirmLabel="Excluir"
        danger
        pending={pending}
        onConfirm={() => {
          if (removing?.kind === "family")
            run(deleteFamilyAction, { id: removing.item.id });
          if (removing?.kind === "category")
            run(deleteCategoryAction, { id: removing.item.id });
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
