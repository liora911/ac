import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { deleteBlob } from "@/actions/upload";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingLecture = await prisma.lecture.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const isAuthorized =
      session.user.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized to edit lectures" },
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
      isPremium,
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

    const updatedLecture = await prisma.lecture.update({
      where: { id },
      data: {
        title,
        description: description || "",
        videoUrl: videoUrl || null,
        duration,
        date: date || null,
        bannerImageUrl: bannerImageUrl || null,
        categoryId,
        isPremium: isPremium ?? false,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      session.user.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized to delete lectures" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingLecture = await prisma.lecture.findUnique({
      where: { id },
    });

    if (!existingLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Delete associated blob file (banner image)
    if (existingLecture.bannerImageUrl) {
      await deleteBlob(existingLecture.bannerImageUrl);
    }

    await prisma.lecture.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    return NextResponse.json(
      { error: "Failed to delete lecture" },
      { status: 500 }
    );
  }
}
