import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { FavoriteType } from "@prisma/client";

const MAX_FAVORITES_PER_TYPE = 10;

// GET /api/favorites - Get all favorites for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as FavoriteType | null;

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        ...(type && { itemType: type }),
      },
      orderBy: { createdAt: "desc" },
    });

    // Return just the item IDs grouped by type for easy lookup
    const favoriteIds = {
      articles: favorites
        .filter((f) => f.itemType === "ARTICLE")
        .map((f) => f.itemId),
      lectures: favorites
        .filter((f) => f.itemType === "LECTURE")
        .map((f) => f.itemId),
      presentations: favorites
        .filter((f) => f.itemType === "PRESENTATION")
        .map((f) => f.itemId),
    };

    return NextResponse.json(favoriteIds);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a favorite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, itemType } = body;

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate itemType
    if (!["ARTICLE", "LECTURE", "PRESENTATION"].includes(itemType)) {
      return NextResponse.json(
        { error: "Invalid item type" },
        { status: 400 }
      );
    }

    // Check current count for this type
    const currentCount = await prisma.favorite.count({
      where: {
        userId: session.user.id,
        itemType: itemType as FavoriteType,
      },
    });

    if (currentCount >= MAX_FAVORITES_PER_TYPE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FAVORITES_PER_TYPE} favorites allowed per type` },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_itemId_itemType: {
          userId: session.user.id,
          itemId,
          itemType: itemType as FavoriteType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already in favorites" },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        itemId,
        itemType: itemType as FavoriteType,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const itemType = searchParams.get("itemType") as FavoriteType | null;

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_itemId_itemType: {
          userId: session.user.id,
          itemId,
          itemType,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
