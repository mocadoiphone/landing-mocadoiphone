"use client";

import { useMemo, useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import { type MediaFolder, type MediaKind } from "@/lib/media/media";

import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { EmptyState } from "../ui/feedback";

import { type PanelMedia, toMediaView } from "./media-helpers";
import { UploadField } from "./upload-field";

/**
 * Escolher uma mídia da biblioteca ou enviar uma nova (que já fica selecionada).
 * Só lista mídia não excluída do tipo aceito pela posição.
 */
export function MediaPicker({
  open,
  title,
  kind,
  library,
  folder,
  videoEnabled,
  pending,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  kind: MediaKind;
  library: PanelMedia[];
  folder: MediaFolder;
  videoEnabled: boolean;
  pending?: boolean;
  onClose: () => void;
  onSelect: (mediaId: string) => void;
}) {
  const [mode, setMode] = useState<"library" | "upload">("library");
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      library.filter(
        (item) =>
          item.kind === kind &&
          item.altText.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [library, kind, query],
  );

  return (
    <Dialog open={open} onClose={onClose} title={title} wide>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2" role="group" aria-label="Origem da mídia">
          <Button
            variant={mode === "library" ? "primary" : "secondary"}
            onClick={() => setMode("library")}
          >
            Da biblioteca
          </Button>
          <Button
            variant={mode === "upload" ? "primary" : "secondary"}
            onClick={() => setMode("upload")}
          >
            Enviar novo arquivo
          </Button>
        </div>

        {mode === "upload" ? (
          <UploadField
            folder={folder}
            kinds={[kind]}
            videoEnabled={videoEnabled}
            onUploaded={(asset) => onSelect(asset.id)}
          />
        ) : (
          <>
            <label className="flex flex-col gap-1 text-caption font-medium">
              Buscar pelo texto alternativo
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-10 rounded-control border border-border bg-background px-3 text-body"
              />
            </label>
            {items.length === 0 ? (
              <EmptyState title="Nenhuma mídia encontrada.">
                Envie um arquivo novo.
              </EmptyState>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onSelect(item.id)}
                      className="flex w-full flex-col gap-2 rounded-card border border-border p-2 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
                    >
                      <MediaImage
                        media={toMediaView(item)}
                        className="aspect-square h-auto w-full rounded-media object-contain"
                      />
                      <span className="line-clamp-2 text-caption">
                        {item.altText}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
