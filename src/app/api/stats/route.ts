import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    // Get the start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all counts in parallel
    const [
      totalArticles,
      monthlyArticles,
      totalEvents,
      monthlyEvents,
      totalLectures,
      monthlyLectures,
      totalPresentations,
      monthlyPresentations,
    ] = await Promise.all([
      // Total counts
      prisma.article.count(),
      prisma.article.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.event.count(),
      prisma.event.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.lecture.count(),
      prisma.lecture.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.presentation.count(),
      prisma.presentation.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return NextResponse.json({
      articles: {
        total: totalArticles,
        thisMonth: monthlyArticles,
      },
      events: {
        total: totalEvents,
        thisMonth: monthlyEvents,
      },
      lectures: {
        total: totalLectures,
        thisMonth: monthlyLectures,
      },
      presentations: {
        total: totalPresentations,
        thisMonth: monthlyPresentations,
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
