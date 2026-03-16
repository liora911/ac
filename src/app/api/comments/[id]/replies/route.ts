import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch replies for a comment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: commentId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
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
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = replies.map((c) => ({
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
      isLikedByMe: currentUserId
        ? c.likes.some((l) => l.userId === currentUserId)
        : false,
      replyCount: 0,
    }));

    return NextResponse.json({ replies: formatted });
  } catch (error) {
    console.error("Failed to fetch replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
