import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

// Hard cache - 1 hour
let cachedData: CachedSitemapData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CategoryNode {
  id: string;
  name: string;
  children: CategoryNode[];
  articleCount: number;
  lectureCount: number;
  presentationCount: number;
}

interface CachedSitemapData {
  categories: CategoryNode[];
  uncategorizedCounts: {
    articles: number;
    lectures: number;
    presentations: number;
  };
  upcomingEventsCount: number;
  stats: {
    totalArticles: number;
    totalLectures: number;
    totalPresentations: number;
    totalEvents: number;
    totalCategories: number;
  };
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid (1 hour hard cache)
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      const remainingSeconds = Math.floor((CACHE_DURATION - (now - cacheTimestamp)) / 1000);
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": `public, s-maxage=${remainingSeconds}, stale-while-revalidate=7200`,
          "X-Cache": "HIT",
          "X-Cache-Age": `${Math.floor((now - cacheTimestamp) / 1000)}s`,
        },
      });
    }

    // Use aggregation queries instead of fetching all records
    const [
      categories,
      articleCounts,
      lectureCounts,
      presentationCounts,
      totalArticles,
      totalLectures,
      totalPresentations,
      upcomingEventsCount,
      pastEventsCount,
    ] = await Promise.all([
      // Get categories (small table, OK to fetch all)
      prisma.category.findMany({
        select: { id: true, name: true, parentId: true },
        orderBy: { name: "asc" },
      }),

      // Count articles per category
      prisma.article.groupBy({
        by: ["categoryId"],
        where: { published: true },
        _count: { id: true },
      }),

      // Count lectures per category (Lecture model has no published field)
      prisma.lecture.groupBy({
        by: ["categoryId"],
        _count: { id: true },
      }),

      // Count presentations per category
      prisma.presentation.groupBy({
        by: ["categoryId"],
        where: { published: true },
        _count: { id: true },
      }),

      // Total counts
      prisma.article.count({ where: { published: true } }),
      prisma.lecture.count(), // Lecture model has no published field
      prisma.presentation.count({ where: { published: true } }),
      prisma.event.count({ where: { eventDate: { gte: new Date() } } }),
      prisma.event.count({ where: { eventDate: { lt: new Date() } } }),
    ]);

    // Create lookup maps for counts
    const articleCountMap = new Map(
      articleCounts.map((a) => [a.categoryId, a._count.id])
    );
    const lectureCountMap = new Map(
      lectureCounts.map((l) => [l.categoryId, l._count.id])
    );
    const presentationCountMap = new Map(
      presentationCounts.map((p) => [p.categoryId, p._count.id])
    );

    // Build category tree with counts only
    const buildCategoryTree = (parentId: string | null = null): CategoryNode[] => {
      return categories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          children: buildCategoryTree(cat.id),
          articleCount: articleCountMap.get(cat.id) || 0,
          lectureCount: lectureCountMap.get(cat.id) || 0,
          presentationCount: presentationCountMap.get(cat.id) || 0,
        }))
        .filter(
          (cat) =>
            cat.articleCount > 0 ||
            cat.lectureCount > 0 ||
            cat.presentationCount > 0 ||
            cat.children.length > 0
        );
    };

    const categoryTree = buildCategoryTree(null);

    // Calculate uncategorized counts
    const categorizedArticles = articleCounts
      .filter((a) => a.categoryId)
      .reduce((sum, a) => sum + a._count.id, 0);
    const categorizedLectures = lectureCounts
      .filter((l) => l.categoryId)
      .reduce((sum, l) => sum + l._count.id, 0);
    const categorizedPresentations = presentationCounts
      .filter((p) => p.categoryId)
      .reduce((sum, p) => sum + p._count.id, 0);

    const responseData: CachedSitemapData = {
      categories: categoryTree,
      uncategorizedCounts: {
        articles: totalArticles - categorizedArticles,
        lectures: totalLectures - categorizedLectures,
        presentations: totalPresentations - categorizedPresentations,
      },
      upcomingEventsCount,
      stats: {
        totalArticles,
        totalLectures,
        totalPresentations,
        totalEvents: upcomingEventsCount + pastEventsCount,
        totalCategories: categories.length,
      },
    };

    // Update cache
    cachedData = responseData;
    cacheTimestamp = now;

    return NextResponse.json(responseData, {
      headers: {
        // Cache for 1 hour on CDN, serve stale for up to 2 hours while revalidating
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching sitemap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sitemap data" },
      { status: 500 }
    );
  }
}
