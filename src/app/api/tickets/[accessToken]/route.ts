import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get ticket by access token (public access with token)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { accessToken },
      include: {
        event: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: ticket.id,
      holderName: ticket.holderName,
      holderEmail: ticket.holderEmail,
      holderPhone: ticket.holderPhone,
      numberOfSeats: ticket.numberOfSeats,
      status: ticket.status,
      notes: ticket.notes,
      accessToken: ticket.accessToken,
      createdAt: ticket.createdAt,
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
        description: ticket.event.description,
        eventType: ticket.event.eventType,
        location: ticket.event.location,
        onlineUrl: ticket.event.onlineUrl,
        eventDate: ticket.event.eventDate,
        eventTime: ticket.event.eventTime,
        bannerImageUrl: ticket.event.bannerImageUrl,
        category: {
          id: ticket.event.category.id,
          name: ticket.event.category.name,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket status (admin only - will add auth later)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;
    const body = await request.json();
    const { status } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "ATTENDED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { accessToken },
      data: { status },
      include: {
        event: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Instead of deleting, mark as cancelled
    const ticket = await prisma.ticket.update({
      where: { accessToken },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      message: "Ticket cancelled successfully",
      id: ticket.id,
    });
  } catch (error) {
    console.error("Error cancelling ticket:", error);
    return NextResponse.json(
      { error: "Failed to cancel ticket" },
      { status: 500 }
    );
  }
}
