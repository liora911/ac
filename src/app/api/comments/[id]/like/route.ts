import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/comments/[id]/like — toggle like on a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Toggle: if already liked, remove it; otherwise, create it
    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId: session.user.id } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.commentLike.create({
      data: { commentId, userId: session.user.id },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Failed to toggle comment like:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/comments/[id]/like — get likers for a comment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: commentId } = await params;

    const likes = await prisma.commentLike.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      likers: likes.map((l) => ({
        id: l.user.id,
        name: l.user.name,
        image: l.user.image,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch comment likers:", error);
    return NextResponse.json({ likers: [] });
  }
}
