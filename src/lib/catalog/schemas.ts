import { z } from "zod";

import {
  isAllowedMimeType,
  isValidStoragePath,
  MEDIA_MAX_BYTES,
  PRODUCT_MEDIA_SLOTS,
} from "@/lib/media/media";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/slug/slug";

/**
 * Validação dos dados enviados ao catálogo (agente de segurança: "validar no
 * servidor"). Os limites espelham as constraints do banco para dar mensagem por
 * campo; o banco continua sendo a garantia (MDI-D024).
 *
 * Convenção de campos opcionais em edição: ausente = não altera; "" ou null = limpa.
 */

const MAX_CENTS = 2_147_483_647;

export const id = (label = "Identificador") => z.uuid(`${label} inválido.`);

export const requiredText = (max: number, label: string) =>
  z
    .string(`Informe ${label}.`)
    .trim()
    .min(1, `Informe ${label}.`)
    .max(max, `Use no máximo ${max} caracteres.`);

export const blankToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const optionalText = (max: number) =>
  z
    .preprocess(
      blankToNull,
      z.string().trim().max(max, `Use no máximo ${max} caracteres.`).nullable(),
    )
    .optional();

const optionalSlug = (max: number) =>
  z
    .preprocess(
      (value) => (blankToNull(value) === null ? undefined : value),
      z
        .string()
        .trim()
        .max(max, `Use no máximo ${max} caracteres.`)
        .regex(
          SLUG_PATTERN,
          "Use só letras minúsculas, números e hífens no endereço.",
        )
        .optional(),
    )
    .optional();

export const optionalId = (label?: string) =>
  z.preprocess(blankToNull, id(label).nullable()).optional();

const optionalCents = z
  .number("Informe um valor numérico em centavos.")
  .int("Valor em centavos deve ser inteiro.")
  .min(0, "O valor não pode ser negativo.")
  .max(MAX_CENTS, "Valor acima do permitido.")
  .nullable()
  .optional();

export const orderedIds = z
  .array(id(), "Informe a nova ordem.")
  .min(1, "Informe a nova ordem.")
  .max(500, "Lista grande demais.");

// -----------------------------------------------------------------------------
// Comuns
// -----------------------------------------------------------------------------
export const idInput = z.object({ id: id() });

// -----------------------------------------------------------------------------
// Categorias e famílias
// -----------------------------------------------------------------------------
export const categoryCreateInput = z.object({
  name: requiredText(80, "o nome"),
  slug: optionalSlug(SLUG_MAX_LENGTH.category),
  description: optionalText(500),
  imageAssetId: optionalId("Imagem"),
  isActive: z.boolean().optional(),
});

export const categoryUpdateInput = categoryCreateInput
  .partial()
  .extend({ id: id(), name: requiredText(80, "o nome").optional() });

export const familyCreateInput = z.object({
  categoryId: id("Categoria"),
  name: requiredText(120, "o nome"),
  slug: optionalSlug(SLUG_MAX_LENGTH.family),
});

export const familyUpdateInput = z.object({
  id: id(),
  name: requiredText(120, "o nome").optional(),
  slug: optionalSlug(SLUG_MAX_LENGTH.family),
});

// -----------------------------------------------------------------------------
// Produtos (o status muda só por publicar/revisar/despublicar)
// -----------------------------------------------------------------------------
const productFields = {
  name: requiredText(160, "o nome"),
  slug: optionalSlug(SLUG_MAX_LENGTH.product),
  shortDescription: optionalText(300),
  description: optionalText(10_000),
  badge: optionalText(40),
  isFeatured: z.boolean().optional(),
  isLaunch: z.boolean().optional(),
  isPromotion: z.boolean().optional(),
  relatedProductId: optionalId("Produto relacionado"),
  metaTitle: optionalText(120),
  metaDescription: optionalText(320),
  ogImageAssetId: optionalId("Imagem de compartilhamento"),
  canonicalUrl: z
    .preprocess(
      blankToNull,
      z
        .url({
          protocol: /^https$/,
          error: "Use um endereço completo começando com https://.",
        })
        .nullable(),
    )
    .optional(),
};

export const productCreateInput = z.object({
  categoryId: id("Categoria"),
  familyId: id("Família"),
  ...productFields,
});

