import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { requireSupabaseEnv } from "@/config/env";
import { type Database } from "@/types/database";

const LOGIN_PATH = "/admin/login";

/**
 * Renova a sessão do Supabase a cada navegação no /admin e redireciona
 * visitantes sem sessão para o login.
 *
 * Isto é conveniência de UX, NÃO a fronteira de segurança: a autorização real
 * é feita no servidor (layout/actions) e no banco (RLS).
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = requireSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Respostas que gravam cookie de sessão não podem ser cacheadas por CDN.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Valida o JWT e, se preciso, renova os cookies. Não remover.
  const { data } = await supabase.auth.getClaims();

  if (!data && request.nextUrl.pathname !== LOGIN_PATH) {
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}
