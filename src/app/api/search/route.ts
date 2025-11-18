import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (query === null) {
      return NextResponse.json({
        articles: [],
        presentations: [],
        events: [],
        lectures: [],
        total: 0,
      });
    }

    const searchTerm = query.trim();

    if (searchTerm === "") {
      const [articles, presentations, events, lectures] = await Promise.all([
        prisma.article.findMany({
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.presentation.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.event.findMany({
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            location: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { eventDate: "desc" },
          take: 10,
        }),
        prisma.lecture.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const combined = [
        ...articles.map((item) => ({ ...item, __type: "articles" as const })),
        ...presentations.map((item) => ({
          ...item,
          __type: "presentations" as const,
        })),
        ...events.map((item) => ({ ...item, __type: "events" as const })),
        ...lectures.map((item) => ({ ...item, __type: "lectures" as const })),
      ];

      const shuffled = combined.sort(() => Math.random() - 0.5);
      const limited = shuffled.slice(0, 10);

      const mixedArticles = limited
        .filter((item) => item.__type === "articles")
        .map(({ __type, ...rest }) => rest);
      const mixedPresentations = limited
        .filter((item) => item.__type === "presentations")
        .map(({ __type, ...rest }) => rest);
      const mixedEvents = limited
        .filter((item) => item.__type === "events")
        .map(({ __type, ...rest }) => rest);
      const mixedLectures = limited
        .filter((item) => item.__type === "lectures")
        .map(({ __type, ...rest }) => rest);

      const total =
        mixedArticles.length +
        mixedPresentations.length +
        mixedEvents.length +
        mixedLectures.length;

      return NextResponse.json({
        articles: mixedArticles,
        presentations: mixedPresentations,
        events: mixedEvents,
        lectures: mixedLectures,
        total,
        query: searchTerm,
      });
    }

    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
        published: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const presentations = await prisma.presentation.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { location: { contains: searchTerm, mode: "insensitive" } },
        ],
        published: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { eventDate: "desc" },
      take: 10,
    });

    const lectures = await prisma.lecture.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const total =
      articles.length + presentations.length + events.length + lectures.length;

    return NextResponse.json({
      articles,
      presentations,
      events,
      lectures,
      total,
      query: searchTerm,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
