import { type gsap as GsapType } from "gsap";

type Gsap = typeof GsapType;

/** Entrada editorial compartilhada por titulos e textos de apoio. */
export function revealText(gsap: Gsap, targets: gsap.TweenTarget) {
  return gsap.from(targets, {
    autoAlpha: 0,
    y: 28,
    duration: 0.8,
    stagger: 0.07,
    ease: "power3.out",
    clearProps: "opacity,visibility,transform",
  });
}
