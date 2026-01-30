import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Delete a comment (owner or admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { user } = auth;
    const { id } = await params;

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user is owner or admin
    const isOwner = comment.userId === user.id;
    const isAdmin = user.email && ALLOWED_EMAILS.includes(user.email.toLowerCase());

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
