import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import type { BrowseData, BrowseCategoryItem, ContentCounts } from "@/types/Browse/browse";

// Cache for 1 hour
let cachedData: BrowseData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  parentId: string | null;
}

async function getAllCountsBatch(categoryIds: string[]): Promise<Map<string, ContentCounts>> {
  // Run 4 groupBy queries in parallel instead of 4*N individual count queries
  const [articleCounts, lectureCounts, presentationCounts, eventCounts] = await Promise.all([
    prisma.articleCategory.groupBy({
      by: ["categoryId"],
      where: {
        categoryId: { in: categoryIds },
        article: { published: true },
      },
      _count: true,
    }),
    prisma.lecture.groupBy({
      by: ["categoryId"],
      where: {
        categoryId: { in: categoryIds },
      },
      _count: true,
    }),
    prisma.presentation.groupBy({
      by: ["categoryId"],
      where: {
        published: true,
        categoryId: { in: categoryIds },
      },
      _count: true,
    }),
    prisma.event.groupBy({
      by: ["categoryId"],
      where: {
        published: true,
        categoryId: { in: categoryIds },
      },
      _count: true,
    }),
  ]);

  // Build lookup maps
  const articleMap = new Map(articleCounts.map((r) => [r.categoryId, r._count]));
  const lectureMap = new Map(lectureCounts.map((r) => [r.categoryId, r._count]));
  const presentationMap = new Map(presentationCounts.map((r) => [r.categoryId, r._count]));
  const eventMap = new Map(eventCounts.map((r) => [r.categoryId, r._count]));

  const result = new Map<string, ContentCounts>();
  for (const id of categoryIds) {
    const articles = articleMap.get(id) ?? 0;
    const lectures = lectureMap.get(id) ?? 0;
    const presentations = presentationMap.get(id) ?? 0;
    const events = eventMap.get(id) ?? 0;
    result.set(id, {
      articles,
      lectures,
      presentations,
      events,
      total: articles + lectures + presentations + events,
    });
  }

  return result;
}

function buildCategoryTree(
  categories: CategoryRow[],
  countsMap: Map<string, ContentCounts>
): BrowseCategoryItem[] {
  const emptyCounts: ContentCounts = { articles: 0, lectures: 0, presentations: 0, events: 0, total: 0 };

  // Build tree in memory (no async needed)
  const rootCategories = categories.filter((cat) => !cat.parentId);

  function buildSubtree(category: CategoryRow): BrowseCategoryItem {
    const counts = countsMap.get(category.id) ?? emptyCounts;
    const subcategories = categories.filter((cat) => cat.parentId === category.id);

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      bannerImageUrl: category.bannerImageUrl,
      parentId: category.parentId,
      counts,
      subcategories: subcategories.map((sub) => buildSubtree(sub)),
    };
  }

  return rootCategories.map((cat) => buildSubtree(cat));
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid (1 hour)
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
          "X-Cache": "HIT",
        },
      });
    }

    // Fetch ALL categories (no filtering by content)
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        bannerImageUrl: true,
        parentId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Batch-fetch all counts in 4 queries total (instead of 4 * N)
    const categoryIds = allCategories.map((cat) => cat.id);
    const countsMap = await getAllCountsBatch(categoryIds);

    // Build hierarchical tree (synchronous — no DB calls)
    const categoryTree = buildCategoryTree(allCategories, countsMap);

    // Calculate total counts
    const totalCounts: ContentCounts = categoryTree.reduce(
      (acc, cat) => {
        acc.articles += cat.counts.articles;
        acc.lectures += cat.counts.lectures;
        acc.presentations += cat.counts.presentations;
        acc.events += cat.counts.events;
        acc.total += cat.counts.total;
        return acc;
      },
      { articles: 0, lectures: 0, presentations: 0, events: 0, total: 0 }
    );

    const responseData: BrowseData = {
      categories: categoryTree,
      totalCounts,
    };

    // Update cache
    cachedData = responseData;
    cacheTimestamp = now;

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error fetching browse data:", error);
    return NextResponse.json(
      { error: "Failed to fetch browse data" },
      { status: 500 }
    );
  }
}
