import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/stripe";
import prisma from "@/lib/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      numberOfSeats,
      holderName,
      holderEmail,
      holderPhone,
      notes,
    } = body;

    if (!eventId || !numberOfSeats || !holderName || !holderEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.price) {
      return NextResponse.json(
        { error: "This event is free, no payment required" },
        { status: 400 }
      );
    }

    // Check seat availability
    if (event.maxSeats) {
      const bookedSeats = await prisma.ticket.aggregate({
        where: {
          eventId,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        _sum: { numberOfSeats: true },
      });
      const availableSeats =
        event.maxSeats - (bookedSeats._sum.numberOfSeats || 0);
      if (numberOfSeats > availableSeats) {
        return NextResponse.json(
          { error: `Only ${availableSeats} seats available` },
          { status: 400 }
        );
      }
    }

    // Get session for logged-in user
    const session = await getServerSession(authOptions);
    let customerId: string | undefined;

    if (session?.user) {
      customerId = await getOrCreateStripeCustomer(
        session.user.id,
        session.user.email!,
        session.user.name
      );
    }

    // Create pending ticket
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        userId: session?.user?.id,
        holderName,
        holderEmail,
        holderPhone,
        numberOfSeats,
        notes,
        status: "PENDING",
      },
    });

    // Calculate total price
    const totalPrice = event.price * numberOfSeats;

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : holderEmail,
      line_items: [
        {
          price_data: {
            currency: event.currency.toLowerCase(),
            product_data: {
              name: event.title,
              description: `${numberOfSeats} seat(s) for ${event.title}`,
            },
            unit_amount: event.price,
          },
          quantity: numberOfSeats,
        },
      ],
      metadata: {
        ticketId: ticket.id,
        eventId,
        userId: session?.user?.id || "",
      },
      success_url: `${process.env.NEXTAUTH_URL}/ticket-summary/${ticket.accessToken}?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/ticket-acquire?eventId=${eventId}&cancelled=true`,
    });

    // Update ticket with session ID
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
