import { Category } from "@/types/Lectures/lectures";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

type LectureWithAuthor = any;
type SubcategoryWithLectures = any;
type CategoryWithLectures = any;

function formatLecture(lec: LectureWithAuthor) {
  return {
    id: lec.id,
    title: lec.title,
    description: lec.description,
    videoUrl: lec.videoUrl || undefined,
    duration: lec.duration,
    date: lec.date || undefined,
    bannerImageUrl: lec.bannerImageUrl || undefined,
    isPremium: lec.isPremium ?? false,
    author: lec.author,
    createdAt: lec.createdAt,
  };
}

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const prismaCategories = await prisma.category.findMany({
      include: {
        lectures: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    type TreeCategory = {
      id: string;
      name: string;
      bannerImageUrl?: string;
      parentId: string | null;
      lectures: ReturnType<typeof formatLecture>[];
      subcategories: TreeCategory[];
    };

    const byId = new Map<string, TreeCategory>();

    prismaCategories.forEach((cat) => {
      byId.set(cat.id, {
        id: cat.id,
        name: cat.name,
        bannerImageUrl: cat.bannerImageUrl || undefined,
        parentId: cat.parentId,
        lectures: cat.lectures.map(formatLecture),
        subcategories: [],
      });
    });

    const roots: TreeCategory[] = [];

    byId.forEach((cat) => {
      if (cat.parentId && byId.has(cat.parentId)) {
        const parent = byId.get(cat.parentId)!;
        parent.subcategories.push(cat);
      } else {
        roots.push(cat);
      }
    });

    // Helper to count total lectures in a category (including subcategories)
    function getTotalLectureCount(cat: TreeCategory): number {
      let count = cat.lectures.length;
      for (const sub of cat.subcategories) {
        count += getTotalLectureCount(sub);
      }
      return count;
    }

    // Filter out categories with 0 lectures (including subcategories)
    function filterEmptyCategories(categories: TreeCategory[]): TreeCategory[] {
      return categories
        .map((cat) => ({
          ...cat,
          subcategories: filterEmptyCategories(cat.subcategories),
        }))
        .filter((cat) => cat.lectures.length > 0 || cat.subcategories.length > 0);
    }

    const filteredRoots = filterEmptyCategories(roots);

    return NextResponse.json(filteredRoots);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch lecture data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      videoUrl,
      duration,
      date,
      bannerImageUrl,
      categoryId,
      isPremium = false,
    } = body;

    if (!title || !categoryId || !duration) {
      return NextResponse.json(
        { error: "Title, categoryId, and duration are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }

    const lecture = await prisma.lecture.create({
      data: {
        title,
        description: description || "",
        videoUrl: videoUrl || null,
        duration,
        date: date || null,
        bannerImageUrl: bannerImageUrl || null,
        categoryId,
        authorId: user.id,
        isPremium,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json(lecture, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create lecture" },
      { status: 500 }
    );
  }
}
