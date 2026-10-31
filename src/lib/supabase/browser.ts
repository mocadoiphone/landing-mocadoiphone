import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "@/config/env";
import { type Database } from "@/types/database";

/**
 * Cliente Supabase do navegador (Client Components).
 * Usa SOMENTE a chave pública; tudo que ele lê ou escreve passa pela RLS.
 * A sessão fica em cookies, compartilhada com o servidor.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
