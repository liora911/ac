import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin, getOptionalSession, isAdminEmail } from "@/lib/auth/apiAuth";

// GET /api/guest-works/[id] — public work detail; unpublished visible to admins
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getOptionalSession();
    const isAdmin = isAdminEmail(session?.user?.email);

    const work = await prisma.guestWork.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { published: true, guest: { published: true } }),
      },
      include: {
        category: { select: { id: true, name: true } },
        guest: {
          select: {
            id: true,
            name: true,
            slug: true,
            headline: true,
            photoUrl: true,
            titleDirection: true,
          },
        },
      },
    });

    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }

    return NextResponse.json(work, {
      headers: isAdmin
        ? { "Cache-Control": "no-store" }
        : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Guest work GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest work" },
      { status: 500 }
    );
  }
}

// PATCH /api/guest-works/[id] — update (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();

    if ("title" in body && (!body.title || !String(body.title).trim())) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (body.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if ("title" in body) data.title = String(body.title).trim();
    if ("titleDirection" in body) data.titleDirection = body.titleDirection || "rtl";
    if ("description" in body) data.description = body.description || null;
    if ("content" in body) data.content = body.content || null;
    if ("imageUrls" in body) {
      data.imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
    }
    if ("pdfUrl" in body) data.pdfUrl = body.pdfUrl || null;
    if ("videoUrl" in body) data.videoUrl = body.videoUrl || null;
    if ("coverImageUrl" in body) data.coverImageUrl = body.coverImageUrl || null;
    if ("categoryId" in body) data.categoryId = body.categoryId || null;
    if ("published" in body) data.published = !!body.published;
    if ("order" in body) data.order = Number(body.order) || 0;

    const work = await prisma.guestWork.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        guest: {
          select: {
            id: true,
            name: true,
            slug: true,
            headline: true,
            photoUrl: true,
            titleDirection: true,
          },
        },
      },
    });

    return NextResponse.json(work);
  } catch (error) {
    console.error("Guest work PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update guest work" },
      { status: 500 }
    );
  }
}

// DELETE /api/guest-works/[id] — delete (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await prisma.guestWork.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guest work DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete guest work" },
      { status: 500 }
    );
  }
}
