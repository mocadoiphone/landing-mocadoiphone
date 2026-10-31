import { createClient } from "@supabase/supabase-js";
import { inject } from "vitest";

import { type Database } from "@/types/database";

// Usuários e senha do seed LOCAL (supabase/seed.sql). Nunca usados no remoto:
// o global-setup recusa qualquer endereço que não seja local.
export const SEED_PASSWORD = "Moca-Dev-2026";
export const SEED_OWNER = "dono@local.test";
export const SEED_VISITOR = "visitante@local.test";

export function supabaseUrl(): string {
  return inject("supabaseUrl");
}

/** Cliente anônimo (o mesmo que o site público usa). */
export function publicClient() {
  return createClient<Database>(inject("supabaseUrl"), inject("supabaseKey"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente com a sessão de um usuário do seed (como as Server Actions do painel). */
export async function sessionClient(email: string) {
  const client = publicClient();
  const { error } = await client.auth.signInWithPassword({
    email,
    password: SEED_PASSWORD,
  });
  if (error) throw error;
  return client;
}

/** Sufixo para slugs únicos: os testes podem rodar várias vezes sem reset. */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
