import "server-only";

import { cache } from "react";

import { type AdminRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminContext =
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | null }
  | {
      status: "authorized";
      userId: string;
      email: string | null;
      role: AdminRole;
      displayName: string;
    };

/**
 * Identifica o usuário da requisição e o seu perfil administrativo (MDI-D008).
 *
 * - A identidade vem do JWT validado (`getClaims`), nunca de dado enviado pelo cliente.
 * - O perfil é lido com a sessão do próprio usuário: a RLS só devolve o perfil
 *   dele, e o banco revalida o token em toda consulta.
 *
 * Deduplicado por requisição com React `cache`.
 */
export const getAdminContext = cache(async (): Promise<AdminContext> => {
  const supabase = await createSupabaseServerClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  if (claimsError || !claimsData) {
    return { status: "anonymous" };
  }

  const { sub: userId, email } = claimsData.claims;

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("role, display_name, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível verificar o perfil administrativo.", {
      cause: error,
    });
  }

  if (!profile || !profile.is_active) {
    return { status: "forbidden", email: email ?? null };
  }

  return {
    status: "authorized",
    userId,
    email: email ?? null,
    role: profile.role,
    displayName: profile.display_name,
  };
});
