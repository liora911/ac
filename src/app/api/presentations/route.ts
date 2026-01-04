import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { ALLOWED_EMAILS } from "@/constants/auth";

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const prismaCategories = await prisma.category.findMany({
      include: {
        presentations: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
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
      bannerImageUrl: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
      presentations: (typeof prismaCategories)[number]["presentations"];
      subcategories: TreeCategory[];
    };

    const byId = new Map<string, TreeCategory>();

    prismaCategories.forEach((cat) => {
      byId.set(cat.id, {
        id: cat.id,
        name: cat.name,
        bannerImageUrl: cat.bannerImageUrl,
        parentId: cat.parentId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        presentations: cat.presentations,
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

    return NextResponse.json(roots);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch presentations - ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const session = await getServerSession(authOptions);

    if (
      !session?.user?.email ||
      !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      imageUrls,
      categoryId,
      googleSlidesUrl,
      pdfUrl,
    } = body;

    if (!title || !description || !content || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const presentation = await prisma.presentation.create({
      data: {
        title,
        description,
        content,
        googleSlidesUrl: googleSlidesUrl || null,
        pdfUrl: pdfUrl || null,
        imageUrls: imageUrls || [],
        categoryId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json(presentation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create presentation" },
      { status: 500 }
    );
  }
}
