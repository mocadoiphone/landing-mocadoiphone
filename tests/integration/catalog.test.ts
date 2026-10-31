import { beforeAll, describe, expect, it } from "vitest";

import { type CatalogResult } from "@/lib/catalog/result";
import {
  createCategory,
  createFamily,
  restoreCategory,
  softDeleteCategory,
  softDeleteFamily,
  updateCategory,
} from "@/services/catalog/mutations/categories";
import {
  createSpec,
  linkProductMedia,
  reorderSpecs,
  unlinkProductMedia,
  updateProductMedia,
} from "@/services/catalog/mutations/content";
import {
  createProduct,
  setProductStatus,
  softDeleteProduct,
  updateProduct,
} from "@/services/catalog/mutations/products";
import { type CatalogClient } from "@/services/catalog/mutations/shared";
import {
  createVariant,
  reorderVariants,
  setDefaultVariant,
  softDeleteVariant,
  updateVariant,
} from "@/services/catalog/mutations/variants";
import {
  getPublicCategoryPage,
  getPublicProduct,
  getPublicWhatsAppConfig,
  listPublicCategories,
  listPublicShowcase,
} from "@/services/catalog/public-queries";
import { registerMediaAsset } from "@/services/media/mutations";

import {
  publicClient,
  SEED_OWNER,
  SEED_VISITOR,
  sessionClient,
  supabaseUrl,
  uniqueSuffix,
} from "./helpers";

// Testes contra a API real do Supabase LOCAL (seed de `supabase/seed.sql`).
// Exercitam o núcleo das Server Actions com sessões reais: a RLS e os triggers
// do banco são os de produção.
const NBSP = " ";

function expectOk<T>(result: CatalogResult<T>): T {
  if (!result.ok) {
    throw new Error(
      `Esperava sucesso: ${result.error.code} ${result.error.message}`,
    );
  }
  return result.data;
}

function expectError<T>(result: CatalogResult<T>) {
  if (result.ok) throw new Error("Esperava erro, mas a operação teve sucesso.");
  return result.error;
}

describe("consultas públicas (seed)", () => {
  it("lista as categorias ativas na ordem definida", async () => {
    const categories = await listPublicCategories(
      publicClient(),
      supabaseUrl(),
    );
    const slugs = categories.map((category) => category.slug);
    expect(slugs.slice(0, 8)).toEqual([
      "iphone",
      "mac",
      "ipad",
      "apple-watch",
      "airpods",
      "vision-pro",
      "tv-e-casa",
      "acessorios",
    ]);
  });

  it("página de categoria mostra só o produto publicado, agrupado por família", async () => {
    const page = await getPublicCategoryPage(
      publicClient(),
      supabaseUrl(),
      "iphone",
    );
    expect(page?.category.name).toBe("iPhone");
    expect(page?.families).toHaveLength(1);

    const [family] = page?.families ?? [];
    expect(family?.name).toBe("Família de teste");
    expect(family?.products.map((product) => product.slug)).toEqual([
      "produto-de-teste-publicado",
    ]);
    expect(family?.products[0]).toMatchObject({
      price: { kind: "on_request", label: "Consulte valores" },
      availability: { status: "ON_REQUEST", label: "Consulte disponibilidade" },
    });
    expect(family?.products[0]?.image?.url).toMatch(
      /\/storage\/v1\/object\/public\/media\/products\/seed\/produto-de-teste\.webp$/,
    );
  });

  it("produto publicado traz variante, rótulo e link de WhatsApp contextual", async () => {
    const product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      "produto-de-teste-publicado",
    );
    expect(product?.variants).toHaveLength(1);
    const [variant] = product?.variants ?? [];
    expect(variant).toMatchObject({ label: "128 GB / Cinza", isDefault: true });
    expect(variant?.whatsappUrl).toBe(
      `https://wa.me/5500000000000?text=${encodeURIComponent(
        "Olá! Vi no site da Moça do iPhone o Produto de teste publicado 128 GB Cinza e gostaria de consultar disponibilidade e valor.",
      )}`,
    );
    expect(product?.defaultVariantId).toBe(variant?.id);
  });

  it("rascunho, slug inexistente e categoria inexistente não aparecem", async () => {
    const client = publicClient();
    expect(
      await getPublicProduct(client, supabaseUrl(), "produto-de-teste"),
    ).toBeNull();
    expect(
      await getPublicProduct(client, supabaseUrl(), "nao-existe"),
    ).toBeNull();
    expect(
      await getPublicCategoryPage(client, supabaseUrl(), "nao-existe"),
    ).toBeNull();
  });

  it("configuração pública do WhatsApp vem do contato padrão e do template", async () => {
    const config = await getPublicWhatsAppConfig(publicClient());
    expect(config).toEqual({
      phone: "5500000000000",
      template:
        "Olá! Vi no site da Moça do iPhone o {produto} {variante} e gostaria de consultar disponibilidade e valor.",
      origin: "Site",
    });
  });
});

