import { motionRuntime } from "./gsap";
import { type MotionCleanup } from "./reveal";

/**
 * Cena principal da Home. Desktop recebe pinning e scrub; abaixo de 1024 px a
 * mesma informacao entra em fluxo normal, sem scroll artificial.
 */
export function setupStickyProduct(root: HTMLElement): MotionCleanup {
  const { gsap } = motionRuntime();
  const media = root.querySelector("[data-motion-story-media]");
  const stage = root.querySelector("[data-motion-story-stage]");
  const copy = root.querySelector("[data-motion-story-copy]");
  const items = root.querySelectorAll("[data-motion-story-item]");
  const matchMedia = gsap.matchMedia();

  matchMedia.add(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    () => {
      if (!stage) return undefined;
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top+=56",
            end: "+=120%",
            pin: stage,
            pinSpacing: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        if (media) {
          timeline.fromTo(
            media,
            { scale: 0.92, yPercent: 5 },
            { scale: 1.03, yPercent: -3, duration: 1 },
            0,
          );
        }
        if (copy) {
          timeline.fromTo(
            copy,
            { y: 36, autoAlpha: 0.55 },
            { y: 0, autoAlpha: 1, duration: 0.45 },
            0,
          );
        }
        if (items.length > 0) {
          timeline.fromTo(
            items,
            { y: 24, autoAlpha: 0.22 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.28,
              stagger: 0.12,
            },
            0.28,
          );
        }
      }, root);
      root.dataset.motionMode = "desktop";
      return () => {
        context.revert();
        delete root.dataset.motionMode;
      };
    },
  );

  matchMedia.add(
    "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    () => {
      const context = gsap.context(() => {
        gsap.from([media, copy, ...items].filter(Boolean), {
          autoAlpha: 0,
          y: 24,
          duration: 0.65,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
          scrollTrigger: {
            trigger: root,
            start: "top 82%",
            once: true,
          },
        });
      }, root);
      root.dataset.motionMode = "mobile";
      return () => {
        context.revert();
        delete root.dataset.motionMode;
      };
    },
  );

  return () => matchMedia.revert();
}
