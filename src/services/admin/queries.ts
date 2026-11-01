import "server-only";

import {
  AUDIT_OPERATION_LABELS,
  describeChangedFields,
  ENTITY_LABELS,
} from "@/lib/admin/labels";
import {
  type AdminProductRow,
  dashboardMetrics,
  type DashboardMetrics,
} from "@/lib/admin/products";
import { type AdminRole } from "@/lib/auth/roles";
import {
  getPublicationIssues,
  type PublicationIssue,
} from "@/lib/catalog/publication";
import { BLOCK_DEFINITIONS } from "@/lib/home/blocks";
import { type MediaKind } from "@/lib/media/media";
import {
  type FooterSettings,
  parseFooterSettings,
  parseStoreSettings,
  type StoreSettings,
} from "@/lib/site/settings";
import { type CatalogClient } from "@/services/catalog/mutations/shared";
import { type Database } from "@/types/database";

/**
 * Leituras do painel com a sessão do administrador (MDI-D025). A RLS dá ao staff
 * a visão completa (rascunhos e excluídos); cada página confere o papel antes.
 * Falha de leitura vira exceção: a tela mostra o estado de erro.
 */
type Tables = Database["public"]["Tables"];

function fail(context: string, cause: unknown): never {
  throw new Error(`Falha ao carregar ${context}.`, { cause });
}

const PRICE_FIELDS =
  "price_cash, price_old, price_installment, installments, installment_text, price_on_request";

export type AdminMedia = {
  id: string;
  storagePath: string;
  altText: string;
  width: number | null;
  height: number | null;
  kind: MediaKind;
};

type MediaAssetRow = {
  id: string;
  storage_path: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  kind: MediaKind;
};

const MEDIA_FIELDS = "id, storage_path, alt_text, width, height, kind";

function toAdminMedia(row: MediaAssetRow | null): AdminMedia | null {
  return row
    ? {
        id: row.id,
        storagePath: row.storage_path,
        altText: row.alt_text,
        width: row.width,
        height: row.height,
        kind: row.kind,
      }
    : null;
}

// -----------------------------------------------------------------------------
// Produtos (lista e dashboard)
// -----------------------------------------------------------------------------
export type AdminProductListRow = AdminProductRow & {
  categoryName: string;
  updatedAt: string;
};

export async function listAdminProducts(
  client: CatalogClient,
): Promise<AdminProductListRow[]> {
  const { data, error } = await client
    .from("products")
    .select(
      `id, name, slug, status, category_id, deleted_at, is_launch, is_featured, is_promotion, updated_at, category:categories(name), variants:product_variants(availability, deleted_at, sort_order, ${PRICE_FIELDS})`,
    )
    .order("sort_order")
    .order("name");
  if (error) fail("os produtos", error);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? "",
    isDeleted: row.deleted_at !== null,
    isLaunch: row.is_launch,
    isFeatured: row.is_featured,
    isPromotion: row.is_promotion,
    updatedAt: row.updated_at,
    variants: row.variants.map((variant) => ({
      availability: variant.availability,
      isDeleted: variant.deleted_at !== null,
      sortOrder: variant.sort_order,
      priceCash: variant.price_cash,
      priceOld: variant.price_old,
      priceInstallment: variant.price_installment,
      installments: variant.installments,
      installmentText: variant.installment_text,
      priceOnRequest: variant.price_on_request,
    })),
  }));
}

export type RecentChange = {
  id: number;
  createdAt: string;
  actorName: string;
  summary: string;
  entityLabel: string;
  entityName: string | null;
  fields: string;
};

/** Últimas alterações (Brain §15). Só OWNER/ADMIN leem `audit_logs` (RLS). */
export async function listRecentChanges(
  client: CatalogClient,
  limit = 15,
): Promise<RecentChange[]> {
  const { data, error } = await client
    .from("audit_logs")
    .select(
      "id, created_at, actor_user_id, source, entity_type, entity_id, operation, changed_fields",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("as alterações recentes", error);

  const ids = (type: string) =>
    data.filter((row) => row.entity_type === type).map((row) => row.entity_id);
  const actorIds = [
    ...new Set(
      data.flatMap((row) => (row.actor_user_id ? [row.actor_user_id] : [])),
    ),
  ];
  const [actors, products, categories, families] = await Promise.all([
    client
      .from("admin_profiles")
      .select("user_id, display_name")
      .in("user_id", actorIds),
    client.from("products").select("id, name").in("id", ids("products")),
    client.from("categories").select("id, name").in("id", ids("categories")),
    client
      .from("product_families")
      .select("id, name")
      .in("id", ids("product_families")),
  ]);
  const names = new Map<string, string>();
  for (const row of [
    ...(products.data ?? []),
    ...(categories.data ?? []),
    ...(families.data ?? []),
  ]) {
    names.set(row.id, row.name);
  }
  const actorNames = new Map(
    (actors.data ?? []).map((row) => [row.user_id, row.display_name]),
  );

  return data.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    actorName:
      (row.actor_user_id && actorNames.get(row.actor_user_id)) ||
      (row.source === "admin" ? "Administrador" : "Sistema"),
    summary: AUDIT_OPERATION_LABELS[row.operation],
    entityLabel: ENTITY_LABELS[row.entity_type] ?? row.entity_type,
    entityName: names.get(row.entity_id) ?? null,
    fields:
      row.operation === "UPDATE"
        ? describeChangedFields(row.changed_fields)
        : "",
  }));
}

