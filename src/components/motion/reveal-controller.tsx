"use client";

import { useEffect, useRef } from "react";

import { setupReveal } from "@/lib/motion/reveal";

export function RevealController({
  target = "parent",
}: {
  target?: "parent" | "previous";
}) {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element =
      target === "previous"
        ? marker.current?.previousElementSibling
        : marker.current?.parentElement;
    return element instanceof HTMLElement ? setupReveal(element) : undefined;
  }, [target]);

  return <span ref={marker} hidden aria-hidden="true" />;
}
