import { z } from "zod";

import {
  blankToNull,
  id,
  optionalId,
  optionalText,
  orderedIds,
  requiredText,
} from "@/lib/catalog/schemas";
import { normalizePhone } from "@/lib/contacts/phone";
import { MEDIA_FOLDERS, MEDIA_MIME_TYPES } from "@/lib/media/media";

/**
 * Validação das áreas novas do painel (Etapa 04): contatos, configurações,
 * usuários e envio de mídia. Mesma convenção dos schemas do catálogo.
 */

const PHONE_ERROR =
  "Telefone inválido. Use DDD e número, ex.: (11) 99999-9999.";

const phone = z.string().transform((value, ctx) => {
  const normalized = normalizePhone(value);
  if (!normalized) {
    ctx.addIssue({ code: "custom", message: PHONE_ERROR });
    return z.NEVER;
  }
  return normalized;
});

const optionalPhone = z.preprocess(blankToNull, phone.nullable()).optional();

// -----------------------------------------------------------------------------
// Contatos (Brain §14)
// -----------------------------------------------------------------------------
export const contactCreateInput = z.object({
  name: requiredText(120, "o nome"),
  phone: optionalPhone,
  whatsapp: z
    .string(`Informe o WhatsApp.`)
    .trim()
    .min(1, "Informe o WhatsApp.")
    .pipe(phone),
  role: optionalText(80),
  avatarAssetId: optionalId("Foto"),
  isActive: z.boolean().optional(),
});

export const contactUpdateInput = z.object({
  id: id(),
  name: requiredText(120, "o nome").optional(),
  phone: optionalPhone,
  whatsapp: phone.optional(),
  role: optionalText(80),
  avatarAssetId: optionalId("Foto"),
  isActive: z.boolean().optional(),
});

export const reorderContactsInput = z.object({ orderedIds });

// -----------------------------------------------------------------------------
// Configurações (site_settings: whatsapp, media)
// -----------------------------------------------------------------------------
export const whatsappSettingsInput = z.object({
  messageTemplate: requiredText(500, "a mensagem").refine(
    (template) => template.includes("{produto}"),
    "A mensagem precisa ter o marcador {produto} para citar o produto (Brain §13).",
  ),
  leadOrigin: optionalText(60),
  generalMessage: optionalText(300),
});

export const mediaSettingsInput = z.object({
  videoUploadEnabled: z.boolean(),
});

// -----------------------------------------------------------------------------
// Usuários do painel (Brain §23; MDI-D027)
// -----------------------------------------------------------------------------
const role = z.enum(
  ["OWNER", "ADMIN", "CATALOG_MANAGER", "CONTENT_EDITOR"],
  "Papel inválido.",
);

export const adminGrantInput = z.object({
  email: z.email("Informe um e-mail válido.").trim(),
  displayName: requiredText(120, "o nome de exibição"),
  role,
});

export const adminUpdateInput = z.object({
  userId: id("Usuário"),
  displayName: requiredText(120, "o nome de exibição").optional(),
  role: role.optional(),
  isActive: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Envio de mídia (MDI-D026)
// -----------------------------------------------------------------------------
const ALL_MIME_TYPES = [
  ...MEDIA_MIME_TYPES.IMAGE,
  ...MEDIA_MIME_TYPES.VIDEO,
] as [string, ...string[]];

export const mediaUploadPrepareInput = z.object({
  folder: z.enum(MEDIA_FOLDERS, "Pasta inválida."),
  mimeType: z.enum(
    ALL_MIME_TYPES,
    "Formato não aceito. Use JPG, PNG, WEBP, AVIF ou MP4.",
  ),
  sizeBytes: z.number("Tamanho inválido.").int().positive("Arquivo vazio."),
});

/** Caminho gerado pelo servidor no preparo: `<pasta>/<uuid>.<ext>`. */
export const UPLOADED_PATH_PATTERN = new RegExp(
  `^(${MEDIA_FOLDERS.join("|")})/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp|avif|mp4)$`,
);

const dimension = z
  .number()
  .int("Dimensão inválida.")
  .positive("Dimensão inválida.")
  .max(20_000, "Dimensão acima do permitido.")
  .nullable()
  .optional();

export const mediaUploadFinalizeInput = z.object({
  storagePath: z
    .string()
    .regex(
      UPLOADED_PATH_PATTERN,
      "Envio inválido. Tente enviar o arquivo de novo.",
    ),
  altText: requiredText(300, "o texto alternativo"),
  width: dimension,
  height: dimension,
});

export type ContactCreateInput = z.output<typeof contactCreateInput>;
export type ContactUpdateInput = z.output<typeof contactUpdateInput>;
export type ReorderContactsInput = z.output<typeof reorderContactsInput>;
export type WhatsappSettingsInput = z.output<typeof whatsappSettingsInput>;
export type MediaSettingsInput = z.output<typeof mediaSettingsInput>;
export type AdminGrantInput = z.output<typeof adminGrantInput>;
export type AdminUpdateInput = z.output<typeof adminUpdateInput>;
export type MediaUploadPrepareInput = z.output<typeof mediaUploadPrepareInput>;
export type MediaUploadFinalizeInput = z.output<
  typeof mediaUploadFinalizeInput
>;
