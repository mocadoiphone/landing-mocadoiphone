import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabaseEnv } from "@/config/env";
import { type Database } from "@/types/database";

/**
 * Cliente Supabase para LEITURA PÚBLICA (MDI-D011): sem cookies e sem sessão,
 * só com a chave pública. Enxerga exatamente o que a RLS libera para o anônimo,
 * então o resultado pode ser cacheado e servido a qualquer visitante sem risco
 * de expor rascunho visto por um administrador.
 */
export function createSupabasePublicClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