export const productUpdateInput = z
  .object({
    id: id(),
    categoryId: id("Categoria").optional(),
    familyId: id("Família").optional(),
    ...productFields,
    name: productFields.name.optional(),
  })
  .refine(
    (input) =>
      (input.categoryId === undefined) === (input.familyId === undefined),
    {
      message:
        "Para mudar a classificação, informe categoria e família juntas.",
      path: ["familyId"],
    },
  );

// -----------------------------------------------------------------------------
// Variantes (preços em centavos)
// -----------------------------------------------------------------------------
const variantFields = {
  sku: z
    .preprocess(
      blankToNull,
      z
        .string()
        .trim()
        .regex(
          /^[A-Za-z0-9._-]{1,64}$/,
          "SKU aceita letras, números, ponto, hífen e sublinhado (até 64).",
        )
        .nullable(),
    )
    .optional(),
  storage: optionalText(40),
  colorName: optionalText(60),
  colorHex: z
    .preprocess(
      blankToNull,
      z
        .string()
        .trim()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Use a cor no formato #RRGGBB.")
        .nullable(),
    )
    .optional(),
  priceCash: optionalCents,
  priceOld: optionalCents,
  priceInstallment: z
    .number("Informe um valor numérico em centavos.")
    .int("Valor em centavos deve ser inteiro.")
    .positive("A parcela deve ser maior que zero.")
    .max(MAX_CENTS, "Valor acima do permitido.")
    .nullable()
    .optional(),
  installments: z
    .number("Informe o número de parcelas.")
    .int("Número de parcelas deve ser inteiro.")
    .min(1, "Mínimo de 1 parcela.")
    .max(36, "Máximo de 36 parcelas.")
    .nullable()
    .optional(),
  installmentText: optionalText(120),
  priceOnRequest: z.boolean().optional(),
  availability: z
    .enum(
      [
        "AVAILABLE",
        "PRE_ORDER",
        "ON_REQUEST",
        "OUT_OF_STOCK",
        "DISCONTINUED",
        "HIDDEN",
      ],
      "Disponibilidade inválida.",
    )
    .optional(),
};

type VariantPriceInput = {
  priceCash?: number | null;
  priceOld?: number | null;
  priceInstallment?: number | null;
  installments?: number | null;
};

// Regras entre campos, verificadas quando os dois valores vêm no mesmo envio.
function refineVariantPrices(input: VariantPriceInput, ctx: z.RefinementCtx) {
  if (
    typeof input.priceOld === "number" &&
    typeof input.priceCash === "number" &&
    input.priceOld <= input.priceCash
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["priceOld"],
      message: 'O preço "de" deve ser maior que o preço à vista.',
    });
  }
  if (
    input.priceInstallment !== undefined &&
    input.installments !== undefined &&
    (input.priceInstallment === null) !== (input.installments === null)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["installments"],
      message: "Informe o número de parcelas e o valor da parcela juntos.",
    });
  }
}

export const variantCreateInput = z
  .object({ productId: id("Produto"), ...variantFields })
  .superRefine(refineVariantPrices);

export const variantUpdateInput = z
  .object({ id: id(), ...variantFields })
  .superRefine(refineVariantPrices);

// -----------------------------------------------------------------------------
// Especificações
// -----------------------------------------------------------------------------
export const specCreateInput = z.object({
  productId: id("Produto"),
  groupName: optionalText(80),
  label: requiredText(120, "o nome da especificação"),
  value: requiredText(500, "o valor"),
});

export const specUpdateInput = z.object({
  id: id(),
  groupName: optionalText(80),
  label: requiredText(120, "o nome da especificação").optional(),
  value: requiredText(500, "o valor").optional(),
});

// -----------------------------------------------------------------------------
// Mídia (metadados; o envio do arquivo entra na Etapa 04)
// -----------------------------------------------------------------------------
const slot = z.enum(PRODUCT_MEDIA_SLOTS, "Posição de mídia inválida.");

export const productMediaLinkInput = z.object({
  productId: id("Produto"),
  mediaAssetId: id("Mídia"),
  slot,
  variantId: optionalId("Variante"),
  altText: optionalText(300),
});

