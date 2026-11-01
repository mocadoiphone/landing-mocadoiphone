import { type Database } from "@/types/database";

/** Rótulos em português para o painel (auditoria e entidades). */
type AuditOperation = Database["public"]["Enums"]["audit_operation"];

export const AUDIT_OPERATION_LABELS: Record<AuditOperation, string> = {
  INSERT: "criou",
  UPDATE: "alterou",
  DELETE: "removeu",
  SOFT_DELETE: "excluiu",
  RESTORE: "restaurou",
  PUBLISH: "publicou",
  UNPUBLISH: "despublicou",
};

export const ENTITY_LABELS: Record<string, string> = {
  products: "Produto",
  product_variants: "Variante",
  product_media: "Mídia do produto",
  product_specs: "Especificação",
  categories: "Categoria",
  product_families: "Família",
  media_assets: "Mídia",
  contacts: "Contato",
  site_settings: "Configuração",
  admin_profiles: "Usuário do painel",
  homepage_sections: "Bloco da Home",
};

// Campos alterados mais comuns, para o resumo "alterou preço, disponibilidade".
export const FIELD_LABELS: Record<string, string> = {
  name: "nome",
  slug: "endereço",
  status: "status",
  price_cash: "preço",
  price_old: "preço anterior",
  price_installment: "parcela",
  installments: "parcelas",
  installment_text: "texto de parcelamento",
  price_on_request: "consulte valores",
  availability: "disponibilidade",
  is_default: "variante padrão",
  is_active: "ativo",
  sort_order: "ordem",
  alt_text: "texto alternativo",
  media_asset_id: "arquivo",
  is_launch: "lançamento",
  is_featured: "destaque",
  is_promotion: "promoção",
  role: "papel",
  value_json: "valores",
  description: "descrição",
  short_description: "resumo",
  deleted_at: "exclusão",
};

/** "preço, disponibilidade" — ignora campos técnicos (preço derivado, datas). */
export function describeChangedFields(
  fields: readonly string[] | null,
): string {
  if (!fields) return "";
  return fields
    .filter((field) => FIELD_LABELS[field])
    .map((field) => FIELD_LABELS[field])
    .join(", ");
}
