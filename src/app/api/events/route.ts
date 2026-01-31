import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

export async function GET() {
  try {
    console.log("Fetching eventds...");
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

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }
    const { user } = auth;

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
      isClosed = false,
      requiresRegistration = true,
      published = true, // Default to published when creating events
      price, // Price in agorot (null = free)
    } = body;

    if (!title || !eventType || !eventDate || !categoryId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (title, event type, date, and category)",
        },
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
        description: description || "",
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
        isClosed: Boolean(isClosed),
        requiresRegistration: Boolean(requiresRegistration),
        published: Boolean(published),
        price: price && price > 0 ? price : null,
        currency: "ILS",
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
