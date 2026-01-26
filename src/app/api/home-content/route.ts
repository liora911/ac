import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import type { UpdateHomeContentPayload } from "@/types/Home/home-content";

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
          heroHtml: null,
          heroHtmlLeft: null,
          heroHtmlRight: null,
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

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const body = (await request.json()) as UpdateHomeContentPayload;
    const { heroHtml = null, heroHtmlLeft = null, heroHtmlRight = null, imageUrl = null, photoCredit = null, bioHtml = "" } = body;

    const updated = await prisma.homeContent.upsert({
      where: { id: "home" },
      create: {
        id: "home",
        heroHtml,
        heroHtmlLeft,
        heroHtmlRight,
        imageUrl,
        photoCredit,
        bioHtml,
      },
      update: {
        heroHtml,
        heroHtmlLeft,
        heroHtmlRight,
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
