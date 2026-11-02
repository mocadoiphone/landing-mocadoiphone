import { prefersReducedMotion } from "./reduced-motion";

export type MotionCleanup = () => void;

/** Reveal leve para grades e listagens; nao carrega GSAP. */
export function setupReveal(element: HTMLElement): MotionCleanup {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    element.dataset.motionState = "visible";
    return () => {
      delete element.dataset.motionState;
    };
  }

  element.dataset.motionState = "pending";
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      element.dataset.motionState = "visible";
      observer.disconnect();
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  observer.observe(element);

  return () => {
    observer.disconnect();
    delete element.dataset.motionState;
  };
}
