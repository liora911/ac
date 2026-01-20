import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  ArticlesListResponse,
  ArticlesQueryParams,
  CreateArticleRequest,
  Article,
} from "@/types/Articles/articles";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

// Helper function to find or create tags by name
async function findOrCreateTags(tagNames: string[]): Promise<string[]> {
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
      // Reuse the existing generateUniqueSlug helper to ensure unique slug
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

// Type for article with included relations
type ArticleWithRelations = Prisma.ArticleGetPayload<{
  select: {
    id: true;
    title: true;
    subtitle: true;
    slug: true;
    content: true;
    articleImage: true;
    publisherName: true;
    publisherImage: true;
    readDuration: true;
    published: true;
    isPremium: true;
    isFeatured: true;
    order: true;
    createdAt: true;
    updatedAt: true;
    direction: true;
    authorId: true;
    categoryId: true;
    author: { select: { id: true; name: true; email: true; image: true } };
    category: { select: { id: true; name: true; bannerImageUrl: true } };
    categories: { include: { category: { select: { id: true; name: true; bannerImageUrl: true } } } };
    tags: { include: { tag: { select: { id: true; name: true; slug: true; color: true } } } };
    authors: { select: { id: true; name: true; imageUrl: true; order: true } };
  };
}>;

// Helper to transform DB article to API response
function transformArticle(article: ArticleWithRelations): Article {
  // Build categories array from the many-to-many relation
  const categoriesFromRelation = article.categories?.map((ac) => ({
    id: ac.category.id,
    name: ac.category.name,
    bannerImageUrl: ac.category.bannerImageUrl ?? undefined,
  })) || [];

  // Fallback to single category for backward compatibility
  const categories = categoriesFromRelation.length > 0
    ? categoriesFromRelation
    : article.category
    ? [{
        id: article.category.id,
        name: article.category.name,
        bannerImageUrl: article.category.bannerImageUrl ?? undefined,
      }]
    : [];

  return {
    id: article.id,
    title: article.title,
    subtitle: article.subtitle ?? undefined,
    slug: article.slug ?? undefined,
    content: article.content,
    featuredImage: article.articleImage ?? undefined,
    status: article.published ? "PUBLISHED" : "DRAFT",
    publishedAt: article.published ? article.createdAt.toISOString() : undefined,
    isFeatured: article.isFeatured,
    isPremium: article.isPremium,
    viewCount: 0,
    readTime: article.readDuration,
    direction: article.direction === "rtl" ? "rtl" : "ltr",
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    authorId: article.authorId,
    author: {
      id: article.author.id,
      name: article.author.name ?? undefined,
      email: article.author.email ?? undefined,
      image: article.author.image ?? undefined,
    },
    publisherName: article.publisherName,
    publisherImage: article.publisherImage ?? undefined,
    categoryId: article.categoryId ?? undefined,
    category: article.category
      ? {
          id: article.category.id,
          name: article.category.name,
          bannerImageUrl: article.category.bannerImageUrl ?? undefined,
        }
      : undefined,
    categories, // Multiple categories
    tags: article.tags?.map((at) => ({
      id: at.tag.id,
      name: at.tag.name,
      slug: at.tag.slug,
      color: at.tag.color ?? undefined,
    })) || [],
    keywords: [],
    authors: article.authors.map((a) => ({
      id: a.id,
      name: a.name,
      imageUrl: a.imageUrl,
      order: a.order,
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    // Check auth status early for cache control decisions
    const session = await getServerSession(authOptions);
    const isAuthorized =
      session?.user?.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId") || undefined;
    const statusParam = searchParams.get("status");
    const status: ArticlesQueryParams["status"] =
      statusParam === "PUBLISHED" ||
      statusParam === "DRAFT" ||
      statusParam === "ARCHIVED"
        ? statusParam
        : undefined;
    const search = searchParams.get("search") || undefined;
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const sortByParam = searchParams.get("sortBy");
    const sortBy: NonNullable<ArticlesQueryParams["sortBy"]> =
      sortByParam === "createdAt" ||
      sortByParam === "updatedAt" ||
      sortByParam === "title"
        ? sortByParam
        : "createdAt";
    const sortOrderParam = searchParams.get("sortOrder");
    const sortOrder: NonNullable<ArticlesQueryParams["sortOrder"]> =
      sortOrderParam === "asc" ? "asc" : "desc";

    const query: ArticlesQueryParams = {
      page,
      limit,
      categoryId,
      status,
      search,
      featured,
      sortBy,
      sortOrder,
    };

    const skip = (query.page! - 1) * query.limit!;
    const take = query.limit!;

    const where: Prisma.ArticleWhereInput = {};
    const andConditions: Prisma.ArticleWhereInput[] = [];

    if (query.categoryId) {
      // Search in both the legacy single categoryId AND the new many-to-many categories relation
      andConditions.push({
        OR: [
          { categoryId: query.categoryId },
          { categories: { some: { categoryId: query.categoryId } } },
        ],
      });
    }

    if (query.status) {
      where.published = query.status === "PUBLISHED";
    } else {
      if (!isAuthorized) {
        where.published = true;
      }
    }

    if (query.featured !== undefined) {
      where.isFeatured = query.featured;
    }

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { content: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }

    // Combine all AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    let orderBy: Prisma.ArticleOrderByWithRelationInput;
    switch (sortBy) {
      case "updatedAt":
        orderBy = { updatedAt: sortOrder };
        break;
      case "title":
        orderBy = { title: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    const total = await prisma.article.count({ where });

    const articles = await prisma.article.findMany({
      where,
      include: {
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
        authors: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            order: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    });

    const transformedArticles: Article[] = (articles as ArticleWithRelations[]).map(transformArticle);

    const response: ArticlesListResponse = {
      articles: transformedArticles,
      total,
      page: query.page!,
      limit: query.limit!,
      totalPages: Math.ceil(total / query.limit!),
    };

    // Don't cache for admin users so they see real-time updates
    const cacheControl = isAuthorized
      ? "private, no-cache, no-store, must-revalidate"
      : "public, s-maxage=60, stale-while-revalidate=300";

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      session.user.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized to create articles" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email ?? undefined },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateArticleRequest = await request.json();
    const {
      title,
      subtitle,
      content,
      featuredImage,
      categoryId,
      categoryIds, // Multiple categories support
      tags, // Tag IDs to associate with article
      status = "DRAFT",
      isPremium = false,
      isFeatured = false,
      direction = "ltr",
      publisherName,
      publisherImage,
      authors,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate authors - at least one author required
    if (!authors || authors.length === 0) {
      return NextResponse.json(
        { error: "At least one author is required" },
        { status: 400 }
      );
    }

    // Validate each author has a name
    for (const author of authors) {
      if (!author.name || author.name.trim() === "") {
        return NextResponse.json(
          { error: "Each author must have a name" },
          { status: 400 }
        );
      }
    }

    // Validate categories (support both single categoryId and multiple categoryIds)
    const allCategoryIds = categoryIds?.length ? categoryIds : (categoryId ? [categoryId] : []);

    if (allCategoryIds.length > 0) {
      const foundCategories = await prisma.category.findMany({
        where: { id: { in: allCategoryIds } },
      });

      if (foundCategories.length !== allCategoryIds.length) {
        return NextResponse.json(
          { error: "One or more categories not found" },
          { status: 400 }
        );
      }
    }

    const existingArticle = await prisma.article.findFirst({
      where: { title: { equals: title, mode: "insensitive" } },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: "An article with this title already exists" },
        { status: 400 }
      );
    }

    // Generate unique slug from title
    const baseSlug = generateSlug(title);
    const checkSlugExists = async (slug: string): Promise<boolean> => {
      const existing = await prisma.article.findUnique({
        where: { slug },
      });
      return existing !== null;
    };
    const uniqueSlug = await generateUniqueSlug(baseSlug, checkSlugExists);

    // Convert tag names to IDs (find or create tags)
    const tagIds = await findOrCreateTags(tags || []);

    const article = await prisma.article.create({
      data: {
        title,
        subtitle: subtitle || null,
        slug: uniqueSlug,
        content,
        articleImage: featuredImage,
        publisherName: publisherName || user.name || "Anonymous",
        publisherImage: publisherImage || user.image,
        // Calculate read time: strip HTML, count words, divide by 200 WPM (average reading speed)
        readDuration: Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length / 200)),
        published: status === "PUBLISHED",
        isPremium,
        isFeatured,
        authorId: user.id,
        direction,
        categoryId: allCategoryIds[0] || null, // Keep first category for backward compat
        // Create multiple category relations
        categories: allCategoryIds.length > 0
          ? {
              create: allCategoryIds.map((catId) => ({
                categoryId: catId,
              })),
            }
          : undefined,
        authors: {
          create: authors.map((author, index) => ({
            name: author.name.trim(),
            imageUrl: author.imageUrl || null,
            order: author.order ?? index,
          })),
        },
        // Create tag associations if tags provided
        tags: tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
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
      },
    });

    const transformedArticle = transformArticle(article as ArticleWithRelations);

    return NextResponse.json(transformedArticle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
