import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { ALLOWED_EMAILS } from "@/constants/auth";

type HomeContentPayload = {
  imageUrl?: string | null;
  photoCredit?: string | null;
  bioHtml?: string;
};

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const existing = await prisma.homeContent.findUnique({
      where: { id: "home" },
    });

    if (!existing) {
      return NextResponse.json(
        {
          id: "home",
          imageUrl: null,
          photoCredit: null,
          bioHtml: "",
          updatedAt: null,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    return NextResponse.json(existing, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch home content" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = (await request.json()) as HomeContentPayload;
    const { imageUrl = null, photoCredit = null, bioHtml = "" } = body;

    const updated = await prisma.homeContent.upsert({
      where: { id: "home" },
      create: {
        id: "home",
        imageUrl,
        photoCredit,
        bioHtml,
      },
      update: {
        imageUrl,
        photoCredit,
        bioHtml,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update home content" },
      { status: 500 }
    );
  }
}
