"use client";

import { type FormEvent, useState } from "react";

import { MediaImage } from "@/components/catalog/media-image";
import {
  BLOCK_DEFINITIONS,
  BLOCK_ITEMS_MAX,
  BLOCK_LAYOUT_LABELS,
  BLOCK_LAYOUTS,
  type BlockField,
  type BlockType,
  CTA_TARGET_LABELS,
  CTA_TARGETS,
  GRID_LIMIT,
  GRID_SOURCE_LABELS,
  GRID_SOURCES,
  SECTION_THEME_LABELS,
  SECTION_THEMES,
} from "@/lib/home/blocks";
import type {
  AdminHomeBlock,
  HomeCategoryOption,
  HomeProductOption,
} from "@/services/home/admin-queries";
import {
  createHomeBlockAction,
  updateHomeBlockAction,
} from "@/services/home/actions";

import { ActionMessage } from "../forms/action-message";
import { errorsFor, useActionRunner } from "../forms/use-action-form";
import { MediaPicker } from "../media/media-picker";
import { type PanelMedia, toMediaView } from "../media/media-helpers";
import { Button } from "../ui/button";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "../ui/fields";

type Item = { title: string; text: string; detail: string };

type FormState = {
  theme: (typeof SECTION_THEMES)[number];
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  content: string;
  productId: string;
  categoryId: string;
  mediaAssetId: string;
  videoAssetId: string;
  layout: (typeof BLOCK_LAYOUTS)[number];
  source: string;
  limit: string;
  primaryLabel: string;
  primaryTarget: string;
  secondaryLabel: string;
  secondaryTarget: string;
  items: Item[];
};

function initialState(block: AdminHomeBlock | null): FormState {
  return {
    theme: block?.theme ?? "LIGHT",
    isActive: block?.isActive ?? false,
    eyebrow: block?.eyebrow ?? "",
    title: block?.title ?? "",
    subtitle: block?.subtitle ?? "",
    content: block?.content ?? "",
    productId: block?.productId ?? "",
    categoryId: block?.categoryId ?? "",
    mediaAssetId: block?.mediaAssetId ?? "",
    videoAssetId: block?.videoAssetId ?? "",
    layout: block?.layout ?? "MEDIA_START",
    source: block?.source ?? "",
    limit: String(block?.limit ?? GRID_LIMIT.default),
    primaryLabel: block?.primaryCta?.label ?? "",
    primaryTarget: block?.primaryCta?.target ?? "PRODUCT",
    secondaryLabel: block?.secondaryCta?.label ?? "",
    secondaryTarget: block?.secondaryCta?.target ?? "WHATSAPP",
    items: (block?.items ?? []).map((item) => ({
      title: item.title ?? "",
      text: item.text ?? "",
      detail: item.detail ?? "",
    })),
  };
}

/** Estado do formulário → entrada da Server Action (validada de novo no servidor). */
export function toBlockPayload(type: BlockType, state: FormState) {
  const cta = (label: string, target: string) =>
    label.trim() ? { label: label.trim(), target } : null;
  return {
    type,
    theme: state.theme,
    isActive: state.isActive,
    eyebrow: state.eyebrow,
    title: state.title,
    subtitle: state.subtitle,
    content: state.content,
    productId: state.productId,
    categoryId: state.categoryId,
    mediaAssetId: state.mediaAssetId,
    videoAssetId: state.videoAssetId,
    layout: state.layout,
    source: state.source || undefined,
    limit: state.limit.trim() === "" ? null : Number(state.limit),
    primaryCta: cta(state.primaryLabel, state.primaryTarget),
    secondaryCta: cta(state.secondaryLabel, state.secondaryTarget),
    items: state.items,
  };
}

const CTA_OPTIONS = CTA_TARGETS.map((target) => ({
  value: target,
  label: CTA_TARGET_LABELS[target],
}));

/**
 * Formulário de um bloco da Home (Brain §18, §19). Mostra só os campos do tipo
 * escolhido; o administrador seleciona produto, categoria, mídia e destino dos
 * botões, sem HTML nem endereço livre.
 */
