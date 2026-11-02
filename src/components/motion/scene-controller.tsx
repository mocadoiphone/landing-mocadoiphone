"use client";

import { useEffect, useRef } from "react";

import { setupMotionScene, type MotionScene } from "@/lib/motion/scenes";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

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
    return setupMotionScene(scene, root);
  }, [scene]);

  return <span ref={marker} hidden aria-hidden="true" />;
}
