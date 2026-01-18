import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { ALLOWED_EMAILS } from "@/constants/auth";
import {
  generateEmbedding,
  prepareArticleForEmbedding,
  EMBEDDING_MODEL,
} from "@/lib/embeddings/embeddings";

/**
 * POST /api/articles/embeddings
 * Generate embeddings for articles that don't have them yet
 * Admin only
 */
export async function POST(req: Request) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { articleId, regenerate = false } = body;

    // If specific article ID provided, process just that one
    if (articleId) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      if (!article) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }

      const textForEmbedding = prepareArticleForEmbedding(article);
      const embedding = await generateEmbedding(textForEmbedding);

      await prisma.article.update({
        where: { id: articleId },
        data: {
          embedding,
          embeddingModel: EMBEDDING_MODEL,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Embedding generated for article",
        articleId,
      });
    }

    // Get all articles and filter those without embeddings
    const allArticles = await prisma.article.findMany({
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter articles without embeddings (unless regenerate is true)
    const articles = regenerate
      ? allArticles
      : allArticles.filter((a) => !a.embedding || a.embedding.length === 0);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All articles already have embeddings",
        processed: 0,
      });
    }

    // Process articles one by one to avoid rate limits
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const article of articles) {
      try {
        const textForEmbedding = prepareArticleForEmbedding(article);
        const embedding = await generateEmbedding(textForEmbedding);

        await prisma.article.update({
          where: { id: article.id },
          data: {
            embedding,
            embeddingModel: EMBEDDING_MODEL,
          },
        });

        results.processed++;

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Article ${article.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} articles`,
      ...results,
      total: articles.length,
    });
  } catch (error) {
    console.error("Embedding generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/articles/embeddings
 * Get embedding status for articles
 * Admin only
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all articles and count in JavaScript
    const allArticles = await prisma.article.findMany({
      select: { id: true, embedding: true },
    });

    const totalArticles = allArticles.length;
    const articlesWithEmbeddings = allArticles.filter(
      (a) => a.embedding && a.embedding.length > 0
    ).length;

    return NextResponse.json({
      total: totalArticles,
      withEmbeddings: articlesWithEmbeddings,
      withoutEmbeddings: totalArticles - articlesWithEmbeddings,
      progress: totalArticles > 0
        ? Math.round((articlesWithEmbeddings / totalArticles) * 100)
        : 100,
    });
  } catch (error) {
    console.error("Embedding status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
