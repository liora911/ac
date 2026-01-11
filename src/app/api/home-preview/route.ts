import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

// Dedicated endpoint for home page preview - returns recent items from each category
export async function GET(request: NextRequest) {
  try {
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
      articles.length + presentations.length + events.length + lectures.length;

    return NextResponse.json(
      {
        articles,
        presentations,
        events,
        lectures,
        total,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Home preview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
