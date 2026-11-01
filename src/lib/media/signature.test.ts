import { describe, expect, it } from "vitest";

import { detectMimeType, extensionForMime, kindForMime } from "./signature";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === "string"
        ? [...part].map((char) => char.charCodeAt(0))
        : part,
    ),
  );

describe("detectMimeType", () => {
  it("reconhece JPEG, PNG e WEBP", () => {
    expect(detectMimeType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(
      detectMimeType(
        bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]),
      ),
    ).toBe("image/png");
    expect(detectMimeType(bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "))).toBe(
      "image/webp",
    );
  });

  it("distingue AVIF de MP4 pela marca do contêiner", () => {
    expect(
      detectMimeType(
        bytes([0, 0, 0, 28], "ftypavif", [0, 0, 0, 0], "avifmif1"),
      ),
    ).toBe("image/avif");
    expect(
      detectMimeType(
        bytes([0, 0, 0, 24], "ftypisom", [0, 0, 2, 0], "isomiso2"),
      ),
    ).toBe("video/mp4");
    expect(
      detectMimeType(
        bytes([0, 0, 0, 24], "ftypheic", [0, 0, 0, 0], "mif1heic"),
      ),
    ).toBeNull();
  });

  it("recusa conteúdo que não é mídia (ex.: HTML ou executável renomeado)", () => {
    expect(detectMimeType(bytes("<!doctype html>"))).toBeNull();
    expect(detectMimeType(bytes("MZ", [0x90, 0, 3, 0]))).toBeNull();
    expect(detectMimeType(new Uint8Array())).toBeNull();
  });
});

describe("extensão e tipo", () => {
  it("mapeia mime para extensão e tipo de mídia", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/gif")).toBeNull();
    expect(kindForMime("video/mp4")).toBe("VIDEO");
    expect(kindForMime("image/webp")).toBe("IMAGE");
    expect(kindForMime("text/html")).toBeNull();
  });
});
