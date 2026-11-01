"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  isAllowedMimeType,
  MEDIA_MAX_BYTES,
  type MediaFolder,
  type MediaKind,
} from "@/lib/media/media";
import { kindForMime } from "@/lib/media/signature";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  finalizeMediaUploadAction,
  prepareMediaUploadAction,
} from "@/services/media/actions";

import { Button } from "../ui/button";
import { FormMessage } from "../ui/feedback";
import { TextField } from "../ui/fields";

type Status = { kind: "idle" | "working" | "error" | "done"; message?: string };

async function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

/**
 * Envio de arquivo (MDI-D026): preparar no servidor → enviar direto ao Storage
 * pela URL temporária → o servidor confere o arquivo real e registra. As checagens
 * aqui são só para orientar antes do envio; quem decide é o servidor.
 */
export function UploadField({
  folder,
  kinds,
  videoEnabled = false,
  onUploaded,
}: {
  folder: MediaFolder;
  kinds: readonly MediaKind[];
  videoEnabled?: boolean;
  onUploaded?: (asset: { id: string; storage_path: string }) => void;
}) {
  const fileId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const allowVideo = kinds.includes("VIDEO") && videoEnabled;
  const accept = [
    ...(kinds.includes("IMAGE")
      ? ["image/jpeg", "image/png", "image/webp", "image/avif"]
      : []),
    ...(allowVideo ? ["video/mp4"] : []),
  ].join(",");

  // Prévia local: criada ao escolher o arquivo e liberada ao trocar ou sair da tela.
  const previewRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );
  function choose(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next?.type.startsWith("image/")
      ? URL.createObjectURL(next)
      : null;
    setPreview(previewRef.current);
    setFile(next);
    setStatus({ kind: "idle" });
  }

  async function upload() {
    if (!file)
      return setStatus({ kind: "error", message: "Escolha um arquivo." });
    const kind = kindForMime(file.type);
    if (!kind || !kinds.includes(kind) || !isAllowedMimeType(kind, file.type)) {
      return setStatus({
        kind: "error",
        message: "Formato não aceito. Use JPG, PNG, WEBP ou AVIF.",
      });
    }
    if (kind === "VIDEO" && !allowVideo) {
      return setStatus({
        kind: "error",
        message: "O envio de vídeo está desativado em Configurações.",
      });
    }
    if (file.size > MEDIA_MAX_BYTES[kind]) {
      return setStatus({
        kind: "error",
        message:
          kind === "IMAGE" ? "Imagem acima de 10 MB." : "Vídeo acima de 50 MB.",
      });
    }
    if (!altText.trim()) {
      return setStatus({
        kind: "error",
        message: "Descreva a imagem no texto alternativo (obrigatório).",
      });
    }

    setStatus({ kind: "working", message: "Enviando…" });
    try {
      const size = kind === "IMAGE" ? await readImageSize(file) : null;
      if (kind === "IMAGE" && !size) {
        return setStatus({
          kind: "error",
          message:
            "Não foi possível ler a imagem. O arquivo pode estar corrompido.",
        });
      }

      const prepared = await prepareMediaUploadAction({
        folder,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      if (!prepared.ok)
        return setStatus({ kind: "error", message: prepared.error.message });

      const { path, token } = prepared.data;
      const sent = await createSupabaseBrowserClient()
        .storage.from("media")
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (sent.error) {
        return setStatus({
          kind: "error",
          message: "O envio falhou. Verifique a conexão e tente de novo.",
        });
      }

      setStatus({ kind: "working", message: "Conferindo o arquivo…" });
      const finalized = await finalizeMediaUploadAction({
        storagePath: path,
        altText,
        width: size?.width ?? null,
        height: size?.height ?? null,
      });
      if (!finalized.ok)
        return setStatus({ kind: "error", message: finalized.error.message });

      choose(null);
      setStatus({
        kind: "done",
        message: "Arquivo enviado e adicionado à biblioteca.",
      });
      setAltText("");
      onUploaded?.(finalized.data);
    } catch {
      // Falha de rede ou da action: nunca deixar a tela presa em "Conferindo…".
      setStatus({
        kind: "error",
        message: "Não foi possível concluir o envio. Tente de novo.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={fileId} className="text-caption font-medium">
          Arquivo
        </label>
        <input
          id={fileId}
          type="file"
          accept={accept}
          className="text-caption file:mr-3 file:min-h-10 file:rounded-control file:border file:border-border file:bg-background file:px-3"
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
        />
        <p className="text-caption text-muted">
          JPG, PNG, WEBP ou AVIF até 10 MB{allowVideo ? "; MP4 até 50 MB" : ""}.
        </p>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- prévia local (object URL), não passa pelo otimizador
        <img
          src={preview}
          alt="Prévia do arquivo escolhido"
          className="max-h-48 w-fit rounded-media border border-border object-contain"
        />
      ) : null}
      <TextField
        label="Texto alternativo"
        required
        maxLength={300}
        value={altText}
        onChange={(event) => setAltText(event.target.value)}
        hint="Descreva o que aparece na imagem. Ex.: iPhone 17 Pro Max preto, de frente."
      />
      {status.message && status.kind !== "idle" ? (
        status.kind === "working" ? (
          <p role="status" className="text-caption text-muted">
            {status.message}
          </p>
        ) : (
          <FormMessage kind={status.kind === "error" ? "error" : "success"}>
            {status.message}
          </FormMessage>
        )
      ) : null}
      <Button
        variant="primary"
        className="w-fit"
        pending={status.kind === "working"}
        onClick={upload}
      >
        Enviar arquivo
      </Button>
    </div>
  );
}
