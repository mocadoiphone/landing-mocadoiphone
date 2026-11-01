import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type CatalogResult } from "@/lib/catalog/result";
import { homeBlockCreateInput, homeBlockUpdateInput } from "@/lib/home/blocks";
import { footerSettingsInput, storeSettingsInput } from "@/lib/site/settings";
import {
  updateFooterSettings,
  updateStoreSettings,
} from "@/services/admin/mutations";
import { getAdminSettings, listMediaLibrary } from "@/services/admin/queries";
import { type CatalogClient } from "@/services/catalog/mutations/shared";
import { listAdminHomeBlocks } from "@/services/home/admin-queries";
import {
  createHomeBlock,
  deleteHomeBlock,
  reorderHomeBlocks,
  setHomeBlockActive,
  updateHomeBlock,
} from "@/services/home/mutations";
import { loadPublicHome } from "@/services/home/public-queries";
import { loadSiteChrome } from "@/services/site/public-queries";

import {
  publicClient,
  SEED_OWNER,
  SEED_VISITOR,
  sessionClient,
  supabaseUrl,
  uniqueSuffix,
} from "./helpers";

// Home administrável, loja física e rodapé contra o Supabase LOCAL (MDI-D030, D031).
const SEED_CONTENT_EDITOR = "conteudo@local.test";
const SEED_GENERAL_MESSAGE =
  "Olá! Vim pelo site da Moça do iPhone e gostaria de atendimento.";

function expectOk<T>(result: CatalogResult<T>): T {
  if (!result.ok)
    throw new Error(
      `Esperava sucesso: ${result.error.code} ${result.error.message}`,
    );
  return result.data;
}

function expectError<T>(result: CatalogResult<T>) {
  if (result.ok) throw new Error("Esperava erro, veio sucesso.");
  return result.error;
}

let owner: CatalogClient;
let editor: CatalogClient;
let visitor: CatalogClient;

beforeAll(async () => {
  [owner, editor, visitor] = await Promise.all([
    sessionClient(SEED_OWNER),
    sessionClient(SEED_CONTENT_EDITOR),
    sessionClient(SEED_VISITOR),
  ]);
});

async function productId(slug: string): Promise<string> {
  const { data } = await owner
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();
  return data?.id ?? "";
}

describe("blocos da Home (núcleo das Server Actions)", () => {
  const created: string[] = [];

  afterAll(async () => {
    for (const id of created) await deleteHomeBlock(owner, { id });
  });

  it("CONTENT_EDITOR cria bloco inativo; o site só o mostra depois de ativado", async () => {
    const title = `Chamada ${uniqueSuffix()}`;
    const block = expectOk(
      await createHomeBlock(
        editor,
        homeBlockCreateInput.parse({
          type: "CTA",
          theme: "DARK",
          title,
          primaryCta: { label: "Loja", target: "STORE" },
        }),
      ),
    );
    created.push(block.id);

    let home = await loadPublicHome(publicClient(), supabaseUrl());
    expect(home.blocks.map((item) => item.title)).not.toContain(title);

    expectOk(
      await setHomeBlockActive(editor, { id: block.id, isActive: true }),
    );
    home = await loadPublicHome(publicClient(), supabaseUrl());
    expect(home.blocks.find((item) => item.title === title)).toMatchObject({
      type: "CTA",
      theme: "dark",
      ctas: [{ label: "Loja", href: "/loja", external: false }],
    });
  });

  it("bloco com produto em rascunho some do site até apontar para um publicado", async () => {
    const title = `História ${uniqueSuffix()}`;
    const block = expectOk(
      await createHomeBlock(
        owner,
        homeBlockCreateInput.parse({
          type: "PRODUCT_STORY",
          theme: "LIGHT",
          title,
          isActive: true,
          productId: await productId("produto-de-teste"),
        }),
      ),
    );
    created.push(block.id);
    let home = await loadPublicHome(publicClient(), supabaseUrl());
    expect(home.blocks.map((item) => item.title)).not.toContain(title);

    const warnings = (await listAdminHomeBlocks(owner)).find(
      (item) => item.id === block.id,
    )?.warnings;
    expect(warnings?.[0]).toContain("não está publicado");

    expectOk(
      await updateHomeBlock(
        owner,
        homeBlockUpdateInput.parse({
          id: block.id,
          type: "PRODUCT_STORY",
          theme: "LIGHT",
          title,
          isActive: true,
          productId: await productId("produto-com-variantes"),
          primaryCta: { label: "Ver", target: "PRODUCT" },
        }),
      ),
    );
    home = await loadPublicHome(publicClient(), supabaseUrl());
    const story = home.blocks.find((item) => item.title === title);
    expect(story?.product?.slug).toBe("produto-com-variantes");
    expect(story?.ctas[0]?.href).toBe("/produto/produto-com-variantes");
  });

  it("reordena os blocos", async () => {
    const ids = (await listAdminHomeBlocks(owner)).map((block) => block.id);
    const reversed = [...ids].reverse();
    expectOk(await reorderHomeBlocks(owner, { orderedIds: reversed }));
    expect((await listAdminHomeBlocks(owner)).map((block) => block.id)).toEqual(
      reversed,
    );
    expectOk(await reorderHomeBlocks(owner, { orderedIds: ids }));
  });

  it("conta sem perfil não cria blocos (RLS)", async () => {
    const refused = expectError(
      await createHomeBlock(
        visitor,
        homeBlockCreateInput.parse({
          type: "CTA",
          theme: "LIGHT",
          title: "Invasor",
          primaryCta: { label: "Loja", target: "STORE" },
        }),
      ),
    );
    expect(refused.code).toBe("forbidden");
  });

  it("seed: hero com produto publicado, grade de lançamentos e loja", async () => {
    const home = await loadPublicHome(publicClient(), supabaseUrl());
    expect(home.isFallback).toBe(false);
    const hero = home.blocks.find((block) => block.type === "HERO_PRODUCT");
    expect(hero?.product?.slug).toBe("produto-com-variantes");
    const whatsapp = hero?.ctas.find((cta) => cta.target === "WHATSAPP");
    expect(whatsapp?.external).toBe(true);
    expect(
      decodeURIComponent(whatsapp?.href.split("text=")[1] ?? ""),
    ).toContain("Produto com variantes");
    const grid = home.blocks.find((block) => block.type === "PRODUCT_GRID");
    expect(grid?.products.map((product) => product.slug)).toContain(
      "produto-com-variantes",
    );
    const store = home.blocks.find((block) => block.type === "STORE");
    expect(store?.store?.addressLines).toContain("Rua Fictícia, 100");
  });
});

