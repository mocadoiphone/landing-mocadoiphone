/**
 * Slugs de URL (MDI-D003). O formato é o mesmo das CHECK constraints do banco:
 * minúsculas, números e hífens, sem hífen no início, no fim ou repetido.
 * Os slugs reservados de categoria ficam só no banco (`categories_slug_not_reserved`).
 */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SLUG_MAX_LENGTH = {
  category: 80,
  family: 120,
  product: 120,
} as const;

/** "iPhone 17 Pro Max" → "iphone-17-pro-max" · "TV & Casa" → "tv-e-casa". */
export function slugify(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/, "");
}

export function isValidSlug(slug: string, maxLength: number): boolean {
  return slug.length <= maxLength && SLUG_PATTERN.test(slug);
}
