import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
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
    const query: ArticlesQueryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      categoryId: searchParams.get("categoryId") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      search: searchParams.get("search") || undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    const skip = (query.page! - 1) * query.limit!;
    const take = query.limit!;

    const where: any = {};

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

    const orderBy: any = {};
    orderBy[query.sortBy!] = query.sortOrder;

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

    const articlesArray = Array.isArray(articles) ? articles : [];

    const transformedArticles: Article[] = articlesArray.map(
      (article: any) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        featuredImage: article.articleImage,
        status: article.published ? "PUBLISHED" : "DRAFT",
        publishedAt: article.published
          ? article.createdAt.toISOString()
          : undefined,
        isFeatured: false,
        viewCount: 0,
        readTime: article.readDuration,
        direction: article.direction || "ltr",
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        authorId: article.authorId,
        author: article.author,
        categoryId: undefined,
        category: undefined,
        tags: [],
        keywords: [],
      })
    );

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
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateArticleRequest = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      categoryId,
      status = "DRAFT",
      isFeatured = false,
      metaTitle,
      metaDescription,
      keywords = [],
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

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

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
      featuredImage: article.articleImage,
      status: article.published ? "PUBLISHED" : "DRAFT",
      publishedAt: article.published
        ? article.createdAt.toISOString()
        : undefined,
      isFeatured: false,
      viewCount: 0,
      readTime: article.readDuration,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      authorId: article.authorId,
      author: article.author,
      categoryId: undefined,
      category: undefined,
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
