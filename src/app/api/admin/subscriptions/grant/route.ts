import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

// POST - Grant subscription to a user
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
    const { email, duration } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Calculate end date based on duration
    const now = new Date();
    let endDate: Date;

    switch (duration) {
      case "1month":
        endDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case "3months":
        endDate = new Date(now.setMonth(now.getMonth() + 3));
        break;
      case "1year":
        endDate = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      case "lifetime":
        endDate = new Date(now.setFullYear(now.getFullYear() + 100));
        break;
      default:
        endDate = new Date(now.setMonth(now.getMonth() + 1));
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          role: "USER",
        },
        include: { subscription: true },
      });
    }

    // Create or update subscription
    const adminGrantId = `admin_grant_${user.id}_${Date.now()}`;

    if (user.subscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: adminGrantId,
          stripePriceId: "admin_granted",
        },
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: adminGrantId,
          stripePriceId: "admin_granted",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Subscription granted to ${email} until ${endDate.toISOString()}`,
    });
  } catch (error) {
    console.error("Error granting subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