export const productMediaUpdateInput = z.object({
  id: id(),
  /** Troca o arquivo mantendo a posição (ex.: nova imagem principal). */
  mediaAssetId: id("Mídia").optional(),
  altText: optionalText(300),
});

export const mediaAssetRegisterInput = z
  .object({
    storagePath: z
      .string("Informe o caminho do arquivo.")
      .trim()
      .refine(isValidStoragePath, "Caminho de arquivo inválido."),
    kind: z.enum(["IMAGE", "VIDEO"], "Tipo de mídia inválido."),
    mimeType: z.string("Informe o formato do arquivo.").trim(),
    sizeBytes: z
      .number("Informe o tamanho do arquivo.")
      .int()
      .positive("Arquivo vazio."),
    width: z.number().int().positive().nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
    altText: requiredText(300, "o texto alternativo"),
  })
  .superRefine((input, ctx) => {
    if (!isAllowedMimeType(input.kind, input.mimeType)) {
      ctx.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "Formato de arquivo não aceito para este tipo de mídia.",
      });
    }
    if (input.sizeBytes > MEDIA_MAX_BYTES[input.kind]) {
      ctx.addIssue({
        code: "custom",
        path: ["sizeBytes"],
        message: "Arquivo acima do tamanho permitido.",
      });
    }
    if (input.kind === "IMAGE" && (!input.width || !input.height)) {
      ctx.addIssue({
        code: "custom",
        path: ["width"],
        message: "Informe largura e altura da imagem.",
      });
    }
  });

export const mediaAltUpdateInput = z.object({
  id: id(),
  altText: requiredText(300, "o texto alternativo"),
});

// -----------------------------------------------------------------------------
// Ordenação (lista completa do escopo, na nova ordem)
// -----------------------------------------------------------------------------
export const reorderCategoriesInput = z.object({ orderedIds });
export const reorderFamiliesInput = z.object({
  categoryId: id("Categoria"),
  orderedIds,
});
export const reorderProductsInput = z.object({
  categoryId: id("Categoria"),
  orderedIds,
});
export const reorderVariantsInput = z.object({
  productId: id("Produto"),
  orderedIds,
});
export const reorderSpecsInput = z.object({
  productId: id("Produto"),
  orderedIds,
});
export const reorderProductMediaInput = z.object({
  productId: id("Produto"),
  slot,
  /** Galeria de uma variante específica; ausente/null = mídia do produto. */
  variantId: optionalId("Variante"),
  orderedIds,
});

export const productStatusInput = z.object({
  id: id(),
  status: z.enum(["DRAFT", "REVIEWED", "PUBLISHED"], "Status inválido."),
});

export type IdInput = z.output<typeof idInput>;
export type CategoryCreateInput = z.output<typeof categoryCreateInput>;
export type CategoryUpdateInput = z.output<typeof categoryUpdateInput>;
export type FamilyCreateInput = z.output<typeof familyCreateInput>;
export type FamilyUpdateInput = z.output<typeof familyUpdateInput>;
export type ProductCreateInput = z.output<typeof productCreateInput>;
export type ProductUpdateInput = z.output<typeof productUpdateInput>;
export type VariantCreateInput = z.output<typeof variantCreateInput>;
export type VariantUpdateInput = z.output<typeof variantUpdateInput>;
export type SpecCreateInput = z.output<typeof specCreateInput>;
export type SpecUpdateInput = z.output<typeof specUpdateInput>;
export type ProductMediaLinkInput = z.output<typeof productMediaLinkInput>;
export type ProductMediaUpdateInput = z.output<typeof productMediaUpdateInput>;
export type MediaAssetRegisterInput = z.output<typeof mediaAssetRegisterInput>;
export type MediaAltUpdateInput = z.output<typeof mediaAltUpdateInput>;
export type ReorderCategoriesInput = z.output<typeof reorderCategoriesInput>;
export type ReorderFamiliesInput = z.output<typeof reorderFamiliesInput>;
export type ReorderProductsInput = z.output<typeof reorderProductsInput>;
export type ReorderVariantsInput = z.output<typeof reorderVariantsInput>;
export type ReorderSpecsInput = z.output<typeof reorderSpecsInput>;
export type ReorderProductMediaInput = z.output<
  typeof reorderProductMediaInput
>;
export type ProductStatusInput = z.output<typeof productStatusInput>;
