"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import { type MotionScene } from "@/lib/motion/scenes";

export function SceneController({ scene }: { scene: MotionScene }) {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = marker.current?.closest<HTMLElement>("[data-motion-scene]");
    if (!root) return undefined;
    if (prefersReducedMotion()) {
      root.dataset.motionMode = "reduced";
      return () => {
        delete root.dataset.motionMode;
      };
    }

    let active = true;
    let cleanup: (() => void) | undefined;
    // GSAP e ScrollTrigger ficam em um chunk assíncrono e nem são baixados em
    // reduced motion. O HTML e a navegação não dependem deste carregamento.
    void import("@/lib/motion/scenes").then(({ setupMotionScene }) => {
      if (!active) return;
      cleanup = setupMotionScene(scene, root);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [scene]);

  return <span ref={marker} hidden aria-hidden="true" />;
}
