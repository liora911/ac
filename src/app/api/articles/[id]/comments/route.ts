import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import type { CommentsResponse } from "@/types/Comments/comments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List comments for an article (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: articleId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Fetch top-level comments (no parent) with user info, like counts, and reply counts
    const comments = await prisma.comment.findMany({
      where: { articleId, parentId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { replies: true },
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
        parentId: c.parentId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        user: {
          id: c.user.id,
          name: c.user.name,
          email: c.user.email,
          image: c.user.image,
        },
        likeCount: c.likes.length,
        isLikedByMe: currentUserId ? c.likes.some((l) => l.userId === currentUserId) : false,
        replyCount: c._count.replies,
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
