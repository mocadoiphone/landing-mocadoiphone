/**
 * Otimização de imagens do next/image para a mídia pública do Supabase (MDI-D032).
 * Só o caminho público do bucket `media` do projeto configurado é aceito: o
 * otimizador não busca imagem de nenhum outro endereço.
 *
 * Importado pelo `next.config.ts`: sem alias `@/`.
 */
type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

export type ImageSecurityConfig = {
  remotePatterns: RemotePattern[];
  /** Só para o Supabase local (desenvolvimento e E2E): o otimizador recusa IP local por padrão. */
  dangerouslyAllowLocalIP: boolean;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const MEDIA_PUBLIC_PATH = "/storage/v1/object/public/media/**";

export function supabaseImageConfig(
  supabaseUrl: string | undefined,
): ImageSecurityConfig {
  if (!supabaseUrl)
    return { remotePatterns: [], dangerouslyAllowLocalIP: false };
  const url = new URL(supabaseUrl);
  const protocol = url.protocol === "http:" ? "http" : "https";
  const isLocal = LOCAL_HOSTS.has(url.hostname);
  return {
    remotePatterns: [
      {
        protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: MEDIA_PUBLIC_PATH,
      },
    ],
    dangerouslyAllowLocalIP: isLocal,
  };
}