export async function getDashboard(
  client: CatalogClient,
  role: AdminRole,
): Promise<{ metrics: DashboardMetrics; recent: RecentChange[] | null }> {
  const canSeeAudit = role === "OWNER" || role === "ADMIN";
  const [products, recent] = await Promise.all([
    listAdminProducts(client),
    canSeeAudit ? listRecentChanges(client) : Promise.resolve(null),
  ]);
  return { metrics: dashboardMetrics(products), recent };
}

// -----------------------------------------------------------------------------
// Editor de produto
// -----------------------------------------------------------------------------
export type EditorVariant = Pick<
  Tables["product_variants"]["Row"],
  | "id"
  | "sku"
  | "storage"
  | "color_name"
  | "color_hex"
  | "sort_order"
  | "is_default"
  | "availability"
  | "price_cash"
  | "price_old"
  | "price_installment"
  | "installments"
  | "installment_text"
  | "price_on_request"
  | "deleted_at"
>;

export type EditorMediaLink = {
  id: string;
  slot: string;
  variantId: string | null;
  altText: string | null;
  sortOrder: number;
  asset: (AdminMedia & { isDeleted: boolean }) | null;
};

export type CategoryOption = {
  id: string;
  name: string;
  isActive: boolean;
  families: { id: string; name: string }[];
};

export type ProductEditorData = {
  product: Tables["products"]["Row"];
  category: {
    id: string;
    name: string;
    isActive: boolean;
    isDeleted: boolean;
  } | null;
  family: { id: string; name: string; isDeleted: boolean } | null;
  variants: EditorVariant[];
  media: EditorMediaLink[];
  specs: {
    id: string;
    groupName: string | null;
    label: string;
    value: string;
    sortOrder: number;
  }[];
  ogImage: AdminMedia | null;
  publicationIssues: PublicationIssue[];
  categories: CategoryOption[];
  relatedOptions: { id: string; name: string }[];
};

export async function listCategoryOptions(
  client: CatalogClient,
): Promise<CategoryOption[]> {
  const { data, error } = await client
    .from("categories")
    .select(
      "id, name, is_active, families:product_families(id, name, sort_order, deleted_at)",
    )
    .is("deleted_at", null)
    .order("sort_order")
    .order("name");
  if (error) fail("as categorias", error);
  return data.map((category) => ({
    id: category.id,
    name: category.name,
    isActive: category.is_active,
    families: category.families
      .filter((family) => family.deleted_at === null)
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR"),
      )
      .map((family) => ({ id: family.id, name: family.name })),
  }));
}

