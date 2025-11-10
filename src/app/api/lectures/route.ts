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
    author: lec.author,
  };
}

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
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
        },
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
    });

    const formattedCategories: Category[] = categories.map(
      (cat: CategoryWithLectures) => ({
        id: cat.id,
        name: cat.name,
        bannerImageUrl: cat.bannerImageUrl || undefined,
        lectures: cat.lectures.map(formatLecture),
        subcategories: cat.subcategories.map(
          (sub: SubcategoryWithLectures) => ({
            id: sub.id,
            name: sub.name,
            bannerImageUrl: sub.bannerImageUrl || undefined,
            lectures: sub.lectures.map(formatLecture),
            subcategories: [],
          })
        ),
      })
    );

    return NextResponse.json(formattedCategories);
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
    } = body;

    if (!title || !description || !categoryId || !duration) {
      return NextResponse.json(
        { error: "Title, description, categoryId, and duration are required" },
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
        description,
        videoUrl: videoUrl || null,
        duration,
        date: date || null,
        bannerImageUrl: bannerImageUrl || null,
        categoryId,
        authorId: user.id,
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
