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
      // When no search query, return recent items from each category (5 each)
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
            isPremium: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.presentation.findMany({
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            isPremium: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
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
          take: 5,
        }),
        prisma.lecture.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            createdAt: true,
            updatedAt: true,
            isPremium: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      const total =
        articles.length +
        presentations.length +
        events.length +
        lectures.length;

      return NextResponse.json({
        articles,
        presentations,
        events,
        lectures,
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
        isPremium: true,
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
        published: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        isPremium: true,
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
        isPremium: true,
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
