import { type gsap as GsapType } from "gsap";

type Gsap = typeof GsapType;

/** Parallax curto, sempre baseado em transform e sincronizado ao scroll. */
export function parallaxMedia(
  gsap: Gsap,
  media: Element,
  trigger: Element,
  distance = 8,
) {
  return gsap.fromTo(
    media,
    { yPercent: -distance / 2, scale: 1.04 },
    {
      yPercent: distance / 2,
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.7,
      },
    },
  );
}
