import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/stripe";
import prisma from "@/lib/prisma/prisma";
import Stripe from "stripe";
import { sendEmail } from "@/lib/email/resend";
import {
  generatePaymentConfirmationEmail,
  getPaymentConfirmationSubject,
} from "@/lib/email/templates/payment-confirmation";
import { formatPriceSimple } from "@/lib/utils/currency";

// Disable body parsing - we need the raw body for webhook verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (session.mode === "payment" && metadata?.ticketId) {
    // One-time payment for event ticket
    const ticket = await prisma.ticket.update({
      where: { id: metadata.ticketId },
      data: {
        status: "CONFIRMED",
        paymentId: session.payment_intent as string,
        paymentStatus: "succeeded",
        stripeSessionId: session.id,
      },
      include: {
        event: true,
      },
    });
    console.log(`Ticket ${metadata.ticketId} confirmed`);

    // Send payment confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const ticketUrl = `${baseUrl}/ticket-summary/${ticket.accessToken}`;

    const eventDate = new Date(ticket.event.eventDate).toLocaleDateString("he-IL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format amount paid (convert from cents to currency)
    const amountPaid = session.amount_total
      ? formatPriceSimple(session.amount_total)
      : "";

    sendEmail({
      to: ticket.holderEmail,
      subject: getPaymentConfirmationSubject(ticket.event.title, "he"),
      html: generatePaymentConfirmationEmail({
        holderName: ticket.holderName,
        eventTitle: ticket.event.title,
        eventDate,
        eventTime: ticket.event.eventTime || undefined,
        eventLocation: ticket.event.location || undefined,
        numberOfSeats: ticket.numberOfSeats,
        ticketUrl,
        amountPaid,
        locale: "he",
      }),
    }).then((result) => {
      if (!result.success) {
        console.error("Failed to send payment confirmation email:", result.error);
      } else {
        console.log("Payment confirmation email sent successfully");
      }
    });
  } else if (session.mode === "subscription" && metadata?.userId) {
    // Subscription checkout completed
    // The subscription.created webhook will handle the subscription record
    console.log(`Subscription checkout completed for user ${metadata.userId}`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!user) {
      console.error("Could not find user for subscription:", subscription.id);
      return;
    }

    await upsertSubscription(user.id, subscription);
  } else {
    await upsertSubscription(userId, subscription);
  }
}

async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const status = mapSubscriptionStatus(subscription.status);

  // Access period timestamps - these are snake_case in the API response
  const subscriptionAny = subscription as unknown as Record<string, unknown>;
  const currentPeriodStart = (subscriptionAny.current_period_start as number) || Math.floor(Date.now() / 1000);
  const currentPeriodEnd = (subscriptionAny.current_period_end as number) || Math.floor(Date.now() / 1000);
  const cancelAtPeriodEnd = (subscriptionAny.cancel_at_period_end as boolean) || false;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id || "",
      status,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd,
    },
    update: {
      status,
      stripePriceId: subscription.items.data[0]?.price.id || "",
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd,
    },
  });

  console.log(`Subscription ${subscription.id} updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "CANCELED" },
  });

  console.log(`Subscription ${subscription.id} canceled`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Access subscription from invoice - may be string ID or expanded object
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subscriptionId = invoiceAny.subscription as string | null;

  if (!subscriptionId) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: "PAST_DUE" },
  });

  console.log(`Payment failed for subscription ${subscriptionId}`);
}

function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "canceled":
      return "CANCELED";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "EXPIRED";
    default:
      return "EXPIRED";
  }
}
