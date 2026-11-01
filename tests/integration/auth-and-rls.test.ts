import { createClient } from "@supabase/supabase-js";
import { describe, expect, inject, it } from "vitest";

import { type Database } from "@/types/database";

// Testes contra a API real do Supabase LOCAL (Auth + PostgREST + RLS),
// usando os dados de supabase/seed.sql. Requer `npm run db:reset` antes.
const SEED_PASSWORD = "Moca-Dev-2026";

function newClient() {
  return createClient<Database>(inject("supabaseUrl"), inject("supabaseKey"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email: string) {
  const client = newClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: SEED_PASSWORD,
  });
  if (error) throw error;
  return { client, userId: data.user.id };
}

describe("API pública (anônimo)", () => {
  it("lê produto publicado e não lê rascunho", async () => {
    const { data, error } = await newClient()
      .from("products")
      .select("slug")
      .in("slug", ["produto-de-teste", "produto-de-teste-publicado"]);

    expect(error).toBeNull();
    expect(data?.map((product) => product.slug)).toEqual([
      "produto-de-teste-publicado",
    ]);
  });

  it("lê configuração pública e não lê a privada", async () => {
    const { data } = await newClient()
      .from("site_settings")
      .select("key")
      .order("key");

    expect(data?.map((setting) => setting.key)).toEqual([
      "footer",
      "store",
      "whatsapp",
    ]);
  });

  it("não escreve", async () => {
    const { error } = await newClient()
      .from("categories")
      .insert({ name: "Invasora", slug: "invasora" });

    expect(error?.code).toBe("42501");
  });

  it("não acessa perfis administrativos nem auditoria", async () => {
    const client = newClient();
    const profiles = await client.from("admin_profiles").select("user_id");
    const logs = await client.from("audit_logs").select("id");

    expect(profiles.error?.code).toBe("42501");
    expect(logs.error?.code).toBe("42501");
  });

  it("cadastro público de usuários está desativado", async () => {
    const { data, error } = await newClient().auth.signUp({
      email: `novo-${Date.now()}@local.test`,
      password: "Senha-Forte-2026",
    });

    // Código específico: falha por cadastro bloqueado, não por e-mail desligado.
    expect(error?.code).toBe("signup_disabled");
    expect(data.user).toBeNull();
  });
});

describe("Autenticação administrativa", () => {
  it("senha errada é recusada com invalid_credentials", async () => {
    const { error } = await newClient().auth.signInWithPassword({
      email: "dono@local.test",
      password: "senha-errada",
    });

    expect(error?.code).toBe("invalid_credentials");
  });

  it("OWNER entra, vê o próprio perfil e os rascunhos", async () => {
    const { client, userId } = await signIn("dono@local.test");

    const { data: profile } = await client
      .from("admin_profiles")
      .select("role, is_active")
      .eq("user_id", userId)
      .single();
    const { data: drafts } = await client
      .from("products")
      .select("slug")
      .eq("status", "DRAFT");

    expect(profile).toEqual({ role: "OWNER", is_active: true });
    expect(drafts?.map((product) => product.slug)).toContain(
      "produto-de-teste",
    );
  });

  it("usuário sem perfil entra, mas não administra", async () => {
    const { client } = await signIn("visitante@local.test");

    const { data: profiles } = await client
      .from("admin_profiles")
      .select("user_id");
    const { data: drafts } = await client
      .from("products")
      .select("slug")
      .eq("status", "DRAFT");
    const { error: insertError } = await client
      .from("categories")
      .insert({ name: "Sem perfil", slug: "sem-perfil" });

    expect(profiles).toEqual([]);
    expect(drafts).toEqual([]);
    expect(insertError?.code).toBe("42501");
  });

  it("alteração feita pelo OWNER é auditada com o autor", async () => {
    const { client, userId } = await signIn("dono@local.test");
    const marker = `integracao-${Date.now()}`;

    const { data: category, error } = await client
      .from("categories")
      .update({ description: marker })
      .eq("slug", "acessorios")
      .select("id")
      .single();
    expect(error).toBeNull();
    if (!category) throw new Error("Categoria do seed não encontrada.");

    const { data: logs } = await client
      .from("audit_logs")
      .select("actor_user_id, operation, new_value")
      .eq("entity_type", "categories")
      .eq("entity_id", category.id)
      .order("created_at", { ascending: false })
      .limit(1);

    expect(logs?.[0]).toMatchObject({
      actor_user_id: userId,
      operation: "UPDATE",
      new_value: { description: marker },
    });

    await client
      .from("categories")
      .update({ description: null })
      .eq("id", category.id);
  });
});
