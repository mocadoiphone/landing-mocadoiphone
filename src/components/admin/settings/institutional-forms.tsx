"use client";

import { type FormEvent, useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import {
  SOCIAL_NETWORK_LABELS,
  SOCIAL_NETWORKS,
  type SocialNetwork,
} from "@/lib/site/links";
import {
  type FooterSettings,
  SOCIAL_LINKS_MAX,
  STORE_HOURS_MAX,
  STORE_PHOTOS_MAX,
  type StoreSettings,
} from "@/lib/site/settings";
import {
  updateFooterSettingsAction,
  updateStoreSettingsAction,
} from "@/services/admin/actions";

import { ActionMessage } from "../forms/action-message";
import { errorsFor, useActionRunner } from "../forms/use-action-form";
import { MediaPicker } from "../media/media-picker";
import { type PanelMedia, toMediaView } from "../media/media-helpers";
import { Button } from "../ui/button";
import { SelectField, TextAreaField, TextField } from "../ui/fields";
import { ReorderButtons, moveItem } from "../ui/reorder-buttons";

/**
 * Loja física (Brain §7.7; MDI-D031): endereço, horários, texto, fotos, link do
 * mapa e texto do botão. Aparece no bloco STORE da Home, em /loja e no rodapé.
 */
export function StoreSettingsForm({
  store,
  library,
}: {
  store: StoreSettings;
  library: PanelMedia[];
}) {
  const [values, setValues] = useState({
    name: store.name ?? "",
    description: store.description ?? "",
    addressLine: store.addressLine ?? "",
    district: store.district ?? "",
    city: store.city ?? "",
    postalCode: store.postalCode ?? "",
    mapUrl: store.mapUrl ?? "",
    ctaLabel: store.ctaLabel ?? "",
  });
  const [hours, setHours] = useState(store.hours);
  const [photoIds, setPhotoIds] = useState(store.photoIds);
  const [picking, setPicking] = useState(false);
  const { pending, result, run } = useActionRunner();
  const errors = (name: string) => errorsFor(result, name);

  const field = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
    errors: errors(key),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(updateStoreSettingsAction, { ...values, hours, photoIds });
  };

  const photos = photoIds.flatMap((id) => {
    const media = library.find((item) => item.id === id);
    return media ? [media] : [];
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Nome da loja"
        maxLength={80}
        {...field("name")}
        hint="Ex.: Loja Centro. Vazio = Loja física."
      />
      <TextAreaField
        label="Texto de apresentação"
        maxLength={600}
        rows={3}
        {...field("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Endereço"
          maxLength={160}
          {...field("addressLine")}
          hint="Rua, número e complemento."
        />
        <TextField label="Bairro" maxLength={80} {...field("district")} />
        <TextField
          label="Cidade e estado"
          maxLength={80}
          {...field("city")}
          hint="Ex.: São Paulo — SP"
        />
        <TextField
          label="CEP"
          maxLength={9}
          inputMode="numeric"
          {...field("postalCode")}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-card border border-border p-4">
        <legend className="px-1 text-caption font-medium">
          Horários ({hours.length}/{STORE_HOURS_MAX})
        </legend>
        {hours.map((row, index) => (
          <div
            key={index}
            className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <TextField
              label={`Dias ${index + 1}`}
              maxLength={40}
              value={row.label}
              onChange={(event) =>
                setHours(
                  hours.map((item, i) =>
                    i === index ? { ...item, label: event.target.value } : item,
                  ),
                )
              }
            />
            <TextField
              label={`Horário ${index + 1}`}
              maxLength={60}
              value={row.value}
              onChange={(event) =>
                setHours(
                  hours.map((item, i) =>
                    i === index ? { ...item, value: event.target.value } : item,
                  ),
                )
              }
            />
            <Button
              variant="ghost"
              onClick={() => setHours(hours.filter((_, i) => i !== index))}
            >
              Remover
            </Button>
          </div>
        ))}
        {hours.length < STORE_HOURS_MAX ? (
          <Button
            className="w-fit"
            onClick={() => setHours([...hours, { label: "", value: "" }])}
          >
            Adicionar horário
          </Button>
        ) : null}
        {errors("hours") ? (
          <p className="text-caption text-danger">
            {errors("hours")?.join(" ")}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-card border border-border p-4">
        <legend className="px-1 text-caption font-medium">
          Fotos ({photoIds.length}/{STORE_PHOTOS_MAX})
        </legend>
        {photos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {photos.map((photo, index) => (
              <li key={photo.id} className="flex flex-wrap items-center gap-3">
                <MediaImage
                  media={toMediaView(photo)}
                  className="h-16 w-24 rounded-control border border-border object-cover"
                />
                <span className="min-w-0 flex-1 text-caption">
                  {photo.altText}
                </span>
                <ReorderButtons
                  ids={photoIds}
                  index={index}
                  label={photo.altText}
                  onReorder={(ordered) => setPhotoIds(ordered)}
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setPhotoIds(photoIds.filter((id) => id !== photo.id))
                  }
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-caption text-muted">
            Nenhuma foto. A primeira aparece em destaque.
          </p>
        )}
        {photoIds.length < STORE_PHOTOS_MAX ? (
          <Button className="w-fit" onClick={() => setPicking(true)}>
            Adicionar foto
          </Button>
        ) : null}
        {errors("photoIds") ? (
          <p className="text-caption text-danger">
            {errors("photoIds")?.join(" ")}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Link do mapa (Como chegar)"
          type="url"
          maxLength={500}
          {...field("mapUrl")}
          hint="Google Maps, Apple Maps ou Waze (https://…)."
        />
        <TextField
          label="Texto do botão de atendimento"
          maxLength={40}
          {...field("ctaLabel")}
          hint="Vazio = Fale com a loja. Abre o WhatsApp do contato padrão."
        />
      </div>

      <ActionMessage result={result} success="Loja física salva." />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar loja física
      </Button>

      <MediaPicker
        open={picking}
        title="Foto da loja"
        kind="IMAGE"
        library={library}
        folder="store"
        videoEnabled={false}
        onClose={() => setPicking(false)}
        onSelect={(id) => {
          setPhotoIds((current) =>
            current.includes(id) ? current : [...current, id],
          );
          setPicking(false);
        }}
      />
    </form>
  );
}

/**
 * Rodapé (Brain §7.8; MDI-D031): apresentação, redes sociais, dados legais e
 * copyright. Contato e endereço vêm do contato padrão e da loja física.
 */
export function FooterSettingsForm({ footer }: { footer: FooterSettings }) {
  const [values, setValues] = useState({
    about: footer.about ?? "",
    legalName: footer.legalName ?? "",
    legalId: footer.legalId ?? "",
    legalNotice: footer.legalNotice ?? "",
    copyright: footer.copyright ?? "",
  });
  const [links, setLinks] = useState<{ network: SocialNetwork; url: string }[]>(
    footer.socialLinks.map(({ network, url }) => ({ network, url })),
  );
  const { pending, result, run } = useActionRunner();
  const errors = (name: string) => errorsFor(result, name);
  const field = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
    errors: errors(key),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(updateFooterSettingsAction, { ...values, socialLinks: links });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <TextAreaField
        label="Apresentação"
        maxLength={300}
        rows={3}
        {...field("about")}
        hint="Frase curta sobre a loja, abaixo da marca."
      />

      <fieldset className="flex flex-col gap-3 rounded-card border border-border p-4">
        <legend className="px-1 text-caption font-medium">
          Redes sociais ({links.length}/{SOCIAL_LINKS_MAX})
        </legend>
        {links.map((link, index) => (
          <div
            key={index}
            className="grid items-end gap-3 sm:grid-cols-[12rem_1fr_auto]"
          >
            <SelectField
              label={`Rede ${index + 1}`}
              value={link.network}
              onChange={(event) =>
                setLinks(
                  links.map((item, i) =>
                    i === index
                      ? {
                          ...item,
                          network: event.target.value as SocialNetwork,
                        }
                      : item,
                  ),
                )
              }
              options={SOCIAL_NETWORKS.map((network) => ({
                value: network,
                label: SOCIAL_NETWORK_LABELS[network],
              }))}
            />
            <TextField
              label={`Link ${index + 1}`}
              type="url"
              maxLength={500}
              value={link.url}
              onChange={(event) =>
                setLinks(
                  links.map((item, i) =>
                    i === index ? { ...item, url: event.target.value } : item,
                  ),
                )
              }
            />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                aria-label={`Subir rede ${index + 1}`}
                disabled={index === 0}
                onClick={() => setLinks(moveItem(links, index, -1))}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLinks(links.filter((_, i) => i !== index))}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
        {links.length < SOCIAL_LINKS_MAX ? (
          <Button
            className="w-fit"
            onClick={() =>
              setLinks([...links, { network: "INSTAGRAM", url: "" }])
            }
          >
            Adicionar rede
          </Button>
        ) : null}
        {errors("socialLinks") ? (
          <p className="text-caption text-danger">
            {errors("socialLinks")?.join(" ")}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Razão social"
          maxLength={120}
          {...field("legalName")}
        />
        <TextField label="CNPJ" maxLength={40} {...field("legalId")} />
      </div>
      <TextAreaField
        label="Aviso legal"
        maxLength={400}
        rows={2}
        {...field("legalNotice")}
        hint="Ex.: aviso de que Apple e iPhone são marcas da Apple Inc."
      />
      <TextField
        label="Copyright"
        maxLength={120}
        {...field("copyright")}
        hint="Vazio = © <ano> Moça do iPhone. Todos os direitos reservados."
      />

      <ActionMessage result={result} success="Rodapé salvo." />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar rodapé
      </Button>
    </form>
  );
}
