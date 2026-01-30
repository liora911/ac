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

  // Get user details with createdAt (emailVerified as proxy for join date)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
    },
  });

  // Get subscription details
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  // Get ticket count
  const ticketCount = await prisma.ticket.count({
    where: { userId: session.user.id },
  });

  // Get favorites count - only count favorites where content actually exists
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { itemId: true, itemType: true },
  });

  const articleIds = favorites.filter(f => f.itemType === "ARTICLE").map(f => f.itemId);
  const lectureIds = favorites.filter(f => f.itemType === "LECTURE").map(f => f.itemId);
  const presentationIds = favorites.filter(f => f.itemType === "PRESENTATION").map(f => f.itemId);

  const [articlesCount, lecturesCount, presentationsCount] = await Promise.all([
    articleIds.length > 0
      ? prisma.article.count({ where: { id: { in: articleIds }, published: true } })
      : 0,
    lectureIds.length > 0
      ? prisma.lecture.count({ where: { id: { in: lectureIds } } })
      : 0,
    presentationIds.length > 0
      ? prisma.presentation.count({ where: { id: { in: presentationIds }, published: true } })
      : 0,
  ]);

  const favoritesCount = articlesCount + lecturesCount + presentationsCount;

  return (
    <AccountClient
      user={{
        id: session.user.id,
        name: user?.name || session.user.name,
        email: user?.email || session.user.email,
        role: session.user.role,
        createdAt: user?.emailVerified?.toISOString(),
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
      favoritesCount={favoritesCount}
    />
  );
}
