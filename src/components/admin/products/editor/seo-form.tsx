"use client";

import { useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import { updateProductAction } from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionForm } from "../../forms/use-action-form";
import { MediaPicker } from "../../media/media-picker";
import { type PanelMedia, toMediaView } from "../../media/media-helpers";
import { Button } from "../../ui/button";
import { TextAreaField, TextField } from "../../ui/fields";

/** Aba SEO (Brain §17): dados guardados agora; aplicação no site na Etapa 07. */
export function SeoForm({
  product,
  ogImage,
  library,
}: {
  product: {
    id: string;
    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
  };
  ogImage: PanelMedia | null;
  library: PanelMedia[];
}) {
  const [title, setTitle] = useState(product.meta_title ?? "");
  const [description, setDescription] = useState(
    product.meta_description ?? "",
  );
  const [ogImageId, setOgImageId] = useState(ogImage?.id ?? "");
  const [picking, setPicking] = useState(false);
  const selectedOg =
    library.find((item) => item.id === ogImageId) ??
    (ogImage?.id === ogImageId ? ogImage : null);

  const { state, formAction, pending, errors } = useActionForm(
    updateProductAction,
    {
      metaTitle: "text",
      metaDescription: "text",
      canonicalUrl: "text",
      ogImageAssetId: "text",
    },
    { id: product.id },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-caption text-muted">
        Estes dados são salvos agora e passam a ser usados no site na etapa de
        SEO (Etapa 07).
      </p>
      <TextField
        label="Meta title"
        name="metaTitle"
        maxLength={120}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        hint={`${title.length}/120 caracteres. Vazio = nome do produto.`}
        errors={errors("metaTitle")}
      />
      <TextAreaField
        label="Meta description"
        name="metaDescription"
        maxLength={320}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        hint={`${description.length}/320 caracteres.`}
        errors={errors("metaDescription")}
      />
      <input type="hidden" name="ogImageAssetId" value={ogImageId} />
      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium">
          Imagem de compartilhamento (OG)
        </span>
        {selectedOg ? (
          <MediaImage
            media={toMediaView(selectedOg)}
            className="h-auto w-48 rounded-media border border-border object-contain"
          />
        ) : (
          <p className="text-caption text-muted">
            Nenhuma: será usada a imagem principal.
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={() => setPicking(true)}>Escolher imagem</Button>
          {ogImageId ? (
            <Button variant="ghost" onClick={() => setOgImageId("")}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      <TextField
        label="URL canônica"
        name="canonicalUrl"
        type="url"
        defaultValue={product.canonical_url ?? ""}
        hint="Opcional. Endereço completo começando com https://."
        errors={errors("canonicalUrl")}
      />
      <ActionMessage result={state} />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar SEO
      </Button>

      <MediaPicker
        open={picking}
        title="Imagem de compartilhamento"
        kind="IMAGE"
        library={library}
        folder="seo"
        videoEnabled={false}
        onClose={() => setPicking(false)}
        onSelect={(id) => {
          setOgImageId(id);
          setPicking(false);
        }}
      />
    </form>
  );
}
