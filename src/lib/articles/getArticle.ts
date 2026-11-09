import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma/prisma";

// Everything the article page (and its reading mode) shows alongside the body
const articleDetailInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      bannerImageUrl: true,
    },
  },
  categories: {
    include: {
      category: {
        select: {
          id: true,
          name: true,
          bannerImageUrl: true,
        },
      },
    },
  },
  authors: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      order: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
    },
  },
  translations: {
    where: { published: true },
    select: { id: true, slug: true, language: true, title: true },
  },
  translatedFrom: {
    select: { id: true, slug: true, language: true, title: true, published: true },
  },
} satisfies Prisma.ArticleInclude;

/**
 * Server-side lookup of an article by slug, falling back to its ID (older links).
 * Shared by the article page and its reading mode.
 */
export async function getArticle(idOrSlug: string) {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  // Decode URL parameter (handles percent-encoded slugs like %D7%99...)
  const decodedIdOrSlug = decodeURIComponent(idOrSlug);

  // Try to find by slug first (more SEO-friendly)
  const bySlug = await prisma.article.findUnique({
    where: { slug: decodedIdOrSlug },
    include: articleDetailInclude,
  });
  if (bySlug) return bySlug;

  // If not found by slug, try by ID (backward compatibility)
  return prisma.article.findUnique({
    where: { id: decodedIdOrSlug },
    include: articleDetailInclude,
  });
}
