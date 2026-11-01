import { z } from "zod";

import { id, optionalText, requiredText } from "@/lib/catalog/schemas";

import {
  safeMapUrl,
  safeSocialUrl,
  SOCIAL_NETWORK_LABELS,
  SOCIAL_NETWORKS,
  type SocialNetwork,
} from "./links";

/**
 * Conteúdo institucional administrável (Brain §7.7, §7.8; MDI-D016, MDI-D031):
 * loja física (`site_settings.store`) e rodapé (`site_settings.footer`).
 * O painel grava campos estruturados; o layout é do site. Nada de HTML livre.
 */

export const STORE_HOURS_MAX = 7;
export const STORE_PHOTOS_MAX = 6;
export const SOCIAL_LINKS_MAX = 6;

const POSTAL_CODE_PATTERN = /^\d{5}-?\d{3}$/;

// -----------------------------------------------------------------------------
// Loja física
// -----------------------------------------------------------------------------
const hoursRow = z.object({
  label: requiredText(40, "os dias (ex.: Segunda a sexta)"),
  value: requiredText(60, "o horário (ex.: 10h às 22h)"),
});

const optionalMapUrl = z
  .preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z
      .string()
      .nullable()
      .transform((value, ctx) => {
        if (value === null) return null;
        const safe = safeMapUrl(value);
        if (!safe) {
          ctx.addIssue({
            code: "custom",
            message:
              "Use um link https do Google Maps, Apple Maps ou Waze (ex.: https://maps.app.goo.gl/…).",
          });
          return z.NEVER;
        }
        return safe;
      }),
  )
  .optional();

export const storeSettingsInput = z.object({
  name: optionalText(80),
  description: optionalText(600),
  addressLine: optionalText(160),
  district: optionalText(80),
  city: optionalText(80),
  postalCode: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? null : value,
      z
        .string()
        .trim()
        .regex(POSTAL_CODE_PATTERN, "CEP inválido. Use 00000-000.")
        .nullable(),
    )
    .optional(),
  hours: z
    .array(hoursRow)
    .max(STORE_HOURS_MAX, `Use no máximo ${STORE_HOURS_MAX} linhas de horário.`)
    .default([]),
  mapUrl: optionalMapUrl,
  photoIds: z
    .array(id("Foto"))
    .max(STORE_PHOTOS_MAX, `Use no máximo ${STORE_PHOTOS_MAX} fotos.`)
    .default([]),
  ctaLabel: optionalText(40),
});
export type StoreSettingsInput = z.output<typeof storeSettingsInput>;

export type StoreSettings = {
  name: string | null;
  description: string | null;
  addressLine: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  hours: { label: string; value: string }[];
  mapUrl: string | null;
  photoIds: string[];
  ctaLabel: string | null;
};

/** Formato gravado em `site_settings.store` (chaves em snake_case, como o WhatsApp). */
export function toStoreJson(input: StoreSettingsInput) {
  return {
    name: input.name ?? null,
    description: input.description ?? null,
    address_line: input.addressLine ?? null,
    district: input.district ?? null,
    city: input.city ?? null,
    postal_code: input.postalCode ?? null,
    hours: input.hours,
    map_url: input.mapUrl ?? null,
    photo_ids: input.photoIds,
    cta_label: input.ctaLabel ?? null,
  };
}

const text = (max: number) =>
  z.string().trim().max(max).nullable().optional().catch(null);

const storeJson = z.object({
  name: text(80),
  description: text(600),
  address_line: text(160),
  district: text(80),
  city: text(80),
  postal_code: text(9),
  hours: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
      }),
    )
    .max(STORE_HOURS_MAX)
    .optional()
    .catch([]),
  map_url: z.string().nullable().optional().catch(null),
  photo_ids: z.array(z.uuid()).max(STORE_PHOTOS_MAX).optional().catch([]),
  cta_label: text(40),
});

function asObject(raw: unknown): Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

const blank = (value: string | null | undefined) => value?.trim() || null;

