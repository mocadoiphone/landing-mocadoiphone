import { z } from "zod";

import { id, optionalId, optionalText } from "@/lib/catalog/schemas";
import { type Database, type Json } from "@/types/database";

/**
 * Blocos da Home (Brain §7, §18, §19; MDI-D009, MDI-D030).
 *
 * O administrador escolhe o tipo, os conteúdos (produto, categoria, mídia) e os
 * textos permitidos; o layout é do sistema. Colunas próprias guardam o que é
 * comum (título, subtítulo, texto, vínculos, tema); `settings_json` guarda o que
 * é específico do tipo e é validado aqui, na escrita e na leitura.
 */

export type BlockType = Database["public"]["Enums"]["content_block_type"];
export type SectionTheme = Database["public"]["Enums"]["section_theme"];

export const BLOCK_TYPES = [
  "HERO_PRODUCT",
  "PRODUCT_STORY",
  "PRODUCT_GRID",
  "CATEGORY_GRID",
  "FULLSCREEN_MEDIA",
  "TEXT_AND_MEDIA",
  "FEATURES",
  "PROMO_BANNER",
  "STORE",
  "REVIEWS",
  "CTA",
] as const satisfies readonly BlockType[];

export const SECTION_THEMES = [
  "LIGHT",
  "DARK",
] as const satisfies readonly SectionTheme[];

export const SECTION_THEME_LABELS: Record<SectionTheme, string> = {
  LIGHT: "Claro",
  DARK: "Escuro",
};

/** Destinos de botão: o admin escolhe para onde vai, nunca digita um endereço. */
export const CTA_TARGETS = [
  "PRODUCT",
  "CATEGORY",
  "WHATSAPP",
  "STORE",
  "OFFERS",
  "LAUNCHES",
] as const;
export type CtaTarget = (typeof CTA_TARGETS)[number];

export const CTA_TARGET_LABELS: Record<CtaTarget, string> = {
  PRODUCT: "Página do produto vinculado",
  CATEGORY: "Página da categoria vinculada",
  WHATSAPP: "WhatsApp",
  STORE: "Loja física",
  OFFERS: "Ofertas",
  LAUNCHES: "Lançamentos",
};

export const BLOCK_LAYOUTS = ["MEDIA_START", "MEDIA_END"] as const;
export type BlockLayout = (typeof BLOCK_LAYOUTS)[number];

export const BLOCK_LAYOUT_LABELS: Record<BlockLayout, string> = {
  MEDIA_START: "Imagem à esquerda",
  MEDIA_END: "Imagem à direita",
};

/** Origem dos produtos de uma grade (Brain §7.3: lançamentos via `is_launch`). */
export const GRID_SOURCES = [
  "LAUNCH",
  "PROMOTION",
  "FEATURED",
  "CATEGORY",
] as const;
export type GridSource = (typeof GRID_SOURCES)[number];

export const GRID_SOURCE_LABELS: Record<GridSource, string> = {
  LAUNCH: "Lançamentos",
  PROMOTION: "Promoções",
  FEATURED: "Destaques",
  CATEGORY: "Produtos da categoria vinculada",
};

export const GRID_LIMIT = { min: 3, max: 12, default: 8 } as const;
export const BLOCK_ITEMS_MAX = 6;

/** Campos que o formulário mostra para cada tipo. */
export type BlockField =
  | "eyebrow"
  | "title"
  | "subtitle"
  | "content"
  | "product"
  | "category"
  | "media"
  | "video"
  | "layout"
  | "source"
  | "limit"
  | "primaryCta"
  | "secondaryCta"
  | "items";

/** Rótulos dos itens repetidos (benefícios, depoimentos, destaques). */
export type ItemLabels = {
  noun: string;
  title: string;
  text: string;
  detail?: string;
  /** Qual parte do item é obrigatória. */
  requires: "title" | "text";
};

