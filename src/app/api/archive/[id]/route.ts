import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import type { UpdateArchiveRequest } from "@/types/Archive/archive";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single archive item (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const archive = await prisma.archive.findUnique({
      where: { id },
    });

    if (!archive) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: archive.id,
      title: archive.title,
      content: archive.content,
      mediaUrl: archive.mediaUrl,
      mediaType: archive.mediaType,
      order: archive.order,
      createdAt: archive.createdAt.toISOString(),
      updatedAt: archive.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch archive:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive" },
      { status: 500 }
    );
  }
}

// PUT - Update archive item (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const existing = await prisma.archive.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    const body: UpdateArchiveRequest = await request.json();
    const { title, content, mediaUrl, mediaType, order } = body;

    const archive = await prisma.archive.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(mediaUrl !== undefined && { mediaUrl: mediaUrl || null }),
        ...(mediaType !== undefined && { mediaType }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({
      id: archive.id,
      title: archive.title,
      content: archive.content,
      mediaUrl: archive.mediaUrl,
      mediaType: archive.mediaType,
      order: archive.order,
      createdAt: archive.createdAt.toISOString(),
      updatedAt: archive.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update archive:", error);
    return NextResponse.json(
      { error: "Failed to update archive" },
      { status: 500 }
    );
  }
}

// DELETE - Delete archive item (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const archive = await prisma.archive.findUnique({
      where: { id },
    });

    if (!archive) {
      return NextResponse.json({ error: "Archive item not found" }, { status: 404 });
    }

    await prisma.archive.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete archive:", error);
    return NextResponse.json(
      { error: "Failed to delete archive" },
      { status: 500 }
    );
  }
}
