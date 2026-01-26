import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import type { PresentationTreeCategory } from "@/types/Presentations/presentations-api";

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

    const byId = new Map<string, PresentationTreeCategory>();

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

    const roots: PresentationTreeCategory[] = [];

    byId.forEach((cat) => {
      if (cat.parentId && byId.has(cat.parentId)) {
        const parent = byId.get(cat.parentId)!;
        parent.subcategories.push(cat);
      } else {
        roots.push(cat);
      }
    });

    // Filter out categories with 0 presentations (including subcategories)
    function filterEmptyCategories(categories: PresentationTreeCategory[]): PresentationTreeCategory[] {
      return categories
        .map((cat) => ({
          ...cat,
          subcategories: filterEmptyCategories(cat.subcategories),
        }))
        .filter((cat) => cat.presentations.length > 0 || cat.subcategories.length > 0);
    }

    const filteredRoots = filterEmptyCategories(roots);

    return NextResponse.json(filteredRoots);
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

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }
    const { user } = auth;

    const body = await request.json();
    const {
      title,
      description,
      content,
      imageUrls,
      categoryId,
      googleSlidesUrl,
      pdfUrl,
      isPremium = false,
    } = body;

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields (title and category)" },
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

    const presentation = await prisma.presentation.create({
      data: {
        title,
        description: description || "",
        content: content || "",
        googleSlidesUrl: googleSlidesUrl || null,
        pdfUrl: pdfUrl || null,
        imageUrls: imageUrls || [],
        categoryId,
        authorId: user.id,
        isPremium,
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