export type BlockDefinition = {
  label: string;
  description: string;
  fields: readonly BlockField[];
  required: readonly BlockField[];
  items?: ItemLabels;
};

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  HERO_PRODUCT: {
    label: "Hero",
    description:
      "Abertura da Home: título grande, imagem ou produto em destaque e até dois botões.",
    fields: [
      "eyebrow",
      "title",
      "subtitle",
      "product",
      "media",
      "video",
      "primaryCta",
      "secondaryCta",
    ],
    required: ["title"],
  },
  PRODUCT_STORY: {
    label: "Produto em destaque",
    description:
      "Um produto contado em uma seção ampla: imagem grande, texto e destaques curtos.",
    fields: [
      "eyebrow",
      "title",
      "subtitle",
      "content",
      "product",
      "media",
      "layout",
      "items",
      "primaryCta",
    ],
    required: ["product"],
    items: {
      noun: "destaque",
      title: "Destaque (ex.: Chip A19 Pro)",
      text: "Complemento (opcional)",
      requires: "title",
    },
  },
  PRODUCT_GRID: {
    label: "Grade de produtos",
    description:
      "Produtos do catálogo: lançamentos, promoções, destaques ou de uma categoria.",
    fields: [
      "eyebrow",
      "title",
      "subtitle",
      "source",
      "category",
      "limit",
      "primaryCta",
    ],
    required: ["source"],
  },
  CATEGORY_GRID: {
    label: "Linhas Apple",
    description:
      "As categorias ativas do catálogo, com imagem, na ordem do painel.",
    fields: ["eyebrow", "title", "subtitle"],
    required: [],
  },
  FULLSCREEN_MEDIA: {
    label: "Mídia em tela cheia",
    description:
      "Imagem ou vídeo ocupando a largura da tela, com título opcional.",
    fields: [
      "eyebrow",
      "title",
      "subtitle",
      "media",
      "video",
      "product",
      "primaryCta",
    ],
    required: ["media"],
  },
  TEXT_AND_MEDIA: {
    label: "Texto e imagem",
    description:
      "Texto ao lado de uma imagem, para contar algo da loja ou de um produto.",
    fields: ["eyebrow", "title", "content", "media", "layout", "primaryCta"],
    required: ["title", "media"],
  },
  FEATURES: {
    label: "Benefícios",
    description:
      "Benefícios comerciais (Brain §7.5): retirada em loja, parcelamento, atendimento…",
    fields: ["eyebrow", "title", "subtitle", "items"],
    required: ["items"],
    items: {
      noun: "benefício",
      title: "Benefício",
      text: "Descrição curta",
      requires: "title",
    },
  },
  PROMO_BANNER: {
    label: "Banner promocional",
    description: "Faixa de campanha com título, imagem opcional e botão.",
    fields: [
      "eyebrow",
      "title",
      "subtitle",
      "media",
      "product",
      "category",
      "primaryCta",
    ],
    required: ["title"],
  },
  STORE: {
    label: "Loja física",
    description:
      "Endereço, horários, fotos e mapa da loja. O conteúdo vem de Configurações › Loja física.",
    fields: ["eyebrow", "title", "subtitle"],
    required: [],
  },
  REVIEWS: {
    label: "Depoimentos",
    description: "Depoimentos reais de clientes, com autorização de uso.",
    fields: ["eyebrow", "title", "items"],
    required: ["items"],
    items: {
      noun: "depoimento",
      title: "Nome do cliente",
      text: "Depoimento",
      detail: "Contexto (opcional, ex.: comprou um iPhone 17)",
      requires: "text",
    },
  },
  CTA: {
    label: "Chamada para ação",
    description: "Fechamento de seção com título e até dois botões.",
    fields: ["eyebrow", "title", "subtitle", "primaryCta", "secondaryCta"],
    required: ["title", "primaryCta"],
  },
};

export function blockUses(type: BlockType, field: BlockField): boolean {
  return BLOCK_DEFINITIONS[type].fields.includes(field);
}

// -----------------------------------------------------------------------------
// settings_json (formato gravado no banco)
// -----------------------------------------------------------------------------
const settingText = (max: number) => z.string().trim().min(1).max(max);

const ctaSetting = z.object({
  label: settingText(40),
  target: z.enum(CTA_TARGETS),
});
export type CtaSetting = z.output<typeof ctaSetting>;

const itemSetting = z.object({
  title: z.string().trim().max(80).nullable().optional(),
  text: z.string().trim().max(400).nullable().optional(),
  detail: z.string().trim().max(80).nullable().optional(),
});
export type BlockItem = {
  title: string | null;
  text: string | null;
  detail: string | null;
};

/** Leitura tolerante: campo inválido é descartado, não derruba o bloco inteiro. */
export const blockSettingsSchema = z.object({
  eyebrow: settingText(60).nullable().optional().catch(null),
  layout: z.enum(BLOCK_LAYOUTS).optional().catch(undefined),
  source: z.enum(GRID_SOURCES).optional().catch(undefined),
  limit: z
    .number()
    .int()
    .min(GRID_LIMIT.min)
    .max(GRID_LIMIT.max)
    .optional()
    .catch(undefined),
  primaryCta: ctaSetting.nullable().optional().catch(null),
  secondaryCta: ctaSetting.nullable().optional().catch(null),
  items: z.array(itemSetting).max(BLOCK_ITEMS_MAX).optional().catch(undefined),
});

