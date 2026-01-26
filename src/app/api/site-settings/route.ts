import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

export async function GET() {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
    });

    if (!settings) {
      // Return defaults if no settings exist
      return NextResponse.json({
        id: "settings",
        siteTitle: "Avshalom Elitzur",
        siteDescription: "",
        contactEmail: "",
        contactPhone: "",
        facebookUrl: "",
        youtubeUrl: "",
        defaultLanguage: "he",
        updatedAt: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch site settings" },
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

    const body = await request.json();
    const {
      siteTitle = "Avshalom Elitzur",
      siteDescription = "",
      contactEmail = "",
      contactPhone = "",
      facebookUrl = "",
      youtubeUrl = "",
      defaultLanguage = "he",
    } = body;

    const updated = await prisma.siteSettings.upsert({
      where: { id: "settings" },
      create: {
        id: "settings",
        siteTitle,
        siteDescription,
        contactEmail,
        contactPhone,
        facebookUrl,
        youtubeUrl,
        defaultLanguage,
      },
      update: {
        siteTitle,
        siteDescription,
        contactEmail,
        contactPhone,
        facebookUrl,
        youtubeUrl,
        defaultLanguage,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 }
    );
  }
}
