import { z } from "zod";

/**
 * Variáveis de ambiente públicas, validadas com Zod (MDI-D015).
 *
 * Nesta fase todas são opcionais: o projeto roda sem elas. Quem precisar do
 * Supabase (a partir da Etapa 02) deve chamar `requireSupabaseEnv()`, que falha
 * com mensagem clara se a configuração estiver ausente.
 *
 * Valores `NEXT_PUBLIC_*` são embutidos no bundle do navegador: aqui só entram
 * dados públicos. Segredos nunca recebem esse prefixo.
 */

// `.env.example` copiado sem preencher gera strings vazias: tratamos como ausentes.
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

// Trava permanente: chave privilegiada em variável pública iria para o navegador
// e ignoraria toda a RLS. Lista de PERMITIDOS — só passa uma chave pública íntegra:
//   - `sb_publishable_…` (chave nova), ou
//   - JWT legado com exatamente 3 segmentos e role `anon`.
// Qualquer segmento com role `service_role` (inclusive colado a outra chave)
// é tratado como segredo.
export type SupabaseKeyKind = "publishable" | "anon-jwt" | "secret" | "invalid";

function jwtRole(segment: string): unknown {
  try {
    const claims: unknown = JSON.parse(
      atob(segment.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof claims === "object" && claims !== null && "role" in claims
      ? claims.role
      : undefined;
  } catch {
    return undefined;
  }
}

export function classifySupabaseKey(key: string): SupabaseKeyKind {
  if (key.startsWith("sb_secret_")) return "secret";
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return "publishable";

  const segments = key.split(".");
  if (segments.some((segment) => jwtRole(segment) === "service_role")) {
    return "secret";
  }
  if (segments.length === 3 && jwtRole(segments[1] ?? "") === "anon") {
    return "anon-jwt";
  }
  return "invalid";
}

const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
      emptyToUndefined,
      z.url().optional(),
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .min(1)
        .superRefine((key, ctx) => {
          const kind = classifySupabaseKey(key);
          if (kind === "secret") {
            ctx.addIssue({
              code: "custom",
              message:
                "contém uma chave SECRETA (service_role/sb_secret). Use somente a chave pública anon ou publishable.",
            });
          } else if (kind === "invalid") {
            ctx.addIssue({
              code: "custom",
              message:
                "não é uma chave pública válida. Cole somente a chave anon (JWT) ou publishable (sb_publishable_…), completa e sem texto extra.",
            });
          }
        })
        .optional(),
    ),
    NEXT_PUBLIC_SITE_URL: z.preprocess(
      emptyToUndefined,
      z
        .url()
        .refine((value) => new URL(value).protocol === "https:", {
          message: "deve usar https://.",
        })
        .optional(),
    ),
    NEXT_PUBLIC_SITE_INDEXING_ENABLED: z.preprocess(
      emptyToUndefined,
      z.enum(["true", "false"]).optional(),
    ),
  })
  .superRefine((env, ctx) => {
    if (
      env.NEXT_PUBLIC_SITE_INDEXING_ENABLED === "true" &&
      !env.NEXT_PUBLIC_SITE_URL
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "é obrigatória quando NEXT_PUBLIC_SITE_INDEXING_ENABLED=true.",
      });
    }
  });

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
  source: Record<string, string | undefined>,
): PublicEnv {
  const result = publicEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

// Cada variável é lida literalmente: o Next só embute `process.env.NEXT_PUBLIC_X`
// escrito por extenso (acesso dinâmico ou desestruturado não é substituído).
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_INDEXING_ENABLED:
    process.env.NEXT_PUBLIC_SITE_INDEXING_ENABLED,
});

export type SupabaseEnv = { url: string; anonKey: string };

export function requireSupabaseEnv(env: PublicEnv = publicEnv): SupabaseEnv {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (veja .env.example).",
    );
  }
  return { url, anonKey };
}
