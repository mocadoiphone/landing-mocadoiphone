"use client";

import { useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import { type ProductMediaSlot } from "@/lib/media/media";
import type { EditorMediaLink, EditorVariant } from "@/services/admin/queries";
import {
  linkProductMediaAction,
  reorderProductMediaAction,
  unlinkProductMediaAction,
  updateProductMediaAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionRunner } from "../../forms/use-action-form";
import { MediaPicker } from "../../media/media-picker";
import { type PanelMedia, toMediaView } from "../../media/media-helpers";
import { Button } from "../../ui/button";
import { ConfirmDialog, Dialog } from "../../ui/dialog";
import { TextField } from "../../ui/fields";
import { ReorderButtons } from "../../ui/reorder-buttons";

import { variantName } from "./variant-utils";

type Picking = {
  slot: ProductMediaSlot;
  variantId: string | null;
  replaceLinkId: string | null;
};

/**
 * Aba Mídia (Brain §17, §20): principal, mobile, galeria, vídeo e imagens por
 * variante. A imagem principal de produto publicado pode ser TROCADA, não removida.
 */
export function MediaTab({
  productId,
  links,
  variants,
  library,
  videoEnabled,
}: {
  productId: string;
  links: EditorMediaLink[];
  variants: EditorVariant[];
  library: PanelMedia[];
  videoEnabled: boolean;
}) {
  const { pending, result, run } = useActionRunner();
  const [picking, setPicking] = useState<Picking | null>(null);
  const [removing, setRemoving] = useState<EditorMediaLink | null>(null);
  const [editingAlt, setEditingAlt] = useState<EditorMediaLink | null>(null);
  const [altValue, setAltValue] = useState("");

  const linksFor = (slot: ProductMediaSlot, variantId: string | null = null) =>
    links.filter((link) => link.slot === slot && link.variantId === variantId);

  function select(mediaId: string) {
    if (!picking) return;
    const target = picking;
    setPicking(null);
    if (target.replaceLinkId) {
      run(updateProductMediaAction, {
        id: target.replaceLinkId,
        mediaAssetId: mediaId,
      });
    } else {
      run(linkProductMediaAction, {
        productId,
        mediaAssetId: mediaId,
        slot: target.slot,
        variantId: target.variantId,
      });
    }
  }

  // Funções de renderização (não componentes): mantêm a identidade estável entre renders.
  const renderCard = (
    link: EditorMediaLink,
    order?: { ids: string[]; index: number },
  ) => (
    <li
      key={link.id}
      className="flex flex-col gap-2 rounded-card border border-border p-2"
    >
      {link.asset ? (
        <MediaImage
          media={toMediaView(link.asset, link.altText)}
          className="aspect-square h-auto w-full rounded-media object-contain"
        />
      ) : (
        <p className="text-caption text-danger">Arquivo indisponível.</p>
      )}
      <p className="line-clamp-2 text-caption">
        {link.altText ?? link.asset?.altText}
      </p>
      <div className="flex flex-wrap gap-1">
        {order ? (
          <ReorderButtons
            ids={order.ids}
            index={order.index}
            label="imagem"
            pending={pending}
            onReorder={(orderedIds) =>
              run(reorderProductMediaAction, {
                productId,
                slot: link.slot,
                variantId: link.variantId,
                orderedIds,
              })
            }
          />
        ) : (
          <Button
            className="min-h-9"
            onClick={() =>
              setPicking({
                slot: link.slot as ProductMediaSlot,
                variantId: link.variantId,
                replaceLinkId: link.id,
              })
            }
          >
            Trocar
          </Button>
        )}
        <Button
          variant="ghost"
          className="min-h-9"
          onClick={() => {
            setEditingAlt(link);
            setAltValue(link.altText ?? "");
          }}
        >
          Alt
        </Button>
        <Button
          variant="ghost"
          className="min-h-9"
          onClick={() => setRemoving(link)}
        >
          Remover
        </Button>
      </div>
    </li>
  );

  const renderSingle = (
    slot: ProductMediaSlot,
    title: string,
    hint: string,
  ) => {
    const current = linksFor(slot)[0];
    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-body font-semibold">{title}</h3>
        <p className="text-caption text-muted">{hint}</p>
        {current ? (
          <ul className="grid max-w-56 grid-cols-1">{renderCard(current)}</ul>
        ) : (
          <Button
            className="w-fit"
            onClick={() =>
              setPicking({ slot, variantId: null, replaceLinkId: null })
            }
          >
            Escolher imagem
          </Button>
        )}
      </section>
    );
  };

  const renderMulti = (
    slot: ProductMediaSlot,
    title: string,
    hint?: string,
    variantId: string | null = null,
  ) => {
    const items = linksFor(slot, variantId);
    const ids = items.map((item) => item.id);
    return (
      <section
        key={`${slot}-${variantId ?? "produto"}`}
        className="flex flex-col gap-2"
      >
        <h3 className="text-body font-semibold">{title}</h3>
        {hint ? <p className="text-caption text-muted">{hint}</p> : null}
        {items.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((link, index) => renderCard(link, { ids, index }))}
          </ul>
        ) : null}
        <Button
          className="w-fit"
          onClick={() => setPicking({ slot, variantId, replaceLinkId: null })}
        >
          Adicionar {slot === "VIDEO" ? "vídeo" : "imagem"}
        </Button>
      </section>
    );
  };

  const activeVariants = variants.filter(
    (variant) => variant.deleted_at === null,
  );
  const hasVideos = linksFor("VIDEO").length > 0;

  return (
    <div className="flex flex-col gap-8">
      <ActionMessage result={result} success="Mídia atualizada." />
      {renderSingle(
        "MAIN",
        "Imagem principal",
        "Obrigatória para publicar. Aparece nos cards e no topo da página.",
      )}
      {renderSingle(
        "MOBILE",
        "Imagem mobile",
        "Opcional. Versão para telas pequenas.",
      )}
      {renderMulti("GALLERY", "Galeria", "Use ↑ ↓ para definir a ordem.")}
      {videoEnabled || hasVideos
        ? renderMulti(
            "VIDEO",
            "Vídeos",
            videoEnabled
              ? "MP4 até 50 MB."
              : "Envio de vídeo desativado em Configurações.",
          )
        : null}

      {activeVariants.length > 1 ? (
        <section className="flex flex-col gap-4">
          <h3 className="text-body font-semibold">Imagens por variante</h3>
          <p className="text-caption text-muted">
            Opcional: imagens que aparecem quando a variante é escolhida (ex.:
            por cor).
          </p>
          {activeVariants.map((variant) =>
            renderMulti("GALLERY", variantName(variant), undefined, variant.id),
          )}
        </section>
      ) : null}

      <MediaPicker
        open={picking !== null}
        title={picking?.slot === "VIDEO" ? "Escolher vídeo" : "Escolher imagem"}
        kind={picking?.slot === "VIDEO" ? "VIDEO" : "IMAGE"}
        library={library}
        folder="products"
        videoEnabled={videoEnabled}
        pending={pending}
        onClose={() => setPicking(null)}
        onSelect={select}
      />

      <Dialog
        open={editingAlt !== null}
        onClose={() => setEditingAlt(null)}
        title="Texto alternativo nesta posição"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (editingAlt)
              run(updateProductMediaAction, {
                id: editingAlt.id,
                altText: altValue,
              });
            setEditingAlt(null);
          }}
        >
          <TextField
            label="Texto alternativo próprio"
            value={altValue}
            maxLength={300}
            onChange={(event) => setAltValue(event.target.value)}
            hint={`Deixe vazio para usar o da biblioteca: “${editingAlt?.asset?.altText ?? ""}”.`}
          />
          <Button type="submit" variant="primary" className="w-fit">
            Salvar
          </Button>
        </form>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title="Remover desta posição?"
        message="O arquivo continua na biblioteca. Se for a imagem principal de um produto publicado, use “Trocar” ou despublique antes."
        confirmLabel="Remover"
        danger
        pending={pending}
        onConfirm={() => {
          if (removing) run(unlinkProductMediaAction, { id: removing.id });
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
