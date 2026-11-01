"use client";

import { useCallback, useEffect, useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import { formatPhone } from "@/lib/contacts/phone";
import {
  createContactAction,
  deleteContactAction,
  reorderContactsAction,
  restoreContactAction,
  setDefaultContactAction,
  updateContactAction,
} from "@/services/admin/actions";
import type { AdminContact } from "@/services/admin/queries";

import { ActionMessage } from "../forms/action-message";
import { useActionForm, useActionRunner } from "../forms/use-action-form";
import { MediaPicker } from "../media/media-picker";
import { type PanelMedia, toMediaView } from "../media/media-helpers";
import { Button } from "../ui/button";
import { ConfirmDialog, Dialog } from "../ui/dialog";
import { Badge, EmptyState } from "../ui/feedback";
import { CheckboxField, TextField } from "../ui/fields";
import { ReorderButtons } from "../ui/reorder-buttons";

function ContactForm({
  contact,
  library,
  onDone,
}: {
  contact: AdminContact | null;
  library: PanelMedia[];
  onDone: () => void;
}) {
  const [avatarId, setAvatarId] = useState(contact?.avatar?.id ?? "");
  const [picking, setPicking] = useState(false);
  const avatar =
    library.find((item) => item.id === avatarId) ??
    (contact?.avatar?.id === avatarId ? contact.avatar : null);
  const { state, formAction, pending, errors } = useActionForm(
    contact ? updateContactAction : createContactAction,
    {
      name: "text",
      whatsapp: "text",
      phone: "text",
      role: "text",
      isActive: "boolean",
      avatarAssetId: "text",
    },
    contact ? { id: contact.id } : {},
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
        defaultValue={contact?.name ?? ""}
        errors={errors("name")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="WhatsApp"
          name="whatsapp"
          required
          inputMode="tel"
          defaultValue={contact ? formatPhone(contact.whatsapp) : ""}
          hint="Com DDD. Ex.: (11) 99999-9999. Fora do Brasil, comece com +."
          errors={errors("whatsapp")}
        />
        <TextField
          label="Telefone"
          name="phone"
          inputMode="tel"
          defaultValue={contact?.phone ? formatPhone(contact.phone) : ""}
          hint="Opcional."
          errors={errors("phone")}
        />
      </div>
      <TextField
        label="Função"
        name="role"
        maxLength={80}
        defaultValue={contact?.role ?? ""}
        hint="Ex.: Vendas, Encomendas."
        errors={errors("role")}
      />
      <CheckboxField
        label="Ativo"
        name="isActive"
        defaultChecked={contact?.isActive ?? true}
        errors={errors("isActive")}
      />
      <input type="hidden" name="avatarAssetId" value={avatarId} />
      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium">Foto (opcional)</span>
        {avatar ? (
          <MediaImage
            media={toMediaView(avatar)}
            className="size-20 rounded-full border border-border object-cover"
          />
        ) : null}
        <div className="flex gap-2">
          <Button onClick={() => setPicking(true)}>
            {avatar ? "Trocar foto" : "Escolher foto"}
          </Button>
          {avatarId ? (
            <Button variant="ghost" onClick={() => setAvatarId("")}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" pending={pending}>
          {contact ? "Salvar contato" : "Criar contato"}
        </Button>
      </div>
      <MediaPicker
        open={picking}
        title="Foto do contato"
        kind="IMAGE"
        library={library}
        folder="store"
        videoEnabled={false}
        onClose={() => setPicking(false)}
        onSelect={(id) => {
          setAvatarId(id);
          setPicking(false);
        }}
      />
    </form>
  );
}

/** Contatos (Brain §14; MDI-D012): o padrão recebe todos os cliques de WhatsApp do site. */
export function ContactsManager({
  contacts,
  library,
}: {
  contacts: AdminContact[];
  library: PanelMedia[];
}) {
  const { pending, result, run } = useActionRunner();
  const [editing, setEditing] = useState<AdminContact | "new" | null>(null);
  const [removing, setRemoving] = useState<AdminContact | null>(null);
  const close = useCallback(() => setEditing(null), []);
  const active = contacts.filter((contact) => !contact.isDeleted);
  const deleted = contacts.filter((contact) => contact.isDeleted);
  const ids = active.map((contact) => contact.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-muted">
          Todos os botões de WhatsApp do site usam o contato{" "}
          <strong>padrão</strong>.
        </p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          Novo contato
        </Button>
      </div>
      <ActionMessage result={result} />

      {active.length === 0 ? (
        <EmptyState title="Nenhum contato cadastrado.">
          Sem contato padrão, o site não mostra botão de WhatsApp.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-card border border-border">
          {active.map((contact, index) => (
            <li
              key={contact.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 text-body font-medium">
                  {contact.name}
                  {contact.isDefault ? (
                    <Badge tone="success">Padrão</Badge>
                  ) : null}
                  {!contact.isActive ? <Badge>Inativo</Badge> : null}
                </p>
                <p className="text-caption text-muted">
                  WhatsApp {formatPhone(contact.whatsapp)}
                  {contact.role ? ` · ${contact.role}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <ReorderButtons
                  ids={ids}
                  index={index}
                  label={contact.name}
                  pending={pending}
                  onReorder={(orderedIds) =>
                    run(reorderContactsAction, { orderedIds })
                  }
                />
                {!contact.isDefault && contact.isActive ? (
                  <Button
                    className="min-h-9"
                    pending={pending}
                    onClick={() =>
                      run(setDefaultContactAction, { id: contact.id })
                    }
                  >
                    Definir padrão
                  </Button>
                ) : null}
                <Button className="min-h-9" onClick={() => setEditing(contact)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-9"
                  onClick={() => setRemoving(contact)}
                >
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleted.length > 0 ? (
        <details className="rounded-card border border-border p-3">
          <summary className="cursor-pointer text-caption font-medium">
            Contatos excluídos ({deleted.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {deleted.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between gap-2 text-caption"
              >
                {contact.name}
                <Button
                  className="min-h-9"
                  pending={pending}
                  onClick={() => run(restoreContactAction, { id: contact.id })}
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
        title={editing === "new" ? "Novo contato" : "Editar contato"}
      >
        {editing !== null ? (
          <ContactForm
            key={editing === "new" ? "novo" : editing.id}
            contact={editing === "new" ? null : editing}
            library={library}
            onDone={close}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title="Excluir contato?"
        message={
          removing?.isDefault
            ? "Este é o contato padrão. Defina outro como padrão antes de excluir."
            : "O contato sai da lista. Dá para restaurar depois."
        }
        confirmLabel="Excluir"
        danger
        pending={pending}
        onConfirm={() => {
          if (removing) run(deleteContactAction, { id: removing.id });
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
