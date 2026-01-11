import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

// GET /api/favorites/full - Get all favorites with full item data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Group favorites by type
    const articleIds = favorites
      .filter((f) => f.itemType === "ARTICLE")
      .map((f) => f.itemId);
    const lectureIds = favorites
      .filter((f) => f.itemType === "LECTURE")
      .map((f) => f.itemId);
    const presentationIds = favorites
      .filter((f) => f.itemType === "PRESENTATION")
      .map((f) => f.itemId);

    // Fetch full data for each type
    const [articles, lectures, presentations] = await Promise.all([
      articleIds.length > 0
        ? prisma.article.findMany({
            where: { id: { in: articleIds }, published: true },
            include: {
              category: { select: { id: true, name: true } },
              authors: { select: { id: true, name: true, imageUrl: true } },
            },
          })
        : [],
      lectureIds.length > 0
        ? prisma.lecture.findMany({
            where: { id: { in: lectureIds } },
            select: {
              id: true,
              title: true,
              description: true,
              bannerImageUrl: true,
              videoUrl: true,
              duration: true,
              isPremium: true,
              createdAt: true,
              category: { select: { id: true, name: true } },
            },
          })
        : [],
      presentationIds.length > 0
        ? prisma.presentation.findMany({
            where: { id: { in: presentationIds }, published: true },
            include: {
              category: { select: { id: true, name: true } },
            },
          })
        : [],
    ]);

    // Sort by favorite creation date
    const sortByFavoriteDate = <T extends { id: string }>(
      items: T[],
      ids: string[]
    ): T[] => {
      const idOrder = new Map(ids.map((id, index) => [id, index]));
      return [...items].sort(
        (a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0)
      );
    };

    return NextResponse.json({
      articles: sortByFavoriteDate(articles, articleIds),
      lectures: sortByFavoriteDate(lectures, lectureIds),
      presentations: sortByFavoriteDate(presentations, presentationIds),
      counts: {
        articles: articles.length,
        lectures: lectures.length,
        presentations: presentations.length,
        total: articles.length + lectures.length + presentations.length,
      },
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
