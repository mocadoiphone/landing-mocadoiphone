import { motionRuntime } from "./gsap";
import { parallaxMedia } from "./parallax";
import { type MotionCleanup } from "./reveal";
import { scrollProgress } from "./scroll-progress";
import { setupStickyProduct } from "./sticky-product";
import { revealText } from "./text-reveal";

export type MotionScene = "hero" | "story" | "media" | "text-media" | "product";

function setupHero(root: HTMLElement): MotionCleanup {
  const { gsap } = motionRuntime();
  const matchMedia = gsap.matchMedia();
  matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const context = gsap.context(() => {
      const parts = root.querySelectorAll("[data-motion-text-part]");
      const entries = root.querySelectorAll("[data-motion-entry]");
      const media = root.querySelector("[data-motion-hero-media]");
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (parts.length > 0) {
        timeline.from(parts, {
          autoAlpha: 0,
          yPercent: 90,
          duration: 0.85,
          stagger: 0.055,
          clearProps: "opacity,visibility,transform",
        });
      }
      if (entries.length > 0) {
        timeline.from(
          entries,
          {
            autoAlpha: 0,
            y: 22,
            duration: 0.6,
            stagger: 0.055,
            clearProps: "opacity,visibility,transform",
          },
          parts.length > 0 ? "-=0.45" : 0,
        );
      }
      if (media) {
        timeline.from(
          media,
          {
            autoAlpha: 0,
            y: 38,
            scale: 0.96,
            duration: 1,
            clearProps: "opacity,visibility,transform",
          },
          "-=0.35",
        );

        gsap.to(media, {
          yPercent: 6,
          scale: 0.95,
          ease: "none",
          scrollTrigger: scrollProgress(root, {
            start: "top top",
            end: "bottom top",
          }),
        });
      }
    }, root);
    root.dataset.motionMode = "enhanced";
    return () => {
      context.revert();
      delete root.dataset.motionMode;
    };
  });
  return () => matchMedia.revert();
}

function setupMedia(root: HTMLElement): MotionCleanup {
  const { gsap } = motionRuntime();
  const matchMedia = gsap.matchMedia();
  matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const context = gsap.context(() => {
      revealText(gsap, root.querySelectorAll("[data-motion-entry]"));
    }, root);
    return () => context.revert();
  });
  matchMedia.add(
    "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    () => {
      const context = gsap.context(() => {
        const media = root.querySelector("[data-motion-parallax]");
        if (media) parallaxMedia(gsap, media, root, 9);
      }, root);
      return () => context.revert();
    },
  );
  return () => matchMedia.revert();
}

function setupTextMedia(root: HTMLElement): MotionCleanup {
  const { gsap } = motionRuntime();
  const matchMedia = gsap.matchMedia();
  matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const context = gsap.context(() => {
      const text = root.querySelector("[data-motion-text]");
      const media = root.querySelector("[data-motion-parallax]");
      for (const target of [media, text]) {
        if (!target) continue;
        gsap.from(target, {
          autoAlpha: 0,
          y: 32,
          duration: 0.75,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
          scrollTrigger: { trigger: target, start: "top 84%", once: true },
        });
      }
    }, root);
    return () => context.revert();
  });
  matchMedia.add(
    "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    () => {
      const context = gsap.context(() => {
        const media = root.querySelector("[data-motion-parallax]");
        if (media) parallaxMedia(gsap, media, root, 5);
      }, root);
      return () => context.revert();
    },
  );
  return () => matchMedia.revert();
}

function setupProduct(root: HTMLElement): MotionCleanup {
  const { gsap } = motionRuntime();
  const matchMedia = gsap.matchMedia();
  matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const context = gsap.context(() => {
      const targets = root.querySelectorAll(
        "[data-motion-product-gallery], [data-motion-product-panel]",
      );
      gsap.from(targets, {
        autoAlpha: 0,
        y: 26,
        duration: 0.75,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "opacity,visibility,transform",
      });
    }, root);
    return () => context.revert();
  });
  return () => matchMedia.revert();
}

export function setupMotionScene(
  scene: MotionScene,
  root: HTMLElement,
): MotionCleanup {
  switch (scene) {
    case "hero":
      return setupHero(root);
    case "story":
      return setupStickyProduct(root);
    case "media":
      return setupMedia(root);
    case "text-media":
      return setupTextMedia(root);
    case "product":
      return setupProduct(root);
  }
}
