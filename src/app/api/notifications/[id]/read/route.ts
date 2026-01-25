import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Mark notification as read for current user
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the user notification entry
    const userNotification = await prisma.userNotification.findUnique({
      where: {
        userId_notificationId: {
          userId: user.id,
          notificationId: id,
        },
      },
    });

    if (!userNotification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Mark as read
    await prisma.userNotification.update({
      where: { id: userNotification.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
