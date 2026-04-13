import { NextResponse } from "next/server";
import { requireAuth, isAuthError, authErrorResponse } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

// GET - Check if current user is subscribed to newsletter
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: auth.user.email!.toLowerCase() },
    });

    return NextResponse.json({ subscribed: !!subscriber });
  } catch (error) {
    console.error("Newsletter status error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}

// POST - Subscribe current user to newsletter
export async function POST() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: auth.user.email!.toLowerCase() },
      update: {},
      create: { email: auth.user.email!.toLowerCase() },
    });

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

// DELETE - Unsubscribe current user from newsletter
export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    await prisma.newsletterSubscriber.deleteMany({
      where: { email: auth.user.email!.toLowerCase() },
    });

    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
