import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST - Create a new ticket reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, holderName, holderEmail, holderPhone, numberOfSeats, notes } = body;

    // Validation
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    if (!holderName || holderName.trim().length < 2) {
      return NextResponse.json(
        { error: "Valid name is required" },
        { status: 400 }
      );
    }

    if (!holderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holderEmail)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (numberOfSeats < 1 || numberOfSeats > 10) {
      return NextResponse.json(
        { error: "Number of seats must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Check if event exists and is upcoming
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (new Date(event.eventDate) < new Date()) {
      return NextResponse.json(
        { error: "Cannot reserve tickets for past events" },
        { status: 400 }
      );
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        holderName: holderName.trim(),
        holderEmail: holderEmail.trim().toLowerCase(),
        holderPhone: holderPhone?.trim() || null,
        numberOfSeats: numberOfSeats || 1,
        notes: notes?.trim() || null,
        status: "PENDING", // Will be CONFIRMED after payment in future
      },
      include: {
        event: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: ticket.id,
      accessToken: ticket.accessToken,
      status: ticket.status,
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket reservation" },
      { status: 500 }
    );
  }
}

// GET - List all tickets (admin only - will add auth later)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const where = eventId ? { eventId } : {};

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        event: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
