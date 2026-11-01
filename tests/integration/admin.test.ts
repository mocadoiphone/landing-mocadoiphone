import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type CatalogResult } from "@/lib/catalog/result";
import {
  createContact,
  grantAdminProfile,
  reorderContacts,
  setDefaultContact,
  softDeleteContact,
  updateAdminProfile,
  updateContact,
  updateWhatsappSettings,
} from "@/services/admin/mutations";
import {
  getAdminSettings,
  getDashboard,
  getProductEditor,
  listAdminCategories,
  listAdminContacts,
  listAdminProducts,
  listAdminUsers,
  listMediaLibrary,
} from "@/services/admin/queries";
import { type CatalogClient } from "@/services/catalog/mutations/shared";
import { getPublicWhatsAppConfig } from "@/services/catalog/public-queries";
import {
  finalizeMediaUpload,
  prepareMediaUpload,
} from "@/services/media/upload";

import {
  publicClient,
  SEED_OWNER,
  SEED_VISITOR,
  sessionClient,
  supabaseUrl,
  uniqueSuffix,
} from "./helpers";

// Núcleo das telas do painel contra o Supabase LOCAL (seed de supabase/seed.sql).
const SEED_TEMPLATE =
  "Olá! Vi no site da Moça do iPhone o {produto} {variante} e gostaria de consultar disponibilidade e valor.";

// PNG 1×1 válido e um "PNG" falso (HTML com extensão de imagem).
const PNG_1X1 = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (char) => char.charCodeAt(0),
);
const FAKE_PNG = new TextEncoder().encode(
  "<!doctype html><script>alert(1)</script>",
);

function expectOk<T>(result: CatalogResult<T>): T {
  if (!result.ok)
    throw new Error(
      `Esperava sucesso: ${result.error.code} ${result.error.message}`,
    );
  return result.data;
}

function expectError<T>(result: CatalogResult<T>) {
  if (result.ok) throw new Error("Esperava erro, mas a operação teve sucesso.");
  return result.error;
}

let owner: CatalogClient;
let visitor: CatalogClient;

beforeAll(async () => {
  owner = await sessionClient(SEED_OWNER);
  visitor = await sessionClient(SEED_VISITOR);
});

describe("leituras do painel", () => {
  it("lista produtos com estado administrativo e calcula o dashboard", async () => {
    const products = await listAdminProducts(owner);
    const slugs = products.map((product) => product.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "produto-de-teste",
        "produto-de-teste-publicado",
      ]),
    );

    const dashboard = await getDashboard(owner, "OWNER");
    expect(dashboard.metrics.published).toBeGreaterThanOrEqual(1);
    expect(dashboard.metrics.withoutPrice).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(dashboard.recent)).toBe(true);
  });

  it("editor mostra as pendências de publicação antes de publicar", async () => {
    const products = await listAdminProducts(owner);
    const draft = products.find(
      (product) => product.slug === "produto-de-teste",
    );
    const published = products.find(
      (product) => product.slug === "produto-de-teste-publicado",
    );

    const draftEditor = await getProductEditor(owner, draft?.id ?? "");
    expect(draftEditor?.publicationIssues).toEqual(["no_main_image"]);
    expect(draftEditor?.categories.map((category) => category.name)).toContain(
      "iPhone",
    );

    const publishedEditor = await getProductEditor(owner, published?.id ?? "");
    expect(publishedEditor?.publicationIssues).toEqual([]);
    expect(publishedEditor?.media[0]?.slot).toBe("MAIN");
  });

  it("categorias trazem famílias e contagem de produtos ativos", async () => {
    const categories = await listAdminCategories(owner);
    const iphone = categories.find((category) => category.slug === "iphone");
    expect(iphone?.productCount).toBeGreaterThanOrEqual(2);
    expect(iphone?.families.map((family) => family.name)).toContain(
      "Família de teste",
    );
  });

  it("biblioteca de mídia mostra onde cada arquivo é usado", async () => {
    const library = await listMediaLibrary(owner);
    const seedImage = library.find(
      (item) => item.storagePath === "products/seed/produto-de-teste.webp",
    );
    expect(seedImage?.usages.map((usage) => usage.label)).toContain(
      "Produto: Produto de teste publicado",
    );
  });

  it("usuários do painel com e-mail: OWNER vê, usuário sem perfil não", async () => {
    const users = await listAdminUsers(owner);
    expect(users.find((user) => user.email === SEED_OWNER)?.role).toBe("OWNER");
    await expect(listAdminUsers(visitor)).rejects.toThrow();
  });
});

