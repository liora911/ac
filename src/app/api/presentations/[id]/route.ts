import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import { deleteBlobs } from "@/actions/upload";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const { id } = await params;

    const presentation = await prisma.presentation.findUnique({
      where: { id },
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

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(presentation);
  } catch (error) {
    console.error("Error fetching presentation:", error);
    return NextResponse.json(
      { error: "Failed to fetch presentation" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;

    const existingPresentation = await prisma.presentation.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingPresentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
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
      isPremium,
    } = body;

    if (!title || !categoryId) {
      return NextResponse.json(
        {
          error: "Title and categoryId are required",
        },
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

    const updatedPresentation = await prisma.presentation.update({
      where: { id },
      data: {
        title,
        description: description || "",
        content: content || "",
        googleSlidesUrl: googleSlidesUrl || null,
        pdfUrl: pdfUrl || null,
        imageUrls: imageUrls || [],
        categoryId,
        isPremium: isPremium ?? false,
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

    return NextResponse.json(updatedPresentation);
  } catch (error) {
    console.error("Error updating presentation:", error);
    return NextResponse.json(
      { error: "Failed to update presentation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      throw new Error("Database connection not available");
    }

    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;

    const existingPresentation = await prisma.presentation.findUnique({
      where: { id },
    });

    if (!existingPresentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    // Delete associated blob files (PDF and images)
    const blobsToDelete: string[] = [];
    if (existingPresentation.pdfUrl) {
      blobsToDelete.push(existingPresentation.pdfUrl);
    }
    if (existingPresentation.imageUrls && existingPresentation.imageUrls.length > 0) {
      blobsToDelete.push(...existingPresentation.imageUrls);
    }
    if (blobsToDelete.length > 0) {
      await deleteBlobs(blobsToDelete);
    }

    await prisma.presentation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Presentation deleted successfully" });
  } catch (error) {
    console.error("Error deleting presentation:", error);
    return NextResponse.json(
      { error: "Failed to delete presentation" },
      { status: 500 }
    );
  }
}