export function HomeBlockForm({
  type,
  block,
  products,
  categories,
  library,
  videoEnabled,
  onDone,
}: {
  type: BlockType;
  block: AdminHomeBlock | null;
  products: HomeProductOption[];
  categories: HomeCategoryOption[];
  library: PanelMedia[];
  videoEnabled: boolean;
  onDone: () => void;
}) {
  const definition = BLOCK_DEFINITIONS[type];
  const uses = (field: BlockField) => definition.fields.includes(field);
  const required = (field: BlockField) => definition.required.includes(field);
  const [state, setState] = useState(() => initialState(block));
  const [picking, setPicking] = useState<"IMAGE" | "VIDEO" | null>(null);
  const { pending, result, run } = useActionRunner();
  const errors = (name: string) => errorsFor(result, name);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((current) => ({ ...current, [key]: value }));
  const setItem = (index: number, patch: Partial<Item>) =>
    set(
      "items",
      state.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );

  const findMedia = (id: string, fallback: AdminHomeBlock["media"]) =>
    library.find((item) => item.id === id) ??
    (fallback?.id === id ? fallback : null);
  const image = state.mediaAssetId
    ? findMedia(state.mediaAssetId, block?.media ?? null)
    : null;
  const video = state.videoAssetId
    ? findMedia(state.videoAssetId, block?.video ?? null)
    : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = toBlockPayload(type, state);
    if (block) {
      run(updateHomeBlockAction, { ...payload, id: block.id }, onDone);
    } else {
      run(createHomeBlockAction, payload, onDone);
    }
  };

  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.isPublished
      ? product.name
      : `${product.name} (não publicado)`,
  }));
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.isActive ? category.name : `${category.name} (inativa)`,
  }));
  const showCategory =
    uses("category") &&
    (type !== "PRODUCT_GRID" || state.source === "CATEGORY");

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <p className="text-caption text-muted">{definition.description}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Tema"
          value={state.theme}
          onChange={(event) =>
            set("theme", event.target.value as FormState["theme"])
          }
          options={SECTION_THEMES.map((theme) => ({
            value: theme,
            label: SECTION_THEME_LABELS[theme],
          }))}
          hint="Fundo claro ou escuro da seção."
        />
        <CheckboxField
          label="Ativo (aparece na Home)"
          checked={state.isActive}
          onChange={(event) => set("isActive", event.target.checked)}
          className="justify-center"
        />
      </div>

      {uses("eyebrow") ? (
        <TextField
          label="Texto de apoio"
          maxLength={60}
          value={state.eyebrow}
          onChange={(event) => set("eyebrow", event.target.value)}
          hint="Acima do título, ex.: Novo, Lançamento."
          errors={errors("eyebrow")}
        />
      ) : null}
      {uses("title") ? (
        <TextField
          label="Título"
          required={required("title")}
          maxLength={160}
          value={state.title}
          onChange={(event) => set("title", event.target.value)}
          hint={
            type === "PRODUCT_STORY" ? "Vazio = nome do produto." : undefined
          }
          errors={errors("title")}
        />
      ) : null}
      {uses("subtitle") ? (
        <TextAreaField
          label="Subtítulo"
          maxLength={300}
          rows={2}
          value={state.subtitle}
          onChange={(event) => set("subtitle", event.target.value)}
          errors={errors("subtitle")}
        />
      ) : null}
      {uses("content") ? (
        <TextAreaField
          label="Texto"
          maxLength={2000}
          rows={5}
          value={state.content}
          onChange={(event) => set("content", event.target.value)}
          hint="Texto simples. Linha em branco separa parágrafos."
          errors={errors("content")}
        />
      ) : null}

      {uses("source") ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Origem dos produtos"
            required
            value={state.source}
            placeholder="Escolha…"
            onChange={(event) => set("source", event.target.value)}
            options={GRID_SOURCES.map((source) => ({
              value: source,
              label: GRID_SOURCE_LABELS[source],
            }))}
            errors={errors("source")}
          />
          <TextField
            label="Quantidade"
            type="number"
            min={GRID_LIMIT.min}
            max={GRID_LIMIT.max}
            value={state.limit}
            onChange={(event) => set("limit", event.target.value)}
            hint={`De ${GRID_LIMIT.min} a ${GRID_LIMIT.max} produtos.`}
            errors={errors("limit")}
          />
        </div>
      ) : null}

      {uses("product") || showCategory ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {uses("product") ? (
            <SelectField
              label="Produto"
              required={required("product")}
              value={state.productId}
              placeholder="Nenhum"
              onChange={(event) => set("productId", event.target.value)}
              options={productOptions}
              hint="Produto não publicado não aparece no site."
              errors={errors("productId")}
            />
          ) : null}
          {showCategory ? (
            <SelectField
              label="Categoria"
              required={type === "PRODUCT_GRID"}
              value={state.categoryId}
              placeholder="Nenhuma"
              onChange={(event) => set("categoryId", event.target.value)}
              options={categoryOptions}
              errors={errors("categoryId")}
            />
          ) : null}
        </div>
      ) : null}

      {uses("media") || uses("video") ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {uses("media") ? (
            <div className="flex flex-col gap-2">
              <span className="text-caption font-medium">
                Imagem{required("media") ? " *" : ""}
              </span>
              {image ? (
                <MediaImage
                  media={toMediaView(image)}
                  className="h-auto w-40 rounded-media border border-border object-contain"
                />
              ) : (
                <p className="text-caption text-muted">
                  {uses("product")
                    ? "Sem imagem: usa a imagem principal do produto."
                    : "Nenhuma imagem."}
                </p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => setPicking("IMAGE")}>
                  {image ? "Trocar imagem" : "Escolher imagem"}
                </Button>
                {state.mediaAssetId ? (
                  <Button
                    variant="ghost"
                    onClick={() => set("mediaAssetId", "")}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
              {errors("mediaAssetId") ? (
                <p className="text-caption text-danger">
                  {errors("mediaAssetId")?.join(" ")}
                </p>
              ) : null}
            </div>
          ) : null}
          {uses("video") ? (
            <div className="flex flex-col gap-2">
              <span className="text-caption font-medium">Vídeo (opcional)</span>
              <p className="text-caption text-muted">
                {video
                  ? video.altText
                  : "Nenhum vídeo. Prefira imagens: vídeo pesa mais."}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setPicking("VIDEO")}>
                  {video ? "Trocar vídeo" : "Escolher vídeo"}
                </Button>
                {state.videoAssetId ? (
                  <Button
                    variant="ghost"
                    onClick={() => set("videoAssetId", "")}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {uses("layout") ? (
        <SelectField
          label="Posição da imagem"
          value={state.layout}
          onChange={(event) =>
            set("layout", event.target.value as FormState["layout"])
          }
          options={BLOCK_LAYOUTS.map((layout) => ({
            value: layout,
            label: BLOCK_LAYOUT_LABELS[layout],
          }))}
          hint="No celular, a imagem sempre vem antes do texto."
        />
      ) : null}

      {uses("items") && definition.items ? (
        <fieldset className="flex flex-col gap-3 rounded-card border border-border p-4">
          <legend className="px-1 text-caption font-medium">
            Itens ({state.items.length}/{BLOCK_ITEMS_MAX})
          </legend>
          {state.items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border-b border-border pb-3 last:border-b-0"
            >
              <TextField
                label={`${definition.items?.title} ${index + 1}`}
                maxLength={80}
                value={item.title}
                onChange={(event) =>
                  setItem(index, { title: event.target.value })
                }
              />
              <TextAreaField
                label={definition.items?.text ?? "Texto"}
                maxLength={400}
                rows={2}
                value={item.text}
                onChange={(event) =>
                  setItem(index, { text: event.target.value })
                }
              />
              {definition.items?.detail ? (
                <TextField
                  label={definition.items.detail}
                  maxLength={80}
                  value={item.detail}
                  onChange={(event) =>
                    setItem(index, { detail: event.target.value })
                  }
                />
              ) : null}
              <Button
                variant="ghost"
                className="w-fit"
                onClick={() =>
                  set(
                    "items",
                    state.items.filter((_, i) => i !== index),
                  )
                }
              >
                Remover {definition.items?.noun} {index + 1}
              </Button>
            </div>
          ))}
          {state.items.length < BLOCK_ITEMS_MAX ? (
            <Button
              className="w-fit"
              onClick={() =>
                set("items", [
                  ...state.items,
                  { title: "", text: "", detail: "" },
                ])
              }
            >
              Adicionar {definition.items.noun}
            </Button>
          ) : null}
          {errors("items") ? (
            <p className="text-caption text-danger">
              {errors("items")?.join(" ")}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {(["primaryCta", "secondaryCta"] as const)
        .filter((field) => uses(field))
        .map((field) => {
          const primary = field === "primaryCta";
          return (
            <fieldset
              key={field}
              className="grid gap-4 rounded-card border border-border p-4 sm:grid-cols-2"
            >
              <legend className="px-1 text-caption font-medium">
                {primary ? "Botão principal" : "Botão secundário"}
                {required(field) ? " *" : " (opcional)"}
              </legend>
              <TextField
                label="Texto do botão"
                maxLength={40}
                value={primary ? state.primaryLabel : state.secondaryLabel}
                onChange={(event) =>
                  set(
                    primary ? "primaryLabel" : "secondaryLabel",
                    event.target.value,
                  )
                }
                hint="Vazio = sem botão."
                errors={errors(field)}
              />
              <SelectField
                label="Leva para"
                value={primary ? state.primaryTarget : state.secondaryTarget}
                onChange={(event) =>
                  set(
                    primary ? "primaryTarget" : "secondaryTarget",
                    event.target.value,
                  )
                }
                options={CTA_OPTIONS}
              />
            </fieldset>
          );
        })}

      {result && !result.ok ? <ActionMessage result={result} /> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" pending={pending}>
          {block ? "Salvar bloco" : "Criar bloco"}
        </Button>
      </div>

      <MediaPicker
        open={picking !== null}
        title={picking === "VIDEO" ? "Vídeo do bloco" : "Imagem do bloco"}
        kind={picking ?? "IMAGE"}
        library={library}
        folder="home"
        videoEnabled={videoEnabled}
        onClose={() => setPicking(null)}
        onSelect={(id) => {
          set(picking === "VIDEO" ? "videoAssetId" : "mediaAssetId", id);
          setPicking(null);
        }}
      />
    </form>
  );
}
