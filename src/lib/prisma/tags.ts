import prisma from "@/lib/prisma/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

/**
 * Find existing tags by name or create new ones if they don't exist.
 * Returns an array of tag IDs.
 *
 * @param tagNames - Array of tag names to find or create
 * @returns Array of tag IDs
 *
 * @example
 * const tagIds = await findOrCreateTags(["JavaScript", "React", "TypeScript"]);
 * // Returns: ["tag-id-1", "tag-id-2", "tag-id-3"]
 */
export async function findOrCreateTags(tagNames: string[]): Promise<string[]> {
  if (!tagNames || tagNames.length === 0) return [];

  const tagIds: string[] = [];

  for (const name of tagNames) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    // Try to find existing tag by name
    let tag = await prisma.tag.findUnique({
      where: { name: trimmedName },
    });

    // If not found, create a new tag
    if (!tag) {
      const baseSlug = generateSlug(trimmedName);
      // Ensure unique slug
      const uniqueSlug = await generateUniqueSlug(baseSlug, async (slug) => {
        const existing = await prisma.tag.findUnique({ where: { slug } });
        return existing !== null;
      });

      tag = await prisma.tag.create({
        data: {
          name: trimmedName,
          slug: uniqueSlug,
        },
      });
    }

    tagIds.push(tag.id);
  }

  return tagIds;
}

/**
 * Get all tags for an article by article ID
 *
 * @param articleId - The article ID
 * @returns Array of tag objects with id, name, and slug
 */
export async function getArticleTags(articleId: string) {
  const articleTags = await prisma.articleTag.findMany({
    where: { articleId },
    include: { tag: true },
  });

  return articleTags.map((at) => at.tag);
}

/**
 * Update tags for an article - removes old tags and adds new ones
 *
 * @param articleId - The article ID
 * @param tagNames - Array of tag names to set
 */
export async function updateArticleTags(
  articleId: string,
  tagNames: string[]
): Promise<void> {
  // Delete existing tag associations
  await prisma.articleTag.deleteMany({
    where: { articleId },
  });

  // Find or create new tags and associate them
  const tagIds = await findOrCreateTags(tagNames);

  if (tagIds.length > 0) {
    await prisma.articleTag.createMany({
      data: tagIds.map((tagId) => ({
        articleId,
        tagId,
      })),
    });
  }
}
