import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import type { CreateCommentRequest, Comment } from "@/types/Comments/comments";

// GET - Fetch all comments (admin only)
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const comments = await prisma.comment.findMany({
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { user } = auth;

    const body: CreateCommentRequest = await request.json();
    const { articleId, content, parentId } = body;

    // Validate input
    if (!articleId || !content?.trim()) {
      return NextResponse.json(
        { error: "Article ID and content are required" },
        { status: 400 }
      );
    }

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check subscription status for rate limiting
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    // Check rate limit for non-premium/non-admin users
    const isUnlimited =
      user.role === "ADMIN" ||
      subscription?.status === "ACTIVE";

    if (!isUnlimited) {
      // Check for existing comment today on this article
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingToday = await prisma.comment.findFirst({
        where: {
          userId: user.id,
          articleId,
          createdAt: { gte: today },
        },
      });

      if (existingToday) {
        return NextResponse.json(
          { error: "You can only comment once per day on this article" },
          { status: 429 }
        );
      }
    }

    // If replying, verify parent comment exists and belongs to same article
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, articleId: true },
      });
      if (!parentComment || parentComment.articleId !== articleId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        articleId,
        userId: user.id,
        ...(parentId && { parentId }),
      },
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
    });

    const response: Comment = {
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      userId: comment.userId,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        name: comment.user.name,
        email: comment.user.email,
        image: comment.user.image,
      },
      likeCount: 0,
      isLikedByMe: false,
      replyCount: 0,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
