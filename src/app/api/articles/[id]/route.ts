import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";

// GET /api/articles/[id] - Fetch single article by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const formattedArticle = {
      id: article.id,
      publisherImage: article.publisherImage || "/NNZxjUl0_400x400.png",
      publisherName: article.publisherName,
      date: new Date(article.createdAt).toLocaleDateString("he-IL"),
      readDuration: article.readDuration,
      title: article.title,
      articleImage: article.articleImage || "/consc.png",
      content: article.content,
      published: article.published,
      author: article.author,
      category: article.category,
    };

    return NextResponse.json(formattedArticle);
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if article exists and user is authorized
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if user is authorized (in allowed emails)
    const isAuthorized =
      session.user.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized to edit articles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      articleImage,
      publisherName,
      publisherImage,
      readDuration,
      categoryId,
      published = true,
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and categoryId are required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        title,
        content,
        articleImage: articleImage || "/consc.png",
        publisherName: publisherName || existingArticle.publisherName,
        publisherImage: publisherImage || existingArticle.publisherImage,
        readDuration: readDuration || Math.ceil(content.length / 200),
        categoryId,
        published,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    });

    const formattedArticle = {
      id: updatedArticle.id,
      publisherImage: updatedArticle.publisherImage,
      publisherName: updatedArticle.publisherName,
      date: new Date(updatedArticle.createdAt).toLocaleDateString("he-IL"),
      readDuration: updatedArticle.readDuration,
      title: updatedArticle.title,
      articleImage: updatedArticle.articleImage,
      content: updatedArticle.content,
      published: updatedArticle.published,
      author: updatedArticle.author,
      category: updatedArticle.category,
    };

    return NextResponse.json(formattedArticle);
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if article exists and user is authorized
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if user is authorized (in allowed emails)
    const isAuthorized =
      session.user.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized to delete articles" },
        { status: 403 }
      );
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
