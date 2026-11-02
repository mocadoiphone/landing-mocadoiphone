import { describe, expect, it } from "vitest";

import { REDUCED_MOTION_QUERY, prefersReducedMotion } from "./reduced-motion";

describe("prefersReducedMotion", () => {
  it("respeita a preferencia do sistema", () => {
    expect(
      prefersReducedMotion({
        matchMedia: (query) => ({
          matches: query === REDUCED_MOTION_QUERY,
        }),
      }),
    ).toBe(true);
  });

  it("permite movimento quando a preferencia nao esta ativa", () => {
    expect(
      prefersReducedMotion({ matchMedia: () => ({ matches: false }) }),
    ).toBe(false);
  });

  it("usa o fallback seguro quando matchMedia nao existe", () => {
    expect(prefersReducedMotion()).toBe(true);
  });
});
