import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError, isMcpAuthorized } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import type { Archive, CreateArchiveRequest } from "@/types/Archive/archive";

// GET - List all archive items (admin or MCP)
export async function GET(request: NextRequest) {
  try {
    if (!isMcpAuthorized(request)) {
      const auth = await requireAdmin();
      if (isAuthError(auth)) {
        return authErrorResponse(auth);
      }
    }

    const archives = await prisma.archive.findMany({
      orderBy: { order: "asc" },
    });

    const transformedArchives: Archive[] = archives.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      mediaUrl: a.mediaUrl,
      mediaType: a.mediaType,
      order: a.order,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedArchives);
  } catch (error) {
    console.error("Failed to fetch archives:", error);
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    );
  }
}

// POST - Create new archive item (admin or MCP)
export async function POST(request: NextRequest) {
  try {
    if (!isMcpAuthorized(request)) {
      const auth = await requireAdmin();
      if (isAuthError(auth)) {
        return authErrorResponse(auth);
      }
    }

    const body: CreateArchiveRequest = await request.json();
    const { title, content, mediaUrl, mediaType = "NONE" } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Get the highest order value to place new item at the end
    const maxOrder = await prisma.archive.aggregate({
      _max: { order: true },
    });
    const newOrder = (maxOrder._max.order ?? -1) + 1;

    const archive = await prisma.archive.create({
      data: {
        title,
        content,
        mediaUrl: mediaUrl || null,
        mediaType,
        order: newOrder,
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
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create archive:", error);
    return NextResponse.json(
      { error: "Failed to create archive" },
      { status: 500 }
    );
  }
}
