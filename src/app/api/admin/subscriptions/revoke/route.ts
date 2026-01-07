import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Revoke subscription from a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find user subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "User has no subscription" },
        { status: 400 }
      );
    }

    // Delete the subscription
    await prisma.subscription.delete({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
