export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type MatchMediaHost = {
  matchMedia: (query: string) => { matches: boolean };
};

/**
 * Movimento e uma melhoria progressiva: sem matchMedia (SSR, navegador antigo
 * ou teste) o comportamento seguro e mostrar tudo sem animacao.
 */
export function prefersReducedMotion(host?: MatchMediaHost): boolean {
  const target =
    host ??
    (typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window
      : null);

  return target ? target.matchMedia(REDUCED_MOTION_QUERY).matches : true;
}
