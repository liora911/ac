import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin, isAuthError, authErrorResponse } from "@/lib/auth/apiAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin-only: contact messages are private and IDs are returned by the
    // public POST, so this must never be callable without admin auth.
    const auth = await requireAdmin();
    if (isAuthError(auth)) return authErrorResponse(auth);

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
