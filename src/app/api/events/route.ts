import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { ALLOWED_EMAILS } from "@/constants/auth";

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const events = await prisma.event.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            bannerImageUrl: true,
          },
        },
      },
      orderBy: {
        eventDate: "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const session = await getServerSession(authOptions);

    if (
      !session?.user?.email ||
      !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      eventType,
      location,
      onlineUrl,
      eventDate,
      eventTime,
      bannerImageUrl,
      categoryId,
      maxSeats,
      isFeatured = false,
    } = body;

    if (!title || !description || !eventType || !eventDate || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (eventType !== "in-person" && eventType !== "online") {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    if (eventType === "in-person" && !location) {
      return NextResponse.json(
        { error: "Location is required for in-person events" },
        { status: 400 }
      );
    }

    if (eventType === "online" && !onlineUrl) {
      return NextResponse.json(
        { error: "Online URL is required for online events" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // If marking this event as featured, unmark all others first
    if (isFeatured) {
      await prisma.event.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventType,
        location: eventType === "in-person" ? location : null,
        onlineUrl: eventType === "online" ? onlineUrl : null,
        eventDate: new Date(eventDate),
        eventTime,
        bannerImageUrl,
        categoryId,
        authorId: user.id,
        maxSeats: maxSeats ? parseInt(maxSeats) : null,
        isFeatured: Boolean(isFeatured),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
