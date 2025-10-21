import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type { Article, UpdateArticleRequest } from "@/types/Articles/articles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const { id } = await params;

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

    if (!article.published && !isAuthorized) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
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

    return NextResponse.json(transformedArticle);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

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
      direction,
    } = body;

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

    const updateData: Prisma.ArticleUpdateInput = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (featuredImage !== undefined) updateData.articleImage = featuredImage;
    if (status !== undefined) updateData.published = status === "PUBLISHED";
    if (direction !== undefined) updateData.direction = direction;
    if (categoryId !== undefined) {
      updateData.category = categoryId
        ? { connect: { id: categoryId } }
        : { disconnect: true };
    }

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

    const transformedArticle: Article = {
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      featuredImage: updatedArticle.articleImage ?? undefined,
      status: updatedArticle.published ? "PUBLISHED" : "DRAFT",
      publishedAt: updatedArticle.published
        ? updatedArticle.createdAt.toISOString()
        : undefined,
      isFeatured: false,
      viewCount: 0,
      readTime: updatedArticle.readDuration,
      direction: updatedArticle.direction === "rtl" ? "rtl" : "ltr",
      createdAt: updatedArticle.createdAt.toISOString(),
      updatedAt: updatedArticle.updatedAt.toISOString(),
      authorId: updatedArticle.authorId,
      author: {
        id: updatedArticle.author.id,
        name: updatedArticle.author.name ?? undefined,
        email: updatedArticle.author.email ?? undefined,
        image: updatedArticle.author.image ?? undefined,
      },
      categoryId: updatedArticle.categoryId ?? undefined,
      category: updatedArticle.category
        ? {
            id: updatedArticle.category.id,
            name: updatedArticle.category.name,
            bannerImageUrl: updatedArticle.category.bannerImageUrl ?? undefined,
          }
        : undefined,
      tags: [],
      keywords: [],
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
