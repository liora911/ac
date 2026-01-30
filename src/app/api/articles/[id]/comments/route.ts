import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import type { CommentsResponse } from "@/types/Comments/comments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List comments for an article (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: articleId } = await params;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Fetch comments with user info
    const comments = await prisma.comment.findMany({
      where: { articleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response: CommentsResponse = {
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        articleId: c.articleId,
        userId: c.userId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        user: {
          id: c.user.id,
          name: c.user.name,
          email: c.user.email,
          image: c.user.image,
        },
      })),
      total: comments.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
