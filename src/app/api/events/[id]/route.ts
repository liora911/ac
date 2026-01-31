import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import { deleteBlob } from "@/actions/upload";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate remaining seats if event has maxSeats limit
    let seatsInfo = null;
    if (event.maxSeats !== null) {
      const reservedSeats = await prisma.ticket.aggregate({
        where: {
          eventId: id,
          status: {
            in: ["CONFIRMED", "PENDING"],
          },
        },
        _sum: {
          numberOfSeats: true,
        },
      });

      const totalReserved = reservedSeats._sum.numberOfSeats || 0;
      const availableSeats = event.maxSeats - totalReserved;

      seatsInfo = {
        maxSeats: event.maxSeats,
        reservedSeats: totalReserved,
        availableSeats: event.isClosed ? 0 : Math.max(0, availableSeats),
      };
    }

    // If event is manually closed, ensure seatsInfo reflects that
    if (event.isClosed && !seatsInfo) {
      seatsInfo = {
        maxSeats: null,
        reservedSeats: 0,
        availableSeats: 0,
      };
    }

    return NextResponse.json({ ...event, seatsInfo });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
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
      published = true,
      price,
    } = body;

    if (!title || !eventType || !eventDate || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields (title, event type, date, and category)" },
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
        where: { isFeatured: true, id: { not: id } },
        data: { isFeatured: false },
      });
    }

    const event = await prisma.event.update({
      where: { id },
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
        maxSeats: maxSeats ? parseInt(maxSeats) : null,
        isFeatured: Boolean(isFeatured),
        isClosed: Boolean(isClosed),
        requiresRegistration: Boolean(requiresRegistration),
        published: Boolean(published),
        price: price && price > 0 ? price : null,
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

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete associated blob file (banner image)
    if (event.bannerImageUrl) {
      await deleteBlob(event.bannerImageUrl);
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
