import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

// GET /api/lectures/[id] - Fetch single lecture by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    return NextResponse.json(lecture);
  } catch (error) {
    console.error("Error fetching lecture:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecture" },
      { status: 500 }
    );
  }
}

// PUT /api/lectures/[id] - Update lecture by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if lecture exists and user is the author
    const existingLecture = await prisma.lecture.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    if (existingLecture.author.email !== session.user.email) {
      return NextResponse.json(
        { error: "You can only edit your own lectures" },
        { status: 403 }
      );
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

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }

    const updatedLecture = await prisma.lecture.update({
      where: { id },
      data: {
        title,
        description,
        videoUrl: videoUrl || null,
        duration,
        date: date || null,
        bannerImageUrl: bannerImageUrl || null,
        categoryId,
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

    return NextResponse.json(updatedLecture);
  } catch (error) {
    console.error("Error updating lecture:", error);
    return NextResponse.json(
      { error: "Failed to update lecture" },
      { status: 500 }
    );
  }
}
