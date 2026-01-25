import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import type { UserNotificationsResponse } from "@/types/Notifications/notifications";

// GET - Get all notifications for current user
export async function GET() {
  try {
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

    const userNotifications = await prisma.userNotification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        notification: true,
      },
    });

    const unreadCount = userNotifications.filter((un) => !un.isRead).length;

    const response: UserNotificationsResponse = {
      notifications: userNotifications.map((un) => ({
        id: un.id,
        userId: un.userId,
        notificationId: un.notificationId,
        isRead: un.isRead,
        readAt: un.readAt?.toISOString() || null,
        createdAt: un.createdAt.toISOString(),
        notification: {
          id: un.notification.id,
          title: un.notification.title,
          message: un.notification.message,
          imageUrl: un.notification.imageUrl,
          published: un.notification.published,
          createdAt: un.notification.createdAt.toISOString(),
          updatedAt: un.notification.updatedAt.toISOString(),
        },
      })),
      unreadCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch user notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch user notifications" },
      { status: 500 }
    );
  }
}
