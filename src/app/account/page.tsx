import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/account");
  }

  // Get subscription details
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  // Get ticket count
  const ticketCount = await prisma.ticket.count({
    where: { userId: session.user.id },
  });

  return (
    <AccountClient
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
      subscription={
        subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : null
      }
      ticketCount={ticketCount}
    />
  );
}
