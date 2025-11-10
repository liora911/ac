import prisma from "@/lib/prisma/prisma";

export async function fetchEvents() {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const events = await prisma.event.findMany({
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
      eventDate: "desc",
    },
  });

  return events;
}
