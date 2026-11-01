/**
 * Links externos digitados no painel (mapa da loja, redes sociais). O painel não
 * aceita endereço livre: só `https://` e só os domínios esperados para cada uso,
 * para que um link do site nunca leve a `javascript:` ou a um domínio qualquer
 * (agente de segurança; Brain §18, "o admin seleciona, não escreve HTML").
 */

export const SOCIAL_NETWORKS = [
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "X",
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X (Twitter)",
};

const SOCIAL_HOSTS: Record<SocialNetwork, readonly string[]> = {
  INSTAGRAM: ["instagram.com"],
  FACEBOOK: ["facebook.com", "fb.com"],
  TIKTOK: ["tiktok.com"],
  YOUTUBE: ["youtube.com", "youtu.be"],
  X: ["x.com", "twitter.com"],
};

/** Mapas aceitos para "Como chegar". */
const MAP_HOSTS = [
  "google.com",
  "google.com.br",
  "goo.gl",
  "maps.app.goo.gl",
  "maps.apple.com",
  "waze.com",
] as const;

export const URL_MAX_LENGTH = 500;

/** O domínio é exatamente um dos aceitos ou um subdomínio dele (www., m.…). */
function hostMatches(hostname: string, allowed: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return allowed.some((root) => host === root || host.endsWith(`.${root}`));
}

/**
 * Devolve o endereço normalizado se for `https://`, sem usuário/senha e de um dos
 * domínios aceitos; senão `null`.
 */
export function safeExternalUrl(
  input: string,
  allowedHosts: readonly string[],
): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > URL_MAX_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password || url.port) return null;
  if (!hostMatches(url.hostname, allowedHosts)) return null;
  return url.toString();
}

export function safeMapUrl(input: string): string | null {
  return safeExternalUrl(input, MAP_HOSTS);
}

export function safeSocialUrl(
  network: SocialNetwork,
  input: string,
): string | null {
  return safeExternalUrl(input, SOCIAL_HOSTS[network]);
}