describe("loja física e rodapé (site_settings)", () => {
  let original: Awaited<ReturnType<typeof getAdminSettings>>;

  beforeAll(async () => {
    original = await getAdminSettings(owner);
  });

  afterAll(async () => {
    // Restaura o seed: os valores lidos já estão no formato do painel.
    await updateStoreSettings(owner, storeSettingsInput.parse(original.store));
    await updateFooterSettings(
      owner,
      footerSettingsInput.parse({
        ...original.footer,
        socialLinks: original.footer.socialLinks.map(({ network, url }) => ({
          network,
          url,
        })),
      }),
    );
  });

  it("OWNER salva a loja; o site mostra endereço, horários, mapa e atendimento", async () => {
    const library = await listMediaLibrary(owner);
    const image = library.find(
      (item) => item.kind === "IMAGE" && !item.isDeleted,
    );
    expectOk(
      await updateStoreSettings(
        owner,
        storeSettingsInput.parse({
          name: "Loja do teste",
          addressLine: "Avenida Teste, 10",
          city: "Cidade — SP",
          hours: [{ label: "Todos os dias", value: "9h às 21h" }],
          mapUrl: "https://maps.app.goo.gl/teste",
          photoIds: image ? [image.id] : [],
        }),
      ),
    );

    const chrome = await loadSiteChrome(publicClient(), supabaseUrl(), 2026);
    expect(chrome.store).toMatchObject({
      name: "Loja do teste",
      addressLines: ["Avenida Teste, 10", "Cidade — SP"],
      hours: [{ label: "Todos os dias", value: "9h às 21h" }],
      mapUrl: "https://maps.app.goo.gl/teste",
    });
    expect(
      decodeURIComponent(chrome.store.whatsappUrl?.split("text=")[1] ?? ""),
    ).toBe(SEED_GENERAL_MESSAGE);

    if (image) {
      expect(chrome.store.photos).toHaveLength(1);
      const usage = (await listMediaLibrary(owner)).find(
        (item) => item.id === image.id,
      );
      expect(usage?.usages.map((item) => item.label)).toContain("Loja física");
    }
  });

  it("rodapé: redes, dados legais e copyright padrão com o ano", async () => {
    expectOk(
      await updateFooterSettings(
        owner,
        footerSettingsInput.parse({
          about: "Sobre a loja",
          socialLinks: [
            { network: "TIKTOK", url: "https://www.tiktok.com/@teste" },
          ],
          legalName: "Empresa Teste LTDA",
          copyright: "",
        }),
      ),
    );
    const chrome = await loadSiteChrome(publicClient(), supabaseUrl(), 2031);
    expect(chrome.footer).toMatchObject({
      about: "Sobre a loja",
      socialLinks: [
        {
          network: "TIKTOK",
          label: "TikTok",
          url: "https://www.tiktok.com/@teste",
        },
      ],
      legalName: "Empresa Teste LTDA",
      copyrightLine: "© 2031 Moça do iPhone. Todos os direitos reservados.",
    });
    expect(chrome.categories.length).toBeGreaterThan(0);
    expect(chrome.hasLaunches).toBe(true);
    expect(chrome.contact.whatsappUrl).toMatch(
      /^https:\/\/wa\.me\/5500000000000\?text=/,
    );
  });

  it("CONTENT_EDITOR não altera a loja (RLS: OWNER e ADMIN)", async () => {
    const refused = expectError(
      await updateStoreSettings(
        editor,
        storeSettingsInput.parse({ name: "Invasor" }),
      ),
    );
    expect(refused.code).toBe("forbidden");
  });
});
