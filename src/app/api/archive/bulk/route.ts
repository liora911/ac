import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, isAuthError, isMcpAuthorized } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";

interface BulkUpdateItem {
  id: string;
  title?: string;
  content?: string;
  mediaUrl?: string | null;
  mediaType?: string;
  category?: string | null;
  order?: number;
}

// PUT - Bulk update archive items (admin or MCP)
export async function PUT(request: NextRequest) {
  try {
    if (!isMcpAuthorized(request)) {
      const auth = await requireAdmin();
      if (isAuthError(auth)) {
        return authErrorResponse(auth);
      }
    }

    const body = await request.json();
    const { updates } = body as { updates: BulkUpdateItem[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (updates.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 updates per batch" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      updates.map((item) => {
        const { id, ...fields } = item;
        const data: Record<string, unknown> = {};

        if (fields.title !== undefined) data.title = fields.title;
        if (fields.content !== undefined) data.content = fields.content;
        if (fields.mediaUrl !== undefined) data.mediaUrl = fields.mediaUrl || null;
        if (fields.mediaType !== undefined) data.mediaType = fields.mediaType;
        if (fields.category !== undefined) data.category = fields.category || null;
        if (fields.order !== undefined) data.order = fields.order;

        return prisma.archive.update({
          where: { id },
          data,
        });
      })
    );

    return NextResponse.json({
      success: true,
      updated: results.length,
      items: results.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
      })),
    });
  } catch (error) {
    console.error("Failed to bulk update archives:", error);
    return NextResponse.json(
      { error: "Failed to bulk update archives" },
      { status: 500 }
    );
  }
}
