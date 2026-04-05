import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

// POST - Subscribe to newsletter (public)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {},
      create: { email: email.toLowerCase().trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

// DELETE - Unsubscribe via token (public)
export async function DELETE(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    await prisma.newsletterSubscriber.delete({
      where: { unsubscribeToken: token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