export async function getProductEditor(
  client: CatalogClient,
  productId: string,
): Promise<ProductEditorData | null> {
  const [product, categories, related] = await Promise.all([
    client
      .from("products")
      .select(
        `*, category:categories(id, name, is_active, deleted_at), family:product_families(id, name, deleted_at), variants:product_variants(id, sku, storage, color_name, color_hex, sort_order, is_default, availability, ${PRICE_FIELDS}, deleted_at), media:product_media(id, slot, variant_id, alt_text, sort_order, asset:media_assets(${MEDIA_FIELDS}, deleted_at)), specs:product_specs(id, group_name, label, value, sort_order), og_image:media_assets(${MEDIA_FIELDS})`,
      )
      .eq("id", productId)
      .maybeSingle(),
    listCategoryOptions(client),
    client
      .from("products")
      .select("id, name")
      .is("deleted_at", null)
      .neq("id", productId)
      .order("name"),
  ]);
  if (product.error) fail("o produto", product.error);
  if (related.error) fail("os produtos relacionados", related.error);
  if (!product.data) return null;

  const {
    category,
    family,
    variants,
    media,
    specs,
    og_image: ogImage,
    ...row
  } = product.data;

  const mediaLinks: EditorMediaLink[] = media
    .map((link) => ({
      id: link.id,
      slot: link.slot,
      variantId: link.variant_id,
      altText: link.alt_text,
      sortOrder: link.sort_order,
      asset: link.asset
        ? {
            ...toAdminMedia(link.asset)!,
            isDeleted: link.asset.deleted_at !== null,
          }
        : null,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const mainImage = mediaLinks.find(
    (link) => link.slot === "MAIN" && link.variantId === null,
  );

  return {
    product: row,
    category: category
      ? {
          id: category.id,
          name: category.name,
          isActive: category.is_active,
          isDeleted: category.deleted_at !== null,
        }
      : null,
    family: family
      ? {
          id: family.id,
          name: family.name,
          isDeleted: family.deleted_at !== null,
        }
      : null,
    variants: [...variants].sort((a, b) => a.sort_order - b.sort_order),
    media: mediaLinks,
    specs: specs
      .map((spec) => ({
        id: spec.id,
        groupName: spec.group_name,
        label: spec.label,
        value: spec.value,
        sortOrder: spec.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    ogImage: toAdminMedia(ogImage),
    publicationIssues: getPublicationIssues({
      category: {
        isActive: category?.is_active ?? false,
        isDeleted: category?.deleted_at != null,
      },
      family: { isDeleted: family?.deleted_at != null },
      variants: variants.map((variant) => ({
        availability: variant.availability,
        isDeleted: variant.deleted_at !== null,
      })),
      mainImage: mainImage
        ? { assetDeleted: mainImage.asset?.isDeleted ?? true }
        : null,
    }),
    categories,
    relatedOptions: related.data,
  };
}

// -----------------------------------------------------------------------------
// Categorias e famílias
// -----------------------------------------------------------------------------
export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  sortOrder: number;
  image: AdminMedia | null;
  productCount: number;
  families: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    isDeleted: boolean;
    productCount: number;
  }[];
};

export async function listAdminCategories(
  client: CatalogClient,
): Promise<AdminCategory[]> {
  const [categories, products] = await Promise.all([
    client
      .from("categories")
      .select(
        `id, name, slug, description, is_active, sort_order, deleted_at, image:media_assets(${MEDIA_FIELDS}), families:product_families(id, name, slug, sort_order, deleted_at)`,
      )
      .order("sort_order")
      .order("name"),
    client
      .from("products")
      .select("category_id, family_id")
      .is("deleted_at", null),
  ]);
  if (categories.error) fail("as categorias", categories.error);
  if (products.error) fail("a contagem de produtos", products.error);

  const count = (key: "category_id" | "family_id", id: string) =>
    products.data.filter((product) => product[key] === id).length;

  return categories.data.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.is_active,
    isDeleted: category.deleted_at !== null,
    sortOrder: category.sort_order,
    image: toAdminMedia(category.image),
    productCount: count("category_id", category.id),
    families: category.families
      .map((family) => ({
        id: family.id,
        name: family.name,
        slug: family.slug,
        sortOrder: family.sort_order,
        isDeleted: family.deleted_at !== null,
        productCount: count("family_id", family.id),
      }))
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR"),
      ),
  }));
}

// -----------------------------------------------------------------------------
// Biblioteca de mídia
// -----------------------------------------------------------------------------
export type MediaUsage = { label: string; href: string | null };

export type MediaLibraryItem = AdminMedia & {
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  isDeleted: boolean;
  usages: MediaUsage[];
};