describe("contatos e configurações (Brain §13, §14)", () => {
  const originalDefault = { id: "" };

  afterAll(async () => {
    // Restaura o estado do seed para os demais testes.
    if (originalDefault.id)
      await setDefaultContact(owner, { id: originalDefault.id });
    await updateWhatsappSettings(owner, {
      messageTemplate: SEED_TEMPLATE,
      leadOrigin: "Site",
    });
  });

  it("cria contato, troca o padrão de forma atômica e o site passa a usar o novo número", async () => {
    const before = await listAdminContacts(owner);
    originalDefault.id = before.find((contact) => contact.isDefault)?.id ?? "";

    const created = expectOk(
      await createContact(owner, {
        name: `Vendas ${uniqueSuffix()}`,
        whatsapp: "5511999990000",
        role: "Vendas",
      }),
    );
    expectOk(await setDefaultContact(owner, { id: created.id }));

    const config = await getPublicWhatsAppConfig(publicClient());
    expect(config.phone).toBe("5511999990000");

    const deactivate = expectError(
      await updateContact(owner, { id: created.id, isActive: false }),
    );
    expect(deactivate).toMatchObject({ field: "isActive" });
    expect(deactivate.message).toContain("contato padrão");

    expectOk(await setDefaultContact(owner, { id: originalDefault.id }));
    expectOk(await softDeleteContact(owner, { id: created.id }));
  });

  it("reordena contatos e recusa usuário sem perfil", async () => {
    const active = (await listAdminContacts(owner)).filter(
      (contact) => !contact.isDeleted,
    );
    expectOk(
      await reorderContacts(owner, {
        orderedIds: active.map((contact) => contact.id).reverse(),
      }),
    );
    const refused = expectError(
      await createContact(visitor, {
        name: "Invasor",
        whatsapp: "5511999990001",
      }),
    );
    expect(refused.code).toBe("forbidden");
  });

  it("template do WhatsApp salvo no painel chega à configuração pública", async () => {
    expectOk(
      await updateWhatsappSettings(owner, {
        messageTemplate: "Quero o {produto} {variante} ({origem})",
        leadOrigin: "Painel",
      }),
    );
    expect((await getAdminSettings(owner)).whatsapp.leadOrigin).toBe("Painel");
    expect((await getPublicWhatsAppConfig(publicClient())).template).toBe(
      "Quero o {produto} {variante} ({origem})",
    );
  });
});

describe("usuários do painel (sem service_role, MDI-D027)", () => {
  it("conceder exige login existente e não duplica perfil", async () => {
    const missing = expectError(
      await grantAdminProfile(owner, {
        email: `ninguem-${uniqueSuffix()}@local.test`,
        displayName: "Ninguém",
        role: "ADMIN",
      }),
    );
    expect(missing).toMatchObject({ code: "rule", field: "email" });

    const duplicated = expectError(
      await grantAdminProfile(owner, {
        email: SEED_OWNER,
        displayName: "Dono",
        role: "ADMIN",
      }),
    );
    expect(duplicated.message).toContain("já tem perfil");
  });

  it("ninguém altera o próprio papel (trava do banco com mensagem clara)", async () => {
    const users = await listAdminUsers(owner);
    const self = users.find((user) => user.email === SEED_OWNER);
    const error = expectError(
      await updateAdminProfile(owner, {
        userId: self?.userId ?? "",
        role: "ADMIN",
      }),
    );
    expect(error).toMatchObject({ code: "forbidden", field: "role" });
    expect(error.message).toContain("próprio papel");
  });
});

describe("envio de mídia (MDI-D026)", () => {
  it("prepara, envia direto ao Storage, confere o arquivo real e registra", async () => {
    const prepared = expectOk(
      await prepareMediaUpload(owner, {
        folder: "products",
        mimeType: "image/png",
        sizeBytes: PNG_1X1.length,
      }),
    );
    expect(prepared.path).toMatch(/^products\/[0-9a-f-]{36}\.png$/);

    const upload = await owner.storage
      .from("media")
      .uploadToSignedUrl(
        prepared.path,
        prepared.token,
        new Blob([PNG_1X1], { type: "image/png" }),
        {
          contentType: "image/png",
        },
      );
    expect(upload.error).toBeNull();

    const registered = expectOk(
      await finalizeMediaUpload(owner, supabaseUrl(), {
        storagePath: prepared.path,
        altText: "Imagem enviada pelo teste",
        width: 1,
        height: 1,
      }),
    );
    const library = await listMediaLibrary(owner);
    expect(library.find((item) => item.id === registered.id)).toMatchObject({
      mimeType: "image/png",
      sizeBytes: PNG_1X1.length,
      width: 1,
      height: 1,
    });
  });

  it("arquivo com conteúdo falso é recusado e apagado do Storage", async () => {
    const prepared = expectOk(
      await prepareMediaUpload(owner, {
        folder: "products",
        mimeType: "image/png",
        sizeBytes: FAKE_PNG.length,
      }),
    );
    await owner.storage
      .from("media")
      .uploadToSignedUrl(
        prepared.path,
        prepared.token,
        new Blob([FAKE_PNG], { type: "image/png" }),
        {
          contentType: "image/png",
        },
      );

    const refused = expectError(
      await finalizeMediaUpload(owner, supabaseUrl(), {
        storagePath: prepared.path,
        altText: "Falso",
        width: 1,
        height: 1,
      }),
    );
    expect(refused).toMatchObject({ code: "validation", field: "file" });
    expect(refused.message).toContain("não corresponde");

    const info = await owner.storage.from("media").info(prepared.path);
    expect(info.error).not.toBeNull();
  });

  it("recusa tamanho acima do limite, vídeo desativado e usuário sem perfil", async () => {
    const big = expectError(
      await prepareMediaUpload(owner, {
        folder: "products",
        mimeType: "image/jpeg",
        sizeBytes: 11 * 1024 * 1024,
      }),
    );
    expect(big.message).toContain("10 MB");

    const video = expectError(
      await prepareMediaUpload(owner, {
        folder: "products",
        mimeType: "video/mp4",
        sizeBytes: 1000,
      }),
    );
    expect(video.message).toContain("vídeo está desativado");

    const refused = expectError(
      await prepareMediaUpload(visitor, {
        folder: "products",
        mimeType: "image/png",
        sizeBytes: 10,
      }),
    );
    expect(refused.code).toBe("forbidden");
  });

  it("finalizar sem ter enviado o arquivo não registra nada", async () => {
    const error = expectError(
      await finalizeMediaUpload(owner, supabaseUrl(), {
        storagePath: `products/${crypto.randomUUID()}.png`,
        altText: "Inexistente",
        width: 1,
        height: 1,
      }),
    );
    expect(error.code).toBe("not_found");
  });
});
