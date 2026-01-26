import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

// GET - Public endpoint to fetch about page content
export async function GET() {
  try {
    let aboutPage = await prisma.aboutPage.findUnique({
      where: { id: "about" },
    });

    // If no about page exists, create a default one
    if (!aboutPage) {
      aboutPage = await prisma.aboutPage.create({
        data: {
          id: "about",
          titleEn: "About",
          titleHe: "אודות",
          contentEn: "",
          contentHe: "",
          published: false,
        },
      });
    }

    return NextResponse.json(aboutPage);
  } catch (error) {
    console.error("Error fetching about page:", error);
    return NextResponse.json(
      { error: "Failed to fetch about page" },
      { status: 500 }
    );
  }
}

// PUT - Admin endpoint to update about page content
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const body = await request.json();
    const { titleEn, titleHe, contentEn, contentHe, imageUrl, published } = body;

    const aboutPage = await prisma.aboutPage.upsert({
      where: { id: "about" },
      update: {
        titleEn: titleEn ?? undefined,
        titleHe: titleHe ?? undefined,
        contentEn: contentEn ?? undefined,
        contentHe: contentHe ?? undefined,
        imageUrl: imageUrl ?? undefined,
        published: published ?? undefined,
      },
      create: {
        id: "about",
        titleEn: titleEn || "About",
        titleHe: titleHe || "אודות",
        contentEn: contentEn || "",
        contentHe: contentHe || "",
        imageUrl: imageUrl || null,
        published: published ?? false,
      },
    });

    return NextResponse.json(aboutPage);
  } catch (error) {
    console.error("Error updating about page:", error);
    return NextResponse.json(
      { error: "Failed to update about page" },
      { status: 500 }
    );
  }
}
