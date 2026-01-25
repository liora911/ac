import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import type { ArticlePreview, CategoryWithArticles, FooterSitemapData } from "@/types/Sitemap/footer-sitemap";

// Cache for 24 hours (aggressive caching for footer sitemap)
let cachedData: FooterSitemapData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid (24 hours)
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          // Cache for 24 hours, allow stale for 48 hours while revalidating
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
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
        articles: cat.articles
          .filter((article) => article.slug) // Only include articles with slugs
          .map((article) => ({
            id: article.id,
            title: article.title,
            slug: article.slug as string,
          })),
      })),
    };

    // Update cache
    cachedData = responseData;
    cacheTimestamp = now;

    return NextResponse.json(responseData, {
      headers: {
        // Cache for 24 hours, allow stale for 48 hours while revalidating
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
        "X-Cache": "MISS",
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
