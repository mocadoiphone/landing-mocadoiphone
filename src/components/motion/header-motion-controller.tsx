"use client";

import { useEffect, useRef } from "react";

export function HeaderMotionController() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = marker.current?.closest<HTMLElement>("header");
    if (!header) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      header.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      delete header.dataset.scrolled;
    };
  }, []);

  return <span ref={marker} hidden aria-hidden="true" />;
}
