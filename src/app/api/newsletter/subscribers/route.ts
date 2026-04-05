import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, authErrorResponse } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

// GET - List all subscribers (admin only)
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
    });

    return NextResponse.json({
      subscribers,
      total: subscribers.length,
    });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

// DELETE - Remove a subscriber by ID (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Subscriber ID is required" }, { status: 400 });
    }

    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove subscriber:", error);
    return NextResponse.json({ error: "Failed to remove subscriber" }, { status: 500 });
  }
}
