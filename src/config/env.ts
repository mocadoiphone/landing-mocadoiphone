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

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
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