export type BlockSettings = {
  eyebrow: string | null;
  layout: BlockLayout;
  source: GridSource | null;
  limit: number;
  primaryCta: CtaSetting | null;
  secondaryCta: CtaSetting | null;
  items: BlockItem[];
};

/** `settings_json` do banco → configuração completa, só com o que o tipo usa. */
export function parseBlockSettings(
  type: BlockType,
  raw: unknown,
): BlockSettings {
  const parsed = blockSettingsSchema.safeParse(
    typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {},
  );
  const value = parsed.success ? parsed.data : {};
  const uses = (field: BlockField) => blockUses(type, field);
  return {
    eyebrow: uses("eyebrow") ? (value.eyebrow ?? null) : null,
    layout: uses("layout") ? (value.layout ?? "MEDIA_START") : "MEDIA_START",
    source: uses("source") ? (value.source ?? null) : null,
    limit: value.limit ?? GRID_LIMIT.default,
    primaryCta: uses("primaryCta") ? (value.primaryCta ?? null) : null,
    secondaryCta: uses("secondaryCta") ? (value.secondaryCta ?? null) : null,
    items: uses("items")
      ? (value.items ?? [])
          .map((item) => ({
            title: item.title?.trim() || null,
            text: item.text?.trim() || null,
            detail: item.detail?.trim() || null,
          }))
          .filter((item) => item.title || item.text)
      : [],
  };
}

// -----------------------------------------------------------------------------
// Entrada do painel (escrita)
// -----------------------------------------------------------------------------
const ctaInput = z
  .object({
    label: z.string().trim().max(40, "Use no máximo 40 caracteres no botão."),
    target: z.enum(CTA_TARGETS, "Escolha para onde o botão leva."),
  })
  .nullable()
  .optional()
  // Botão sem texto = sem botão.
  .transform((cta) => (cta && cta.label.length > 0 ? cta : null));

const itemInput = z.object({
  title: optionalText(80),
  text: optionalText(400),
  detail: optionalText(80),
});

const blockFields = {
  type: z.enum(BLOCK_TYPES, "Tipo de bloco inválido."),
  eyebrow: optionalText(60),
  title: optionalText(160),
  subtitle: optionalText(300),
  content: optionalText(2000),
  productId: optionalId("Produto"),
  categoryId: optionalId("Categoria"),
  mediaAssetId: optionalId("Imagem"),
  videoAssetId: optionalId("Vídeo"),
  theme: z.enum(SECTION_THEMES, "Tema inválido."),
  isActive: z.boolean().optional(),
  layout: z.enum(BLOCK_LAYOUTS).optional(),
  source: z.enum(GRID_SOURCES).optional(),
  limit: z
    .number("Informe um número.")
    .int("Informe um número inteiro.")
    .min(GRID_LIMIT.min, `Mostre ao menos ${GRID_LIMIT.min} produtos.`)
    .max(GRID_LIMIT.max, `Mostre no máximo ${GRID_LIMIT.max} produtos.`)
    .nullable()
    .optional(),
  primaryCta: ctaInput,
  secondaryCta: ctaInput,
  items: z
    .array(itemInput)
    .max(BLOCK_ITEMS_MAX, `Use no máximo ${BLOCK_ITEMS_MAX} itens.`)
    .optional(),
};

type BlockFieldsOutput = z.output<z.ZodObject<typeof blockFields>>;

