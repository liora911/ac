import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

// Cache for 30 minutes
let cachedData: FooterSitemapData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface ArticlePreview {
  id: string;
  title: string;
  slug: string;
}

interface CategoryWithArticles {
  id: string;
  name: string;
  articles: ArticlePreview[];
}

interface FooterSitemapData {
  categories: CategoryWithArticles[];
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    // Get all categories that have published articles
    const categoriesWithArticles = await prisma.category.findMany({
      where: {
        articles: {
          some: {
            published: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        articles: {
          where: {
            published: true,
          },
          select: {
            id: true,
            title: true,
            slug: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Max 5 articles per category
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const responseData: FooterSitemapData = {
      categories: categoriesWithArticles.map((cat) => ({
        id: cat.id,
        name: cat.name,
        articles: cat.articles,
      })),
    };

    // Update cache
    cachedData = responseData;
    cacheTimestamp = now;

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching footer sitemap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch footer sitemap data" },
      { status: 500 }
    );
  }
}
