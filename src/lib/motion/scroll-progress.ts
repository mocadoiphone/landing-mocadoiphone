import { type ScrollTrigger } from "gsap/ScrollTrigger";

/** Configuracao comum: progresso suave, sem alterar o scroll nativo. */
export function scrollProgress(
  trigger: Element,
  overrides: Partial<ScrollTrigger.Vars> = {},
): ScrollTrigger.Vars {
  return {
    trigger,
    start: "top 82%",
    end: "bottom 28%",
    scrub: 0.6,
    invalidateOnRefresh: true,
    ...overrides,
  };
}
