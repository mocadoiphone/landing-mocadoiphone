"use client";

import { useState } from "react";

import {
  buildWhatsAppMessage,
  DEFAULT_WHATSAPP_TEMPLATE,
} from "@/lib/whatsapp/whatsapp";
import {
  updateMediaSettingsAction,
  updateWhatsappSettingsAction,
} from "@/services/admin/actions";

import { ActionMessage } from "../forms/action-message";
import { useActionForm } from "../forms/use-action-form";
import { Button } from "../ui/button";
import { CheckboxField, TextAreaField, TextField } from "../ui/fields";

/** Mensagem do WhatsApp (Brain §13) com pré-visualização usando a mesma regra do site. */
export function WhatsappSettingsForm({
  template,
  leadOrigin,
}: {
  template: string | null;
  leadOrigin: string | null;
}) {
  const [message, setMessage] = useState(template ?? DEFAULT_WHATSAPP_TEMPLATE);
  const [origin, setOrigin] = useState(leadOrigin ?? "");
  const { state, formAction, pending, errors } = useActionForm(
    updateWhatsappSettingsAction,
    {
      messageTemplate: "text",
      leadOrigin: "text",
    },
  );
  const preview = buildWhatsAppMessage(message, {
    productName: "iPhone 17 Pro Max",
    variantLabel: "256 GB Preto",
    origin: origin || null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextAreaField
        label="Mensagem padrão"
        name="messageTemplate"
        required
        maxLength={500}
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        hint="Marcadores: {produto}, {variante} e {origem}. {produto} é obrigatório."
        errors={errors("messageTemplate")}
      />
      <TextField
        label="Origem do lead"
        name="leadOrigin"
        maxLength={60}
        value={origin}
        onChange={(event) => setOrigin(event.target.value)}
        hint="Ex.: Site. Entra na mensagem onde houver {origem}."
        errors={errors("leadOrigin")}
      />
      <div
        className="flex flex-col gap-1 rounded-card bg-surface p-4"
        aria-live="polite"
      >
        <p className="text-caption text-muted">
          Pré-visualização (exemplo: iPhone 17 Pro Max, 256 GB Preto)
        </p>
        <p className="text-body">{preview}</p>
      </div>
      <ActionMessage result={state} success="Mensagem do WhatsApp salva." />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar mensagem
      </Button>
    </form>
  );
}

/** Mídia (Brain §20: "MP4 quando habilitado"). */
export function MediaSettingsForm({
  videoUploadEnabled,
}: {
  videoUploadEnabled: boolean;
}) {
  const { state, formAction, pending } = useActionForm(
    updateMediaSettingsAction,
    {
      videoUploadEnabled: "boolean",
    },
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <CheckboxField
        label="Permitir envio de vídeo MP4"
        name="videoUploadEnabled"
        defaultChecked={videoUploadEnabled}
        hint="Vídeos pesam mais: use só quando necessário (até 50 MB)."
      />
      <ActionMessage result={state} success="Configuração de mídia salva." />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar mídia
      </Button>
    </form>
  );
}