describe("ciclo do catálogo pelo OWNER (núcleo das Server Actions)", () => {
  let owner: CatalogClient;
  const suffix = uniqueSuffix();
  const ids = {
    category: "",
    otherCategory: "",
    family: "",
    product: "",
    variantA: "",
    variantB: "",
    media: "",
    main: "",
  };
  const productSlug = `produto-ciclo-${suffix}`;

  beforeAll(async () => {
    owner = await sessionClient(SEED_OWNER);
  });

  it("cria categoria (inativa), família e produto (rascunho)", async () => {
    const category = expectOk(
      await createCategory(owner, {
        name: `Linha ${suffix}`,
        slug: `linha-${suffix}`,
      }),
    );
    ids.category = category.id;

    const family = expectOk(
      await createFamily(owner, {
        categoryId: ids.category,
        name: "Família Ciclo",
      }),
    );
    expect(family.slug).toBe("familia-ciclo");
    ids.family = family.id;

    const product = expectOk(
      await createProduct(owner, {
        categoryId: ids.category,
        familyId: ids.family,
        name: "Produto Ciclo",
        slug: productSlug,
        isLaunch: true,
      }),
    );
    expect(product.status).toBe("DRAFT");
    ids.product = product.id;
  });

  it("primeira variante visível vira padrão automaticamente", async () => {
    const a = expectOk(
      await createVariant(owner, {
        productId: ids.product,
        storage: "256 GB",
        colorName: "Preto",
        priceCash: 899900,
        priceInstallment: 54990,
        installments: 18,
        availability: "AVAILABLE",
      }),
    );
    const b = expectOk(
      await createVariant(owner, {
        productId: ids.product,
        storage: "512 GB",
        colorName: "Preto",
        priceCash: 999900,
        availability: "PRE_ORDER",
      }),
    );
    expect(a.is_default).toBe(true);
    expect(b.is_default).toBe(false);
    ids.variantA = a.id;
    ids.variantB = b.id;
  });

  it("publicar sem os requisitos devolve todas as pendências de uma vez", async () => {
    const error = expectError(
      await setProductStatus(owner, { id: ids.product, status: "PUBLISHED" }),
    );
    expect(error.code).toBe("rule");
    expect(error.fieldErrors?.status).toEqual([
      "Ative a categoria do produto.",
      "Defina a imagem principal.",
    ]);
  });

  it("com imagem principal e categoria ativa, publica", async () => {
    const media = expectOk(
      await registerMediaAsset(owner, {
        storagePath: `products/ciclo/${suffix}.webp`,
        kind: "IMAGE",
        mimeType: "image/webp",
        sizeBytes: 4096,
        width: 1200,
        height: 1200,
        altText: "Produto Ciclo de frente",
      }),
    );
    ids.media = media.id;

    const main = expectOk(
      await linkProductMedia(owner, {
        productId: ids.product,
        mediaAssetId: ids.media,
        slot: "MAIN",
      }),
    );
    ids.main = main.id;

    expectOk(await updateCategory(owner, { id: ids.category, isActive: true }));
    const published = expectOk(
      await setProductStatus(owner, { id: ids.product, status: "PUBLISHED" }),
    );
    expect(published.status).toBe("PUBLISHED");
  });

  it("o público vê o produto com preço, parcela e disponibilidade calculados", async () => {
    const product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      productSlug,
    );
    expect(product?.price).toEqual({
      kind: "priced",
      prefix: "A partir de",
      amount: `R$${NBSP}8.999`,
      previous: null,
      installment: `ou 18x de R$${NBSP}549,90`,
    });
    expect(product?.availability).toEqual({
      status: "AVAILABLE",
      label: "Disponível",
    });
    expect(product?.variants.map((variant) => variant.label)).toEqual([
      "256 GB / Preto",
      "512 GB / Preto",
    ]);
    expect(product?.defaultVariantId).toBe(ids.variantA);

    const launches = await listPublicShowcase(
      publicClient(),
      supabaseUrl(),
      "launch",
    );
    expect(launches.map((card) => card.slug)).toContain(productSlug);
  });

  it("produto relacionado aparece só se for público", async () => {
    const { data: seed } = await owner
      .from("products")
      .select("id, slug")
      .in("slug", ["produto-de-teste-publicado", "produto-de-teste"]);
    const published = seed?.find(
      (row) => row.slug === "produto-de-teste-publicado",
    );
    const draft = seed?.find((row) => row.slug === "produto-de-teste");

    expectOk(
      await updateProduct(owner, {
        id: ids.product,
        relatedProductId: published?.id,
      }),
    );
    let product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      productSlug,
    );
    expect(product?.related).toEqual({
      slug: "produto-de-teste-publicado",
      name: "Produto de teste publicado",
    });

    expectOk(
      await updateProduct(owner, {
        id: ids.product,
        relatedProductId: draft?.id,
      }),
    );
    product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      productSlug,
    );
    expect(product?.related).toBeNull();
  });

  it("troca a variante padrão de forma atômica", async () => {
    expectOk(await setDefaultVariant(owner, { id: ids.variantB }));
    const product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      productSlug,
    );
    expect(product?.defaultVariantId).toBe(ids.variantB);
    expect(
      product?.variants.filter((variant) => variant.isDefault),
    ).toHaveLength(1);
  });

  it("alteração de preço chega ao site (price_from recalculado pelo banco)", async () => {
    expectOk(
      await updateVariant(owner, {
        id: ids.variantA,
        priceCash: 849900,
        priceOld: 899900,
      }),
    );
    const product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      productSlug,
    );
    expect(product?.price).toMatchObject({
      amount: `R$${NBSP}8.499`,
      previous: `R$${NBSP}8.999`,
    });
  });

  it("produto publicado mantém variante visível e imagem principal (MDI-D022)", async () => {
    expectOk(
      await updateVariant(owner, { id: ids.variantA, availability: "HIDDEN" }),
    );

    const hideLast = expectError(
      await updateVariant(owner, { id: ids.variantB, availability: "HIDDEN" }),
    );
    expect(hideLast).toMatchObject({ code: "rule", field: "availability" });
    expect(hideLast.message).toContain("variante visível");

    const deleteLast = expectError(
      await softDeleteVariant(owner, { id: ids.variantB }),
    );
    expect(deleteLast.code).toBe("rule");

    const unlink = expectError(
      await unlinkProductMedia(owner, { id: ids.main }),
    );
    expect(unlink).toMatchObject({ code: "rule", field: "slot" });

    // Trocar o arquivo da imagem principal continua permitido.
    expectOk(
      await updateProductMedia(owner, { id: ids.main, altText: "Outra vista" }),
    );
    expectOk(
      await updateVariant(owner, {
        id: ids.variantA,
        availability: "AVAILABLE",
      }),
    );
  });

  it("não exclui categoria nem família com produtos ativos", async () => {
    const category = expectError(
      await softDeleteCategory(owner, { id: ids.category }),
    );
    expect(category.code).toBe("rule");
    expect(category.message).toContain(
      "categoria tem famílias ou produtos ativos",
    );

    const family = expectError(
      await softDeleteFamily(owner, { id: ids.family }),
    );
    expect(family.message).toContain("família tem produtos ativos");
  });

  it("ordena variantes e especificações", async () => {
    expect(
      expectOk(
        await reorderVariants(owner, {
          productId: ids.product,
          orderedIds: [ids.variantB, ids.variantA],
        }),
      ),
    ).toEqual({ updated: 2 });

    const tela = expectOk(
      await createSpec(owner, {
        productId: ids.product,
        groupName: "Tela",
        label: "Tamanho",
        value: '6,9"',
      }),
    );
    const chip = expectOk(
      await createSpec(owner, {
        productId: ids.product,
        groupName: "Chip",
        label: "Modelo",
        value: "A19 Pro",
      }),
    );
    expectOk(
      await reorderSpecs(owner, {
        productId: ids.product,
        orderedIds: [chip.id, tela.id],
      }),
    );

    const invalid = expectError(
      await reorderSpecs(owner, {
        productId: ids.product,
        orderedIds: [chip.id],
      }),
    );
    expect(invalid).toMatchObject({ code: "validation", field: "orderedIds" });

    const product = await getPublicProduct(
      publicClient(),
      supabaseUrl(),
      productSlug,
    );
    expect(product?.variants.map((variant) => variant.id)).toEqual([
      ids.variantB,
      ids.variantA,
    ]);
    expect(product?.specs.map((group) => group.name)).toEqual(["Chip", "Tela"]);
  });

  it("publicação fica registrada na auditoria com o autor", async () => {
    const { data } = await owner
      .from("audit_logs")
      .select("operation, actor_role")
      .eq("entity_type", "products")
      .eq("entity_id", ids.product)
      .eq("operation", "PUBLISH");
    expect(data).toEqual([{ operation: "PUBLISH", actor_role: "OWNER" }]);
  });

  it("traduz conflitos e regras do banco em mensagens por campo", async () => {
    const duplicated = expectError(
      await createProduct(owner, {
        categoryId: ids.category,
        familyId: ids.family,
        name: "Outro",
        slug: productSlug,
      }),
    );
    expect(duplicated).toEqual({
      code: "conflict",
      field: "slug",
      message: "Já existe um produto com este endereço (slug).",
    });

    const reserved = expectError(
      await createCategory(owner, { name: "Produto", slug: "produto" }),
    );
    expect(reserved).toMatchObject({ code: "validation", field: "slug" });

    const other = expectOk(
      await createCategory(owner, {
        name: `Outra ${suffix}`,
        slug: `outra-${suffix}`,
      }),
    );
    ids.otherCategory = other.id;
    const mismatch = expectError(
      await updateProduct(owner, {
        id: ids.product,
        categoryId: other.id,
        familyId: ids.family,
      }),
    );
    expect(mismatch).toMatchObject({ code: "conflict", field: "familyId" });
  });

  it("despublica e exclui na ordem permitida (limpeza)", async () => {
    expectOk(
      await setProductStatus(owner, { id: ids.product, status: "REVIEWED" }),
    );
    expect(
      await getPublicProduct(publicClient(), supabaseUrl(), productSlug),
    ).toBeNull();

    expectOk(await softDeleteProduct(owner, { id: ids.product }));
    expectOk(await softDeleteFamily(owner, { id: ids.family }));
    expectOk(await softDeleteCategory(owner, { id: ids.category }));
    expectOk(await softDeleteCategory(owner, { id: ids.otherCategory }));

    // Restaurar e excluir de novo funciona (soft delete reversível).
    expectOk(await restoreCategory(owner, { id: ids.otherCategory }));
    expectOk(await softDeleteCategory(owner, { id: ids.otherCategory }));
  });
});

describe("recusas", () => {
  it("usuário sem perfil não escreve", async () => {
    const visitor = await sessionClient(SEED_VISITOR);

    const create = expectError(
      await createCategory(visitor, {
        name: "Invasora",
        slug: `invasora-${uniqueSuffix()}`,
      }),
    );
    expect(create.code).toBe("forbidden");

    const { data: seedProduct } = await publicClient()
      .from("products")
      .select("id")
      .eq("slug", "produto-de-teste-publicado")
      .single();
    const update = expectError(
      await updateProduct(visitor, {
        id: seedProduct?.id ?? "",
        name: "Alterado",
      }),
    );
    expect(update.code).toBe("not_found");
  });

  it("anônimo não vê rascunho nem escreve", async () => {
    const anon = publicClient();
    const { data } = await anon
      .from("products")
      .select("slug")
      .eq("slug", "produto-de-teste");
    expect(data).toEqual([]);

    const create = expectError(
      await createCategory(anon, {
        name: "Anônima",
        slug: `anonima-${uniqueSuffix()}`,
      }),
    );
    expect(create.code).toBe("forbidden");
  });
});
