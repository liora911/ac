import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type {
  Article,
  ArticlesListResponse,
  ArticlesQueryParams,
} from "@/types/Articles/articles";

export async function fetchArticles(
  query: ArticlesQueryParams = {}
): Promise<ArticlesListResponse> {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const {
    page = 1,
    limit = 10,
    categoryId,
    status,
    search,
    featured,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: any = {};

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status) {
    where.published = status === "PUBLISHED";
  } else {
    const session = await getServerSession(authOptions);
    const isAuthorized =
      session?.user?.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

    if (!isAuthorized) {
      where.published = true;
    }
  }

  if (featured !== undefined) {
    where.order = { gt: 0 };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: any;
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
    },
    orderBy,
    skip,
    take,
  });

  const transformedArticles: Article[] = articles.map((article) => ({
    id: article.id,
    title: article.title,
    content: article.content,
    featuredImage: article.articleImage ?? undefined,
    status: article.published ? "PUBLISHED" : "DRAFT",
    publishedAt: article.published
      ? article.createdAt.toISOString()
      : undefined,
    isFeatured: false,
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
    categoryId: article.categoryId ?? undefined,
    category: article.category
      ? {
          id: article.category.id,
          name: article.category.name,
          bannerImageUrl: article.category.bannerImageUrl ?? undefined,
        }
      : undefined,
    tags: [],
    keywords: [],
  }));

  const response: ArticlesListResponse = {
    articles: transformedArticles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return response;
}

export async function fetchCategories() {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      bannerImageUrl: true,
    },
  });

  return categories;
}

export async function fetchArticle(id: string): Promise<Article | null> {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const session = await getServerSession(authOptions);
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const article = await prisma.article.findUnique({
    where: { id },
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
    },
  });

  if (!article) {
    return null;
  }

  if (!article.published && !isAuthorized) {
    return null;
  }

  const transformedArticle: Article = {
    id: article.id,
    title: article.title,
    content: article.content,
    featuredImage: article.articleImage ?? undefined,
    status: article.published ? "PUBLISHED" : "DRAFT",
    publishedAt: article.published
      ? article.createdAt.toISOString()
      : undefined,
    isFeatured: false,
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
    categoryId: article.categoryId ?? undefined,
    category: article.category
      ? {
          id: article.category.id,
          name: article.category.name,
          bannerImageUrl: article.category.bannerImageUrl ?? undefined,
        }
      : undefined,
    tags: [],
    keywords: [],
  };

  return transformedArticle;
}
