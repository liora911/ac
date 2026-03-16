import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

// POST /api/articles/views — track a view
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId } = await req.json();
    if (!articleId) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }

    // Upsert: only keep the latest view per user+article (update viewedAt if exists)
    // First check if a view already exists
    const existing = await prisma.articleView.findFirst({
      where: { userId: session.user.id, articleId },
    });

    if (existing) {
      await prisma.articleView.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      });
    } else {
      await prisma.articleView.create({
        data: {
          userId: session.user.id,
          articleId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track article view:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/articles/views — get recently read articles for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const recentViews = await prisma.articleView.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: "desc" },
      take: 18,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            slug: true,
            articleImage: true,
            publisherName: true,
            readDuration: true,
            isPremium: true,
            isFeatured: true,
            createdAt: true,
            published: true,
            authors: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, imageUrl: true, order: true },
            },
            category: {
              select: { id: true, name: true },
            },
            categories: {
              include: {
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Filter out unpublished articles and map to a clean format
    const items = recentViews
      .filter((v) => v.article.published)
      .map((v) => ({
        id: v.article.id,
        title: v.article.title,
        subtitle: v.article.subtitle,
        slug: v.article.slug,
        articleImage: v.article.articleImage,
        publisherName: v.article.publisherName,
        readTime: v.article.readDuration,
        isPremium: v.article.isPremium,
        isFeatured: v.article.isFeatured,
        createdAt: v.article.createdAt.toISOString(),
        authors: v.article.authors,
        category: v.article.category,
        categories: v.article.categories.map((c) => c.category),
        viewedAt: v.viewedAt.toISOString(),
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch recently read:", error);
    return NextResponse.json({ items: [] });
  }
}
