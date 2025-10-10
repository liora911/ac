import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