export async function listMediaLibrary(
  client: CatalogClient,
): Promise<MediaLibraryItem[]> {
  const [assets, productMedia, categories, ogImages, contacts, blocks, store] =
    await Promise.all([
      client
        .from("media_assets")
        .select(
          "id, storage_path, kind, mime_type, size_bytes, width, height, alt_text, created_at, deleted_at",
        )
        .order("created_at", { ascending: false }),
      client
        .from("product_media")
        .select("media_asset_id, slot, product:products(id, name)"),
      client
        .from("categories")
        .select("id, name, image_asset_id")
        .not("image_asset_id", "is", null),
      client
        .from("products")
        .select("id, name, og_image_asset_id")
        .not("og_image_asset_id", "is", null),
      client
        .from("contacts")
        .select("id, name, avatar_asset_id")
        .not("avatar_asset_id", "is", null),
      client
        .from("homepage_sections")
        .select("type, title, media_asset_id, video_asset_id"),
      client
        .from("site_settings")
        .select("value_json")
        .eq("key", "store")
        .maybeSingle(),
    ]);
  for (const result of [
    assets,
    productMedia,
    categories,
    ogImages,
    contacts,
    blocks,
    store,
  ]) {
    if (result.error) fail("a biblioteca de mídia", result.error);
  }

  const usages = new Map<string, MediaUsage[]>();
  const add = (assetId: string | null, usage: MediaUsage) => {
    if (!assetId) return;
    usages.set(assetId, [...(usages.get(assetId) ?? []), usage]);
  };
  for (const link of productMedia.data ?? []) {
    add(link.media_asset_id, {
      label: `Produto: ${link.product?.name ?? "—"}`,
      href: link.product
        ? `/admin/produtos/${link.product.id}?aba=midia`
        : null,
    });
  }
  for (const category of categories.data ?? []) {
    add(category.image_asset_id, {
      label: `Categoria: ${category.name}`,
      href: "/admin/categorias",
    });
  }
  for (const product of ogImages.data ?? []) {
    add(product.og_image_asset_id, {
      label: `SEO do produto: ${product.name}`,
      href: `/admin/produtos/${product.id}?aba=seo`,
    });
  }
  for (const contact of contacts.data ?? []) {
    add(contact.avatar_asset_id, {
      label: `Contato: ${contact.name}`,
      href: "/admin/contatos",
    });
  }
  for (const block of blocks.data ?? []) {
    const usage = {
      label: `Home: ${block.title ?? BLOCK_DEFINITIONS[block.type].label}`,
      href: "/admin/home",
    };
    add(block.media_asset_id, usage);
    add(block.video_asset_id, usage);
  }
  for (const photoId of parseStoreSettings(store.data?.value_json).photoIds) {
    add(photoId, { label: "Loja física", href: "/admin/configuracoes" });
  }

  return (assets.data ?? []).map((asset) => ({
    ...toAdminMedia(asset)!,
    mimeType: asset.mime_type,
    sizeBytes: asset.size_bytes,
    createdAt: asset.created_at,
    isDeleted: asset.deleted_at !== null,
    usages: usages.get(asset.id) ?? [],
  }));
}

// -----------------------------------------------------------------------------
// Contatos, configurações e usuários
// -----------------------------------------------------------------------------
export type AdminContact = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string;
  role: string | null;
  isActive: boolean;
  isDefault: boolean;
  isDeleted: boolean;
  sortOrder: number;
  avatar: AdminMedia | null;
};

export async function listAdminContacts(
  client: CatalogClient,
): Promise<AdminContact[]> {
  const { data, error } = await client
    .from("contacts")
    .select(
      `id, name, phone, whatsapp, role, is_active, is_default, sort_order, deleted_at, avatar:media_assets(${MEDIA_FIELDS})`,
    )
    .order("sort_order")
    .order("name");
  if (error) fail("os contatos", error);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    role: row.role,
    isActive: row.is_active,
    isDefault: row.is_default,
    isDeleted: row.deleted_at !== null,
    sortOrder: row.sort_order,
    avatar: toAdminMedia(row.avatar),
  }));
}

export type AdminSettings = {
  whatsapp: {
    messageTemplate: string | null;
    leadOrigin: string | null;
    generalMessage: string | null;
  };
  media: { videoUploadEnabled: boolean };
  store: StoreSettings;
  footer: FooterSettings;
};

function stringField(value: unknown, key: string): string | null {
  if (typeof value !== "object" || value === null || !(key in value))
    return null;
  const field: unknown = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : null;
}

export async function getAdminSettings(
  client: CatalogClient,
): Promise<AdminSettings> {
  const { data, error } = await client
    .from("site_settings")
    .select("key, value_json")
    .in("key", ["whatsapp", "media", "store", "footer"]);
  if (error) fail("as configurações", error);
  const value = (key: string) =>
    data.find((row) => row.key === key)?.value_json;
  const media = value("media");
  return {
    whatsapp: {
      messageTemplate: stringField(value("whatsapp"), "message_template"),
      leadOrigin: stringField(value("whatsapp"), "lead_origin"),
      generalMessage: stringField(value("whatsapp"), "general_message"),
    },
    media: {
      videoUploadEnabled:
        typeof media === "object" &&
        media !== null &&
        !Array.isArray(media) &&
        media.video_upload_enabled === true,
    },
    store: parseStoreSettings(value("store")),
    footer: parseFooterSettings(value("footer")),
  };
}

export type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  lastSignInAt: string | null;
};

export async function listAdminUsers(
  client: CatalogClient,
): Promise<AdminUser[]> {
  const { data, error } = await client.rpc("list_admin_users");
  if (error) fail("os usuários do painel", error);
  return data.map((row) => ({
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active,
    lastSignInAt: row.last_sign_in_at,
  }));
}
