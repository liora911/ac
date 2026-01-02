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

    const session = await getServerSession(authOptions);

    if (
      !session?.user?.email ||
      !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
