import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 30 requests per minute per IP
    const ip = getClientIP(request);
    const rateLimitResult = rateLimiters.search(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many search requests. Please slow down.",
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimitResult.resetIn / 1000)),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (query === null) {
      return NextResponse.json(
        {
          articles: [],
          presentations: [],
          events: [],
          lectures: [],
          total: 0,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    const searchTerm = query.trim();

    // Validate query length to prevent performance issues
    if (searchTerm.length > 200) {
      return NextResponse.json(
        { error: "Search query too long. Maximum 200 characters." },
        { status: 400 }
      );
    }

    // Require minimum 2 characters for search - return empty results for short/empty queries
    if (searchTerm.length < 2) {
      return NextResponse.json(
        {
          articles: [],
          presentations: [],
          events: [],
          lectures: [],
          total: 0,
          query: searchTerm,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    // Run all queries in parallel for better performance
    const [articles, presentations, events, lectures] = await Promise.all([
      prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
          ],
          published: true,
        },
        select: {
          id: true,
          slug: true,
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
      }),
      prisma.presentation.findMany({
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
      }),
      prisma.event.findMany({
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
      }),
      prisma.lecture.findMany({
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
        query: searchTerm,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
