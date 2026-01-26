import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import type { NotificationUpdateInput } from "@/types/Notifications/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single notification (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      imageUrl: notification.imageUrl,
      published: notification.published,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch notification:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

// PUT - Update notification (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const body: NotificationUpdateInput = await request.json();
    const { title, message, imageUrl, published } = body;

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(published !== undefined && { published }),
      },
    });

    // If notification becomes published and wasn't before, create UserNotification entries
    if (published === true && !existing.published) {
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
    });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // UserNotifications will be cascade deleted
    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
