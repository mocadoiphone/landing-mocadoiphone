import { type CatalogError, NOT_FOUND_MESSAGE } from "./result";

/**
 * Traduz erros do Postgres/PostgREST em mensagens para o administrador
 * (agente de segurança: "erros não devem vazar dados internos").
 */
type DbErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

type ConstraintMessage = { message: string; field?: string };

// Constraints com nome conhecido → mensagem e campo do formulário.
const CONSTRAINT_MESSAGES: Record<string, ConstraintMessage> = {
  // Unicidade
  categories_slug_key: {
    field: "slug",
    message: "Já existe uma categoria com este endereço (slug).",
  },
  product_families_slug_key: {
    field: "slug",
    message: "Já existe uma família com este endereço (slug) nesta categoria.",
  },
  products_slug_key: {
    field: "slug",
    message: "Já existe um produto com este endereço (slug).",
  },
  product_variants_sku_key: {
    field: "sku",
    message: "Já existe uma variante com este SKU.",
  },
  product_variants_combination_key: {
    field: "storage",
    message: "Já existe uma variante com esta capacidade e cor neste produto.",
  },
  product_variants_one_default: {
    field: "isDefault",
    message: "O produto já tem uma variante padrão.",
  },
  product_media_one_main: {
    field: "slot",
    message: "Já existe uma imagem principal. Troque a imagem atual.",
  },
  product_media_one_mobile: {
    field: "slot",
    message: "Já existe uma imagem mobile. Troque a imagem atual.",
  },
  media_assets_storage_path_key: {
    field: "storagePath",
    message: "Este arquivo já está cadastrado na biblioteca.",
  },
  // Regras (CHECK)
  categories_slug_not_reserved: {
    field: "slug",
    message: "Este endereço é reservado pelo site. Escolha outro.",
  },
  categories_slug_format: {
    field: "slug",
    message: "Use só letras minúsculas, números e hífens no endereço.",
  },
  product_families_slug_format: {
    field: "slug",
    message: "Use só letras minúsculas, números e hífens no endereço.",
  },
  products_slug_format: {
    field: "slug",
    message: "Use só letras minúsculas, números e hífens no endereço.",
  },
  product_variants_old_price_above_cash: {
    field: "priceOld",
    message: 'O preço "de" deve ser maior que o preço à vista.',
  },
  product_variants_installment_pair: {
    field: "installments",
    message: "Informe o número de parcelas e o valor da parcela juntos.",
  },
  products_not_related_to_self: {
    field: "relatedProductId",
    message: "Um produto não pode ser relacionado a ele mesmo.",
  },
  media_assets_mime_matches_kind: {
    field: "mimeType",
    message: "Formato de arquivo não aceito para este tipo de mídia.",
  },
  media_assets_image_dimensions: {
    field: "width",
    message: "Informe largura e altura da imagem.",
  },
  media_assets_size_limit: {
    field: "sizeBytes",
    message: "Arquivo acima do tamanho permitido.",
  },
  media_assets_storage_path_format: {
    field: "storagePath",
    message: "Caminho de arquivo inválido.",
  },
  // Chaves estrangeiras
  products_family_matches_category: {
    field: "familyId",
    message: "A família escolhida não pertence à categoria do produto.",
  },
  product_media_variant_belongs_to_product: {
    field: "variantId",
    message: "A variante escolhida não pertence a este produto.",
  },
};

// Regras de negócio levantadas pelas funções do banco (`hint` das exceções P0001).
const HINT_FIELDS: Record<string, string> = {
  "publish:last_visible_variant": "availability",
  "publish:last_main_image": "slot",
  "media:slot_kind_mismatch": "slot",
  "media:deleted": "mediaAssetId",
  "variant:default_unavailable": "isDefault",
};

const GENERIC_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente.";

function constraintName(error: DbErrorLike): string | null {
  const match = /constraint "([^"]+)"/.exec(
    `${error.message ?? ""} ${error.details ?? ""}`,
  );
  return match?.[1] ?? null;
}

function fromConstraint(
  error: DbErrorLike,
  code: CatalogError["code"],
  fallback: string,
): CatalogError {
  const name = constraintName(error);
  const known = name ? CONSTRAINT_MESSAGES[name] : undefined;
  return known
    ? {
        code,
        message: known.message,
        ...(known.field ? { field: known.field } : {}),
      }
    : { code, message: fallback };
}

export function translateDbError(error: DbErrorLike): CatalogError {
  switch (error.code) {
    case "42501":
      return {
        code: "forbidden",
        message: "Você não tem permissão para esta operação.",
      };
    case "PGRST116":
      return { code: "not_found", message: NOT_FOUND_MESSAGE };
    case "22P02":
      return { code: "validation", message: "Identificador inválido." };
    case "23505":
      return fromConstraint(
        error,
        "conflict",
        "Já existe um registro com estes dados.",
      );
    case "23514":
      return fromConstraint(
        error,
        "validation",
        "Algum valor está fora do formato permitido.",
      );
    case "23503":
      return fromConstraint(
        error,
        "conflict",
        "Item relacionado não encontrado ou ainda em uso.",
      );
    case "P0001": {
      // Exceções das funções do projeto: mensagens já escritas para o administrador.
      const field = error.hint ? HINT_FIELDS[error.hint] : undefined;
      return {
        code: "rule",
        message: error.message?.trim() || GENERIC_MESSAGE,
        ...(field ? { field } : {}),
      };
    }
    default:
      return { code: "unexpected", message: GENERIC_MESSAGE };
  }
}
