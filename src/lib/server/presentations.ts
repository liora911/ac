import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type { PresentationCategory } from "@/types/Presentations/presentations";

export async function fetchPresentations(): Promise<PresentationCategory[]> {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const categories = await prisma.category.findMany({
    include: {
      presentations: {
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
          createdAt: "desc",
        },
      },
    },
  });

  return categories;
}

export async function fetchPresentation(id: string) {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const session = await getServerSession(authOptions);
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const presentation = await prisma.presentation.findUnique({
    where: { id },
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
  });

  if (!presentation) {
    return null;
  }

  // Only return published presentations to unauthorized users
  // For now, we'll assume all presentations are accessible
  // You can add authorization logic here if needed

  return presentation;
}
