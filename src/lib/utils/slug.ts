/**
 * Generate a URL-friendly slug from a text string
 * Supports Unicode characters (Hebrew, etc.)
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Keep Unicode letters and numbers, remove special chars
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending numbers if slug already exists
 * @param baseSlug - The base slug to start from
 * @param checkExists - Async function that checks if a slug exists in the database
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  // Keep trying with incrementing counter until we find a unique slug
  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
