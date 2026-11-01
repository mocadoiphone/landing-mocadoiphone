/**
 * WhatsApp contextual (Brain §13; MDI-D012, MDI-D021).
 *
 * A mensagem vem de um template em `site_settings.whatsapp` com os marcadores
 * {produto}, {variante} e {origem}. O número é o do contato padrão (tabela
 * `contacts`): nenhum telefone fica no código.
 */

/** Usado só se o template não estiver configurado. Texto do exemplo do Brain §13. */
export const DEFAULT_WHATSAPP_TEMPLATE =
  "Olá! Vi no site da Moça do iPhone o {produto} {variante} e gostaria de consultar disponibilidade e valor.";

/** Atendimento geral (cabeçalho, loja, rodapé), sem produto. Usado se o painel não definir. */
export const DEFAULT_GENERAL_WHATSAPP_MESSAGE =
  "Olá! Vim pelo site da Moça do iPhone e gostaria de atendimento.";

// Mesmo formato da CHECK de `contacts.whatsapp`: só dígitos, com DDI.
const WHATSAPP_NUMBER_PATTERN = /^[1-9][0-9]{9,14}$/;

export type WhatsAppContext = {
  productName: string;
  /** "256 GB Preto"; vazio quando o produto não tem variação a citar. */
  variantLabel?: string | null;
  /** Origem do lead (ex.: "Site"). */
  origin?: string | null;
};

export type WhatsAppConfig = {
  /** Dígitos do contato padrão; `null` quando não há contato padrão ativo. */
  phone: string | null;
  template: string | null;
  origin: string | null;
  /** Mensagem do atendimento geral (marcador {origem} opcional). */
  generalMessage?: string | null;
};

// Marcador vazio não deixa espaço duplo nem espaço antes de pontuação.
function tidy(message: string): string {
  return message
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

export function buildWhatsAppMessage(
  template: string | null | undefined,
  context: WhatsAppContext,
): string {
  const source = template?.trim() ? template : DEFAULT_WHATSAPP_TEMPLATE;
  return tidy(
    source
      .replaceAll("{produto}", context.productName.trim())
      .replaceAll("{variante}", context.variantLabel?.trim() ?? "")
      .replaceAll("{origem}", context.origin?.trim() ?? ""),
  );
}

/** Mensagem do atendimento geral; marcadores de produto não se aplicam e somem. */
export function buildGeneralWhatsAppMessage(
  message: string | null | undefined,
  origin: string | null | undefined,
): string {
  const source = message?.trim() ? message : DEFAULT_GENERAL_WHATSAPP_MESSAGE;
  return tidy(
    source
      .replaceAll("{produto}", "")
      .replaceAll("{variante}", "")
      .replaceAll("{origem}", origin?.trim() ?? ""),
  );
}

/** Link `wa.me`. Sem número válido não há link (o botão não aparece). */
export function buildWhatsAppLink(
  phone: string | null,
  message: string,
): string | null {
  if (!phone || !WHATSAPP_NUMBER_PATTERN.test(phone)) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Atalho: link completo para um produto/variante a partir da configuração pública. */
export function whatsAppLinkFor(
  config: WhatsAppConfig,
  context: Omit<WhatsAppContext, "origin">,
): string | null {
  const message = buildWhatsAppMessage(config.template, {
    ...context,
    origin: config.origin,
  });
  return buildWhatsAppLink(config.phone, message);
}

/** Link do atendimento geral (sem produto). `null` sem contato padrão. */
export function generalWhatsAppLink(config: WhatsAppConfig): string | null {
  return buildWhatsAppLink(
    config.phone,
    buildGeneralWhatsAppMessage(config.generalMessage, config.origin),
  );
}
