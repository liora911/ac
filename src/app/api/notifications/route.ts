import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type {
  NotificationWithReadCount,
  NotificationCreateInput,
  NotificationsListResponse,
} from "@/types/Notifications/notifications";

// GET - List all notifications (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { userNotifications: true },
        },
        userNotifications: {
          where: { isRead: true },
          select: { id: true },
        },
      },
    });

    // Get total user count for "total count"
    const totalUsers = await prisma.user.count();

    const transformedNotifications: NotificationWithReadCount[] = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      imageUrl: n.imageUrl,
      published: n.published,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      readCount: n.userNotifications.length,
      totalCount: totalUsers,
    }));

    const response: NotificationsListResponse = {
      notifications: transformedNotifications,
      total: notifications.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST - Create new notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: NotificationCreateInput = await request.json();
    const { title, message, imageUrl, published = true } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        imageUrl: imageUrl || null,
        published,
      },
    });

    // If published, create UserNotification entries for all existing users
    if (published) {
      const users = await prisma.user.findMany({ select: { id: true } });

      if (users.length > 0) {
        await prisma.userNotification.createMany({
          data: users.map((user) => ({
            userId: user.id,
            notificationId: notification.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      imageUrl: notification.imageUrl,
      published: notification.published,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
