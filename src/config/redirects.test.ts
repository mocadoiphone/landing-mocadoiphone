import { describe, expect, it } from "vitest";

import { legacyRedirects } from "./redirects";

describe("legacyRedirects", () => {
  it("mapeia as URLs antigas documentadas sem loops e com 301", () => {
    expect(legacyRedirects).toEqual(
      expect.arrayContaining([
        { source: "/macbook", destination: "/mac", statusCode: 301 },
        {
          source: "/applewatch",
          destination: "/apple-watch",
          statusCode: 301,
        },
        {
          source: "/apple-vision-pro",
          destination: "/vision-pro",
          statusCode: 301,
        },
      ]),
    );
    expect(new Set(legacyRedirects.map((item) => item.source)).size).toBe(
      legacyRedirects.length,
    );
    expect(
      legacyRedirects.every((item) => item.source !== item.destination),
    ).toBe(true);
  });
});
