import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type { Article, UpdateArticleRequest } from "@/types/Articles/articles";

// GET /api/articles/[id] - Fetch single article by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const { id } = await params;

    // Check if user is authorized to view unpublished articles
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
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if user can view this article
    if (!article.published && !isAuthorized) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Transform to our API format
    const transformedArticle: Article = {
      id: article.id,
      title: article.title,
      content: article.content,
      featuredImage: article.articleImage,
      status: article.published ? "PUBLISHED" : "DRAFT",
      publishedAt: article.published
        ? article.createdAt.toISOString()
        : undefined,
      isFeatured: false, // Not implemented in current schema
      viewCount: 0, // Not implemented in current schema
      readTime: article.readDuration,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      authorId: article.authorId,
      author: article.author,
      categoryId: undefined, // Not implemented in current schema
      category: undefined, // Not implemented in current schema
      tags: [], // Not implemented in current schema
      keywords: [], // Not implemented in current schema
    };

    return NextResponse.json(transformedArticle);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - Update article by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Unauthorized to edit articles" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const body: UpdateArticleRequest = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      categoryId,
      status,
      isFeatured,
      metaTitle,
      metaDescription,
      keywords,
    } = body;

    // Validate category if provided
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

    // Check title uniqueness if title is being changed
    if (title && title !== existingArticle.title) {
      const duplicateArticle = await prisma.article.findFirst({
        where: {
          title: { equals: title, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicateArticle) {
        return NextResponse.json(
          { error: "An article with this title already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (featuredImage !== undefined) updateData.articleImage = featuredImage;
    if (status !== undefined) updateData.published = status === "PUBLISHED";

    if (content !== undefined) {
      updateData.readDuration = Math.max(1, Math.ceil(content.length / 1000));
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
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

    // Transform to our API format
    const transformedArticle: Article = {
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      featuredImage: updatedArticle.articleImage,
      status: updatedArticle.published ? "PUBLISHED" : "DRAFT",
      publishedAt: updatedArticle.published
        ? updatedArticle.createdAt.toISOString()
        : undefined,
      isFeatured: false, // Not implemented in current schema
      viewCount: 0, // Not implemented in current schema
      readTime: updatedArticle.readDuration,
      createdAt: updatedArticle.createdAt.toISOString(),
      updatedAt: updatedArticle.updatedAt.toISOString(),
      authorId: updatedArticle.authorId,
      author: updatedArticle.author,
      categoryId: undefined, // Not implemented in current schema
      category: undefined, // Not implemented in current schema
      tags: [], // Not implemented in current schema
      keywords: [], // Not implemented in current schema
    };

    return NextResponse.json(transformedArticle);
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - Delete article by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Unauthorized to delete articles" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
