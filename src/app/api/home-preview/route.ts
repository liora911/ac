import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

const DEFAULT_LIMIT = 9;

// Dedicated endpoint for home page preview - returns recent items from each category
// Supports pagination via query params: type, skip, limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);

    // If type is specified, return paginated results for that type only
    if (type) {
      let items: unknown[] = [];
      let hasMore = false;

      switch (type) {
        case "articles":
          items = await prisma.article.findMany({
            where: { published: true },
            select: {
              id: true,
              slug: true,
              title: true,
              subtitle: true,
              articleImage: true,
              isPremium: true,
              isFeatured: true,
            },
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
            skip,
            take: limit + 1,
          });
          break;

        case "featuredArticles":
          items = await prisma.article.findMany({
            where: { published: true, isFeatured: true },
            select: {
              id: true,
              slug: true,
              title: true,
              subtitle: true,
              articleImage: true,
              isPremium: true,
              isFeatured: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit + 1,
          });
          break;

        case "presentations":
          items = await prisma.presentation.findMany({
            where: { published: true },
            select: {
              id: true,
              title: true,
              description: true,
              imageUrls: true,
              isPremium: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit + 1,
          });
          break;

        case "events":
          items = await prisma.event.findMany({
            where: { published: true },
            select: {
              id: true,
              title: true,
              description: true,
              bannerImageUrl: true,
              isFeatured: true,
            },
            orderBy: [{ isFeatured: "desc" }, { eventDate: "desc" }],
            skip,
            take: limit + 1,
          });
          break;

        case "featuredEvents":
          items = await prisma.event.findMany({
            where: { published: true, isFeatured: true },
            select: {
              id: true,
              title: true,
              description: true,
              bannerImageUrl: true,
              isFeatured: true,
            },
            orderBy: { eventDate: "desc" },
            skip,
            take: limit + 1,
          });
          break;

        case "lectures":
          items = await prisma.lecture.findMany({
            select: {
              id: true,
              title: true,
              description: true,
              bannerImageUrl: true,
              videoUrl: true,
              isPremium: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit + 1,
          });
          break;

        default:
          return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }

      // Check if there are more items
      hasMore = items.length > limit;
      if (hasMore) {
        items = items.slice(0, limit);
      }

      return NextResponse.json(
        { items, hasMore },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // Default: return initial load for all types (9 items each)
    const [articles, featuredArticles, presentations, events, featuredEvents, lectures] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          articleImage: true,
          isPremium: true,
          isFeatured: true,
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: DEFAULT_LIMIT,
      }),
      prisma.article.findMany({
        where: { published: true, isFeatured: true },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          articleImage: true,
          isPremium: true,
          isFeatured: true,
        },
        orderBy: { createdAt: "desc" },
        take: DEFAULT_LIMIT,
      }),
      prisma.presentation.findMany({
        where: { published: true },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrls: true,
          isPremium: true,
        },
        orderBy: { createdAt: "desc" },
        take: DEFAULT_LIMIT,
      }),
      prisma.event.findMany({
        where: { published: true },
        select: {
          id: true,
          title: true,
          description: true,
          bannerImageUrl: true,
          isFeatured: true,
        },
        orderBy: [{ isFeatured: "desc" }, { eventDate: "desc" }],
        take: DEFAULT_LIMIT,
      }),
      prisma.event.findMany({
        where: { published: true, isFeatured: true },
        select: {
          id: true,
          title: true,
          description: true,
          bannerImageUrl: true,
          isFeatured: true,
        },
        orderBy: { eventDate: "desc" },
        take: DEFAULT_LIMIT,
      }),
      prisma.lecture.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          bannerImageUrl: true,
          videoUrl: true,
          isPremium: true,
        },
        orderBy: { createdAt: "desc" },
        take: DEFAULT_LIMIT,
      }),
    ]);

    const total =
      articles.length + presentations.length + events.length + lectures.length;

    return NextResponse.json(
      {
        articles,
        featuredArticles,
        presentations,
        events,
        featuredEvents,
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
