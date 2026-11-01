import { type MediaKind } from "./media";

/**
 * Tipo REAL do arquivo pelos primeiros bytes (MDI-D026, agente de segurança:
 * "uploads devem validar tipo"). O mime informado pelo navegador não é confiável;
 * o servidor confere a assinatura antes de registrar a mídia.
 */
export const SIGNATURE_BYTES = 32;

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));

// Marcas ISO-BMFF que não são vídeo MP4 (imagens HEIF/AVIF).
const IMAGE_BRANDS = new Set(["avif", "avis", "heic", "heix", "mif1", "msf1"]);

export function detectMimeType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    )
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brands = [ascii(bytes, 8, 12)];
    for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
      brands.push(ascii(bytes, offset, offset + 4));
    }
    if (brands[0] === "avif" || brands[0] === "avis") return "image/avif";
    if (brands.some((brand) => IMAGE_BRANDS.has(brand))) {
      return brands.includes("avif") ? "image/avif" : null;
    }
    return "video/mp4";
  }
  return null;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
};

export function extensionForMime(mimeType: string): string | null {
  return EXTENSIONS[mimeType] ?? null;
}

export function kindForMime(mimeType: string): MediaKind | null {
  if (mimeType.startsWith("image/") && EXTENSIONS[mimeType]) return "IMAGE";
  if (mimeType === "video/mp4") return "VIDEO";
  return null;
}