const REQUIRED_MESSAGES: Record<BlockField, [keyof BlockFieldsOutput, string]> =
  {
    eyebrow: ["eyebrow", "Informe o texto de apoio."],
    title: ["title", "Informe o título."],
    subtitle: ["subtitle", "Informe o subtítulo."],
    content: ["content", "Informe o texto."],
    product: ["productId", "Escolha o produto."],
    category: ["categoryId", "Escolha a categoria."],
    media: ["mediaAssetId", "Escolha a imagem."],
    video: ["videoAssetId", "Escolha o vídeo."],
    layout: ["layout", "Escolha a posição da imagem."],
    source: ["source", "Escolha a origem dos produtos."],
    limit: ["limit", "Informe quantos produtos mostrar."],
    primaryCta: ["primaryCta", "Configure o botão principal."],
    secondaryCta: ["secondaryCta", "Configure o botão secundário."],
    items: ["items", "Adicione ao menos um item."],
  };

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Regras por tipo além do formato: obrigatórios, coerência de vínculos e botões. */
function refineBlock(input: BlockFieldsOutput, ctx: z.RefinementCtx) {
  const definition = BLOCK_DEFINITIONS[input.type];
  const issue = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  const items = (input.items ?? []).filter((item) => item.title || item.text);
  const values: BlockFieldsOutput = { ...input, items };

  for (const field of definition.required) {
    const [key, message] = REQUIRED_MESSAGES[field];
    // Mídia em tela cheia aceita imagem ou vídeo.
    if (
      input.type === "FULLSCREEN_MEDIA" &&
      field === "media" &&
      isFilled(input.videoAssetId)
    ) {
      continue;
    }
    if (!isFilled(values[key])) issue(key, message);
  }

  if (input.source === "CATEGORY" && !isFilled(input.categoryId)) {
    issue("categoryId", "Escolha a categoria dos produtos.");
  }

  const requires = definition.items?.requires;
  if (requires) {
    const missing = items.some((item) => !item[requires]);
    if (missing) {
      issue(
        "items",
        requires === "title"
          ? `Todo ${definition.items?.noun ?? "item"} precisa de título.`
          : `Todo ${definition.items?.noun ?? "item"} precisa do texto.`,
      );
    }
  }

  for (const key of ["primaryCta", "secondaryCta"] as const) {
    const cta = input[key];
    if (!cta) continue;
    if (cta.target === "PRODUCT" && !isFilled(input.productId)) {
      issue(key, "O botão leva ao produto: escolha o produto do bloco.");
    }
    if (
      cta.target === "CATEGORY" &&
      !isFilled(input.categoryId) &&
      !isFilled(input.productId)
    ) {
      issue(key, "O botão leva à categoria: escolha a categoria do bloco.");
    }
  }
}

export const homeBlockCreateInput = z
  .object(blockFields)
  .superRefine(refineBlock);

export const homeBlockUpdateInput = z
  .object({ ...blockFields, id: id("Bloco") })
  .superRefine(refineBlock);

export const homeBlockActiveInput = z.object({
  id: id("Bloco"),
  isActive: z.boolean(),
});

export type HomeBlockInput = z.output<typeof homeBlockCreateInput>;
export type HomeBlockUpdateInput = z.output<typeof homeBlockUpdateInput>;
export type HomeBlockActiveInput = z.output<typeof homeBlockActiveInput>;

/** Linha a gravar: só os campos que o tipo usa; o resto fica vazio. */
export function toBlockRow(input: HomeBlockInput) {
  const uses = (field: BlockField) => blockUses(input.type, field);
  const pick = <T>(field: BlockField, value: T | null | undefined) =>
    uses(field) ? (value ?? null) : null;

  const settings: Record<string, Json> = {};
  if (uses("eyebrow") && input.eyebrow) settings.eyebrow = input.eyebrow;
  if (uses("layout")) settings.layout = input.layout ?? "MEDIA_START";
  if (uses("source") && input.source) settings.source = input.source;
  if (uses("limit")) settings.limit = input.limit ?? GRID_LIMIT.default;
  if (uses("primaryCta") && input.primaryCta) {
    settings.primaryCta = input.primaryCta;
  }
  if (uses("secondaryCta") && input.secondaryCta) {
    settings.secondaryCta = input.secondaryCta;
  }
  if (uses("items")) {
    settings.items = (input.items ?? [])
      .filter((item) => item.title || item.text)
      .map((item) => ({
        title: item.title ?? null,
        text: item.text ?? null,
        detail: item.detail ?? null,
      }));
  }

  // A categoria da grade só vale quando a origem é "categoria".
  const categoryUsed =
    uses("category") &&
    (input.type !== "PRODUCT_GRID" || input.source === "CATEGORY");

  return {
    type: input.type,
    title: pick("title", input.title),
    subtitle: pick("subtitle", input.subtitle),
    content: pick("content", input.content),
    product_id: pick("product", input.productId),
    category_id: categoryUsed ? (input.categoryId ?? null) : null,
    media_asset_id: pick("media", input.mediaAssetId),
    video_asset_id: pick("video", input.videoAssetId),
    theme: input.theme,
    settings_json: settings,
  };
}
