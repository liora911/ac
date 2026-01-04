import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type { Article, UpdateArticleRequest, ArticleAuthorInput } from "@/types/Articles/articles";
import { deleteBlobs } from "@/actions/upload";

// Type for article with included relations
type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: { select: { id: true; name: true; email: true; image: true } };
    category: { select: { id: true; name: true; bannerImageUrl: true } };
    authors: { select: { id: true; name: true; imageUrl: true; order: true } };
  };
}>;

// Helper to transform DB article to API response
function transformArticle(article: ArticleWithRelations): Article {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    featuredImage: article.articleImage ?? undefined,
    status: article.published ? "PUBLISHED" : "DRAFT",
    publishedAt: article.published ? article.createdAt.toISOString() : undefined,
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
    tags: [],
    keywords: [],
    authors: article.authors.map((a) => ({
      id: a.id,
      name: a.name,
      imageUrl: a.imageUrl,
      order: a.order,
    })),
  };
}

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
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!article.published && !isAuthorized) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const transformedArticle = transformArticle(article as ArticleWithRelations);

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
      publisherName,
      publisherImage,
      authors,
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
    if (publisherName !== undefined) updateData.publisherName = publisherName;
    if (publisherImage !== undefined) {
      updateData.publisherImage = publisherImage;
    }
    if (categoryId !== undefined) {
      updateData.category = categoryId
        ? { connect: { id: categoryId } }
        : { disconnect: true };
    }

    if (content !== undefined) {
      // Calculate read time: strip HTML, count words, divide by 200 WPM (average reading speed)
      updateData.readDuration = Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length / 200));
    }

    // Validate authors if provided
    if (authors !== undefined) {
      if (authors.length === 0) {
        return NextResponse.json(
          { error: "At least one author is required" },
          { status: 400 }
        );
      }
      for (const author of authors) {
        if (!author.name || author.name.trim() === "") {
          return NextResponse.json(
            { error: "Each author must have a name" },
            { status: 400 }
          );
        }
      }
    }

    // If authors are being updated, delete old ones and create new ones
    if (authors !== undefined) {
      await prisma.articleAuthor.deleteMany({
        where: { articleId: id },
      });
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        ...updateData,
        ...(authors !== undefined && {
          authors: {
            create: authors.map((author: ArticleAuthorInput, index: number) => ({
              name: author.name.trim(),
              imageUrl: author.imageUrl || null,
              order: author.order ?? index,
            })),
          },
        }),
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
    });

    const transformedArticle = transformArticle(updatedArticle as ArticleWithRelations);

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
      include: {
        authors: {
          select: { imageUrl: true },
        },
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Delete associated blob files (article image, publisher image, author images)
    const blobsToDelete: string[] = [];
    if (existingArticle.articleImage) {
      blobsToDelete.push(existingArticle.articleImage);
    }
    if (existingArticle.publisherImage) {
      blobsToDelete.push(existingArticle.publisherImage);
    }
    existingArticle.authors.forEach((author) => {
      if (author.imageUrl) {
        blobsToDelete.push(author.imageUrl);
      }
    });
    if (blobsToDelete.length > 0) {
      await deleteBlobs(blobsToDelete);
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
