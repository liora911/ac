import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { sendEmail } from "@/lib/email/resend";
import {
  generateTicketConfirmationEmail,
  getTicketConfirmationSubject,
} from "@/lib/email/templates/ticket-confirmation";
import { ALLOWED_EMAILS } from "@/constants/auth";

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

    if (!holderPhone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone: extract digits, check length and reject fake numbers
    const phoneDigits = holderPhone.replace(/[\s\-+()]/g, "");
    const isFakePhone = /^(\d)\1+$/.test(phoneDigits) || /^0{7,}$/.test(phoneDigits);
    if (phoneDigits.length < 9 || isFakePhone) {
      return NextResponse.json(
        { error: "Valid phone number is required" },
        { status: 400 }
      );
    }

    // Limit seats to maximum of 4
    if (numberOfSeats < 1 || numberOfSeats > 4) {
      return NextResponse.json(
        { error: "Number of seats must be between 1 and 4" },
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

    // Check seat availability if event has maxSeats limit
    if (event.maxSeats !== null) {
      // Count total reserved seats (only confirmed and pending tickets)
      const reservedSeats = await prisma.ticket.aggregate({
        where: {
          eventId,
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

      if (availableSeats <= 0) {
        return NextResponse.json(
          { error: "Event is fully booked", availableSeats: 0 },
          { status: 400 }
        );
      }

      if (numberOfSeats > availableSeats) {
        return NextResponse.json(
          {
            error: `Only ${availableSeats} seats available`,
            availableSeats,
          },
          { status: 400 }
        );
      }
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        holderName: holderName.trim(),
        holderEmail: holderEmail.trim().toLowerCase(),
        holderPhone: holderPhone?.trim() || null,
        numberOfSeats: Math.min(numberOfSeats || 1, 4), // Ensure max 4 seats
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

    // Get the base URL for ticket link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const ticketUrl = `${baseUrl}/ticket-summary/${ticket.accessToken}`;

    // Format date for email
    const eventDate = new Date(event.eventDate).toLocaleDateString("he-IL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send confirmation email (don't block response on email failure)
    sendEmail({
      to: ticket.holderEmail,
      subject: getTicketConfirmationSubject(event.title, "he"),
      html: generateTicketConfirmationEmail({
        holderName: ticket.holderName,
        eventTitle: event.title,
        eventDate,
        eventTime: event.eventTime || undefined,
        eventLocation: event.location || undefined,
        numberOfSeats: ticket.numberOfSeats,
        ticketUrl,
        locale: "he",
      }),
    }).then((result) => {
      if (!result.success) {
        console.error("Failed to send ticket confirmation email:", result.error);
      } else {
        console.log("Ticket confirmation email sent successfully");
      }
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

// GET - List all tickets (admin only)
export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.email ||
      !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
