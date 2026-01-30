import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

// DELETE - Delete user account and all associated data
export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { user } = auth;

    // Delete the user - Prisma will cascade delete all related data
    // (comments, favorites, tickets, notifications, subscription, sessions, accounts)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
