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

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

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

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.published = query.status === "PUBLISHED";
    } else {
      const session = await getServerSession(authOptions);
      const isAuthorized =
        session?.user?.email &&
        ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

      if (!isAuthorized) {
        where.published = true;
      }
    }

    if (query.featured !== undefined) {
      where.order = { gt: 0 };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
      ];
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
      page: query.page!,
      limit: query.limit!,
      totalPages: Math.ceil(total / query.limit!),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching articles:", error);
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
      content,
      featuredImage,
      categoryId,
      status = "DRAFT",
      direction = "ltr",
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
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

    const article = await prisma.article.create({
      data: {
        title,
        content,
        articleImage: featuredImage,
        publisherName: user.name || "Anonymous",
        publisherImage: user.image,
        readDuration: Math.max(1, Math.ceil(content.length / 1000)),
        published: status === "PUBLISHED",
        authorId: user.id,
        direction,
        categoryId: categoryId || null, // Add categoryId here
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
      },
    });

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

    return NextResponse.json(transformedArticle, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
