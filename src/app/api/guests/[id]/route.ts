import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin, getOptionalSession, isAdminEmail } from "@/lib/auth/apiAuth";
import { normalizeExternalUrl } from "@/lib/utils/url";

// Accepts either a cuid or a slug so public URLs can use /guests/[slug]
async function findGuest(idOrSlug: string, includeUnpublished: boolean) {
  return prisma.guest.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      ...(includeUnpublished ? {} : { published: true }),
    },
    include: {
      works: {
        where: includeUnpublished ? {} : { published: true },
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      },
    },
  });
}

// GET /api/guests/[id] — public detail (id or slug), unpublished visible to admins
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getOptionalSession();
    const isAdmin = isAdminEmail(session?.user?.email);

    const guest = await findGuest(id, isAdmin);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    if (!isAdmin) {
      // Never expose the private contact email publicly
      // (undefined values are dropped by JSON serialization)
      return NextResponse.json(
        { ...guest, email: undefined },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    return NextResponse.json(guest, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Guest GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest" },
      { status: 500 }
    );
  }
}

// PATCH /api/guests/[id] — update (admin only)
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

    const data: Record<string, unknown> = {};
    const stringFields = [
      "name",
      "headline",
      "bio",
      "photoUrl",
      "bannerImageUrl",
      "websiteUrl",
      "email",
      "titleDirection",
    ] as const;
    for (const field of stringFields) {
      if (field in body) data[field] = body[field] || null;
    }
    if ("name" in body) {
      if (!body.name || !String(body.name).trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      data.name = String(body.name).trim();
    }
    if ("websiteUrl" in body) data.websiteUrl = normalizeExternalUrl(body.websiteUrl);
    if ("titleDirection" in body) data.titleDirection = body.titleDirection || "rtl";
    if ("published" in body) data.published = !!body.published;
    if ("isFeatured" in body) data.isFeatured = !!body.isFeatured;
    if ("order" in body) data.order = Number(body.order) || 0;

    const guest = await prisma.guest.update({
      where: { id },
      data,
      include: {
        works: {
          include: { category: { select: { id: true, name: true } } },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        },
        _count: { select: { works: true } },
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Guest PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

// DELETE /api/guests/[id] — delete guest and all works (admin only)
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
    await prisma.guest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guest DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete guest" },
      { status: 500 }
    );
  }
}
