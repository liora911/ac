import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, parentId } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description: description || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
