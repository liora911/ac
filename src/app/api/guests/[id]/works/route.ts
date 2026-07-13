import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin } from "@/lib/auth/apiAuth";

// POST /api/guests/[id]/works — add a work to a guest (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: guestId } = await params;
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      titleDirection = "rtl",
      description,
      content,
      imageUrls = [],
      pdfUrl,
      videoUrl,
      coverImageUrl,
      categoryId,
      published = false,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    const work = await prisma.guestWork.create({
      data: {
        guestId,
        title: title.trim(),
        titleDirection,
        description: description || null,
        content: content || null,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        pdfUrl: pdfUrl || null,
        videoUrl: videoUrl || null,
        coverImageUrl: coverImageUrl || null,
        categoryId: categoryId || null,
        published,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(work, { status: 201 });
  } catch (error) {
    console.error("Guest work POST error:", error);
    return NextResponse.json(
      { error: "Failed to create guest work" },
      { status: 500 }
    );
  }
}
