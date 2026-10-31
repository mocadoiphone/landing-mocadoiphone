import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseEnv } from "@/config/env";
import { type Database } from "@/types/database";

/**
 * Cliente Supabase do servidor (Server Components, Server Actions, Route Handlers).
 * Usa a sessão do usuário via cookies e a chave pública: a RLS se aplica
 * e `auth.uid()` chega aos triggers de auditoria (MDI-D008).
 * Crie um cliente por requisição; nunca compartilhe entre usuários.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
