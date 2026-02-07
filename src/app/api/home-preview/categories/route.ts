import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

// Returns categories that have content, with up to 9 items each (articles, lectures, presentations)
// Client shuffles and picks 3 per category
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { articles: { some: { published: true } } },
          { lectures: { some: {} } },
          { presentations: { some: { published: true } } },
        ],
      },
      select: {
        id: true,
        name: true,
        articles: {
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
          orderBy: { createdAt: "desc" },
          take: 9,
        },
        lectures: {
          select: {
            id: true,
            title: true,
            description: true,
            bannerImageUrl: true,
            videoUrl: true,
            isPremium: true,
          },
          orderBy: { createdAt: "desc" },
          take: 9,
        },
        presentations: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            isPremium: true,
          },
          orderBy: { createdAt: "desc" },
          take: 9,
        },
      },
      orderBy: { name: "asc" },
    });

    // Filter out categories with no items at all
    const filtered = categories.filter(
      (cat) =>
        cat.articles.length > 0 ||
        cat.lectures.length > 0 ||
        cat.presentations.length > 0
    );

    return NextResponse.json(filtered, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Category discover API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
