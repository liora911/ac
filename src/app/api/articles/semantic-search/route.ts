import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import {
  generateEmbedding,
  findSimilarByEmbedding,
} from "@/lib/embeddings/embeddings";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

/**
 * POST /api/articles/semantic-search
 * Search articles by semantic similarity
 *
 * Body: { query: string, limit?: number, minSimilarity?: number }
 */
export async function POST(req: Request) {
  try {
    // Rate limiting - 20 requests per minute per IP
    const ip = getClientIP(req);
    const rateLimitResult = rateLimiters.assistant(ip); // Reuse assistant rate limiter

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment before trying again.",
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

    const body = await req.json();
    const { query, limit = 10, minSimilarity = 0.3 } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query.trim());

    // Get all articles with embeddings
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        NOT: {
          embedding: { isEmpty: true },
        },
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        articleImage: true,
        publisherName: true,
        readDuration: true,
        isPremium: true,
        createdAt: true,
        embedding: true,
        authors: {
          select: {
            name: true,
            imageUrl: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (articles.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No articles with embeddings found. Please generate embeddings first.",
      });
    }

    // Find similar articles
    const similarArticles = findSimilarByEmbedding(
      queryEmbedding,
      articles.map((a: typeof articles[0]) => ({ id: a.id, embedding: a.embedding })),
      limit,
      minSimilarity
    );

    // Build response with full article data
    const results = similarArticles.map((match: { id: string; similarity: number }) => {
      const article = articles.find((a: typeof articles[0]) => a.id === match.id)!;
      return {
        id: article.id,
        title: article.title,
        subtitle: article.subtitle,
        slug: article.slug,
        articleImage: article.articleImage,
        publisherName: article.publisherName,
        readDuration: article.readDuration,
        isPremium: article.isPremium,
        createdAt: article.createdAt,
        authors: article.authors,
        categories: article.categories.map((c: typeof article.categories[0]) => c.category),
        similarity: Math.round(match.similarity * 100), // Convert to percentage
      };
    });

    return NextResponse.json({
      results,
      query: query.trim(),
      totalMatches: results.length,
    });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/articles/semantic-search?q=query
 * Alternative GET endpoint for simpler integration
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "10");
  const minSimilarity = parseFloat(searchParams.get("minSimilarity") || "0.3");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  // Create a fake request body and delegate to POST handler
  const fakeReq = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ query, limit, minSimilarity }),
  });

  return POST(fakeReq);
}
