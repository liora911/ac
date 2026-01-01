import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { ALLOWED_EMAILS } from "@/constants/auth";

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
        availableSeats: Math.max(0, availableSeats),
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

    const session = await getServerSession(authOptions);

    if (
      !session?.user?.email ||
      !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const event = await prisma.event.update({
      where: { id },
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
        maxSeats: maxSeats ? parseInt(maxSeats) : null,
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

    const session = await getServerSession(authOptions);

    if (
      !session?.user?.email ||
      !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