/** Leitura tolerante: o que estiver inválido vira vazio; o link do mapa é revalidado. */
export function parseStoreSettings(raw: unknown): StoreSettings {
  const parsed = storeJson.safeParse(asObject(raw));
  const value = parsed.success ? parsed.data : {};
  return {
    name: blank(value.name),
    description: blank(value.description),
    addressLine: blank(value.address_line),
    district: blank(value.district),
    city: blank(value.city),
    postalCode: blank(value.postal_code),
    hours: value.hours ?? [],
    mapUrl: value.map_url ? safeMapUrl(value.map_url) : null,
    photoIds: value.photo_ids ?? [],
    ctaLabel: blank(value.cta_label),
  };
}

/** Endereço em linhas para exibição e para o elemento `<address>`. */
export function storeAddressLines(store: StoreSettings): string[] {
  const cityLine = [
    store.city,
    store.postalCode ? `CEP ${store.postalCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return [store.addressLine, store.district, cityLine || null].filter(
    (line): line is string => Boolean(line),
  );
}

/** O bloco da loja só aparece com endereço ou horário cadastrado. */
export function hasStoreContent(store: StoreSettings): boolean {
  return storeAddressLines(store).length > 0 || store.hours.length > 0;
}

// -----------------------------------------------------------------------------
// Rodapé
// -----------------------------------------------------------------------------
const socialLinkInput = z
  .object({
    network: z.enum(SOCIAL_NETWORKS, "Escolha a rede social."),
    url: z.string("Informe o link.").trim().min(1, "Informe o link."),
  })
  .transform((link, ctx) => {
    const safe = safeSocialUrl(link.network, link.url);
    if (!safe) {
      ctx.addIssue({
        code: "custom",
        message: `Link inválido para ${SOCIAL_NETWORK_LABELS[link.network]}: use o endereço https do perfil.`,
      });
      return z.NEVER;
    }
    return { network: link.network, url: safe };
  });

export const footerSettingsInput = z.object({
  about: optionalText(300),
  socialLinks: z
    .array(socialLinkInput)
    .max(SOCIAL_LINKS_MAX, `Use no máximo ${SOCIAL_LINKS_MAX} redes.`)
    .default([]),
  legalName: optionalText(120),
  legalId: optionalText(40),
  legalNotice: optionalText(400),
  copyright: optionalText(120),
});
export type FooterSettingsInput = z.output<typeof footerSettingsInput>;

export type SocialLink = { network: SocialNetwork; label: string; url: string };

export type FooterSettings = {
  about: string | null;
  socialLinks: SocialLink[];
  legalName: string | null;
  legalId: string | null;
  legalNotice: string | null;
  copyright: string | null;
};

export function toFooterJson(input: FooterSettingsInput) {
  return {
    about: input.about ?? null,
    social_links: input.socialLinks,
    legal_name: input.legalName ?? null,
    legal_id: input.legalId ?? null,
    legal_notice: input.legalNotice ?? null,
    copyright: input.copyright ?? null,
  };
}

const footerJson = z.object({
  about: text(300),
  social_links: z
    .array(z.object({ network: z.enum(SOCIAL_NETWORKS), url: z.string() }))
    .max(SOCIAL_LINKS_MAX)
    .optional()
    .catch([]),
  legal_name: text(120),
  legal_id: text(40),
  legal_notice: text(400),
  copyright: text(120),
});

export function parseFooterSettings(raw: unknown): FooterSettings {
  const parsed = footerJson.safeParse(asObject(raw));
  const value = parsed.success ? parsed.data : {};
  return {
    about: blank(value.about),
    socialLinks: (value.social_links ?? []).flatMap((link) => {
      const url = safeSocialUrl(link.network, link.url);
      return url
        ? [
            {
              network: link.network,
              label: SOCIAL_NETWORK_LABELS[link.network],
              url,
            },
          ]
        : [];
    }),
    legalName: blank(value.legal_name),
    legalId: blank(value.legal_id),
    legalNotice: blank(value.legal_notice),
    copyright: blank(value.copyright),
  };
}

/** Linha de copyright: a do painel, ou "© <ano> <nome do site>". */
export function copyrightLine(
  custom: string | null,
  year: number,
  siteName: string,
): string {
  return custom ?? `© ${year} ${siteName}. Todos os direitos reservados.`;
}
