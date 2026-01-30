import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import type { BrowseData, BrowseCategoryItem, ContentCounts } from "@/types/Browse/browse";

// Cache for 1 hour
let cachedData: BrowseData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getCategoryContentCounts(categoryId: string): Promise<ContentCounts> {
  const [articles, lectures, presentations, events] = await Promise.all([
    prisma.article.count({
      where: {
        published: true,
        categories: {
          some: {
            categoryId,
          },
        },
      },
    }),
    prisma.lecture.count({
      where: {
        categoryId,
      },
    }),
    prisma.presentation.count({
      where: {
        published: true,
        categoryId,
      },
    }),
    prisma.event.count({
      where: {
        published: true,
        categoryId,
      },
    }),
  ]);

  return {
    articles,
    lectures,
    presentations,
    events,
    total: articles + lectures + presentations + events,
  };
}

async function buildCategoryTree(categories: any[]): Promise<BrowseCategoryItem[]> {
  // Get all root categories (no parent)
  const rootCategories = categories.filter((cat) => !cat.parentId);

  // Recursively build tree with counts
  async function buildSubtree(category: any): Promise<BrowseCategoryItem> {
    const counts = await getCategoryContentCounts(category.id);
    const subcategories = categories.filter((cat) => cat.parentId === category.id);

    const subcategoryItems = await Promise.all(
      subcategories.map((sub) => buildSubtree(sub))
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      bannerImageUrl: category.bannerImageUrl,
      parentId: category.parentId,
      counts,
      subcategories: subcategoryItems,
    };
  }

  return Promise.all(rootCategories.map((cat) => buildSubtree(cat)));
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

    // Build hierarchical tree with counts
    const categoryTree = await buildCategoryTree(allCategories);

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
