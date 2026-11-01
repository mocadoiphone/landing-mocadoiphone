"use client";

import { type Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import { MEDIA_FOLDERS, type MediaFolder } from "@/lib/media/media";
import type { MediaLibraryItem } from "@/services/admin/queries";
import {
  deleteMediaAction,
  restoreMediaAction,
  updateMediaAltAction,
} from "@/services/media/actions";

import { ActionMessage } from "../forms/action-message";
import { useActionForm, useActionRunner } from "../forms/use-action-form";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Badge, EmptyState } from "../ui/feedback";
import { TextField } from "../ui/fields";

import { formatBytes, toMediaView } from "./media-helpers";
import { UploadField } from "./upload-field";

const FOLDER_LABELS: Record<MediaFolder, string> = {
  products: "Produtos",
  categories: "Categorias",
  home: "Home",
  banners: "Banners",
  store: "Loja e contatos",
  seo: "SEO",
};

function AltForm({
  item,
  onDone,
}: {
  item: MediaLibraryItem;
  onDone: () => void;
}) {
  const { state, formAction, pending, errors } = useActionForm(
    updateMediaAltAction,
    { altText: "text" },
    { id: item.id },
  );
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <TextField
        label="Texto alternativo"
        name="altText"
        required
        maxLength={300}
        defaultValue={item.altText}
        errors={errors("altText")}
      />
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar texto alternativo
      </Button>
    </form>
  );
}

/** Biblioteca de mídia (Brain §20): envio, alt obrigatório, uso e exclusão segura. */
export function MediaLibrary({
  items,
  videoEnabled,
}: {
  items: MediaLibraryItem[];
  videoEnabled: boolean;
}) {
  const { pending, result, run } = useActionRunner();
  const [kind, setKind] = useState<"all" | "IMAGE" | "VIDEO">("all");
  const [usage, setUsage] = useState<"all" | "used" | "unused">("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [folder, setFolder] = useState<MediaFolder>("products");
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === openId) ?? null;

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          item.isDeleted === showDeleted &&
          (kind === "all" || item.kind === kind) &&
          (usage === "all" ||
            (usage === "used"
              ? item.usages.length > 0
              : item.usages.length === 0)),
      ),
    [items, kind, usage, showDeleted],
  );

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-col gap-3 rounded-card border border-border p-4"
        aria-labelledby="enviar-arquivo"
      >
        <h2 id="enviar-arquivo" className="text-body font-semibold">
          Enviar arquivo
        </h2>
        <label className="flex max-w-xs flex-col gap-1 text-caption font-medium">
          Pasta
          <select
            value={folder}
            onChange={(event) => setFolder(event.target.value as MediaFolder)}
            className="min-h-10 rounded-control border border-border bg-background px-3 text-body"
          >
            {MEDIA_FOLDERS.map((value) => (
              <option key={value} value={value}>
                {FOLDER_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <UploadField
          folder={folder}
          kinds={["IMAGE", "VIDEO"]}
          videoEnabled={videoEnabled}
        />
      </section>

      <div
        className="flex flex-wrap items-end gap-3"
        role="group"
        aria-label="Filtros da biblioteca"
      >
        <label className="flex flex-col gap-1 text-caption font-medium">
          Tipo
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
            className="min-h-10 rounded-control border border-border bg-background px-3"
          >
            <option value="all">Todos</option>
            <option value="IMAGE">Imagens</option>
            <option value="VIDEO">Vídeos</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption font-medium">
          Uso
          <select
            value={usage}
            onChange={(event) => setUsage(event.target.value as typeof usage)}
            className="min-h-10 rounded-control border border-border bg-background px-3"
          >
            <option value="all">Todos</option>
            <option value="used">Em uso</option>
            <option value="unused">Sem uso</option>
          </select>
        </label>
        <label className="flex min-h-10 items-center gap-2 text-caption">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(event) => setShowDeleted(event.target.checked)}
            className="size-4 accent-accent"
          />
          Mostrar excluídas
        </label>
      </div>

      <ActionMessage result={result} />

      {visible.length === 0 ? (
        <EmptyState title="Nenhum arquivo com estes filtros." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                className="flex w-full flex-col gap-2 rounded-card border border-border p-2 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-ring"
              >
                <MediaImage
                  media={toMediaView(item)}
                  className="aspect-square h-auto w-full rounded-media object-contain"
                />
                <span className="line-clamp-2 text-caption">
                  {item.altText}
                </span>
                <span className="flex flex-wrap gap-1">
                  <Badge tone={item.usages.length ? "success" : "neutral"}>
                    {item.usages.length
                      ? `Em uso (${item.usages.length})`
                      : "Sem uso"}
                  </Badge>
                  {item.isDeleted ? (
                    <Badge tone="danger">Excluída</Badge>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={selected !== null}
        onClose={() => setOpenId(null)}
        title="Detalhes da mídia"
        wide
      >
        {selected ? (
          <div className="grid gap-6 md:grid-cols-2">
            <MediaImage
              media={toMediaView(selected)}
              className="h-auto w-full rounded-media border border-border object-contain"
            />
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-caption">
                <dt className="text-muted">Formato</dt>
                <dd>{selected.mimeType}</dd>
                <dt className="text-muted">Tamanho</dt>
                <dd>{formatBytes(selected.sizeBytes)}</dd>
                {selected.width && selected.height ? (
                  <>
                    <dt className="text-muted">Dimensões</dt>
                    <dd>
                      {selected.width} × {selected.height} px
                    </dd>
                  </>
                ) : null}
                <dt className="text-muted">Arquivo</dt>
                <dd className="break-all">{selected.storagePath}</dd>
              </dl>
              {!selected.isDeleted ? (
                <AltForm
                  key={selected.id}
                  item={selected}
                  onDone={() => undefined}
                />
              ) : null}
              <div className="flex flex-col gap-2">
                <p className="text-caption font-semibold">Onde é usada</p>
                {selected.usages.length === 0 ? (
                  <p className="text-caption text-muted">Em nenhum lugar.</p>
                ) : (
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-caption">
                    {selected.usages.map((usageItem) => (
                      <li key={`${usageItem.label}-${usageItem.href ?? ""}`}>
                        {usageItem.href ? (
                          <Link
                            href={usageItem.href as Route}
                            className="underline"
                          >
                            {usageItem.label}
                          </Link>
                        ) : (
                          usageItem.label
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selected.isDeleted ? (
                <Button
                  pending={pending}
                  className="w-fit"
                  onClick={() => run(restoreMediaAction, { id: selected.id })}
                >
                  Restaurar
                </Button>
              ) : (
                <div className="flex flex-col gap-1">
                  <Button
                    variant="danger"
                    className="w-fit"
                    pending={pending}
                    disabled={selected.usages.length > 0}
                    onClick={() => {
                      run(deleteMediaAction, { id: selected.id });
                      setOpenId(null);
                    }}
                  >
                    Excluir arquivo
                  </Button>
                  {selected.usages.length > 0 ? (
                    <p className="text-caption text-muted">
                      Remova a mídia dos lugares acima antes de excluir.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
