import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import {
  requireAuth,
  requirePermission,
  getOptionalSession,
} from "@/lib/auth/apiAuth";
import { hasPermission } from "@/constants/permissions";
import { normalizeExternalUrl } from "@/lib/utils/url";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

// Fields an owner may edit on their own page — content only. Publishing,
// slug, feature/order, contact email and the owner link stay with managers.
const OWNER_EDITABLE = new Set([
  "name",
  "nameEn",
  "headline",
  "bio",
  "photoUrl",
  "bannerImageUrl",
  "galleryUrls",
  "websiteUrl",
  "titleDirection",
]);

// Normalize an owner email for storage/matching. Blank → null (unlink).
function normalizeOwnerEmail(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().toLowerCase();
}

// True if the signed-in user's verified email matches the guest's owner email.
function emailMatches(
  sessionEmail: string | null | undefined,
  ownerEmail: string | null | undefined
): boolean {
  if (!sessionEmail || !ownerEmail) return false;
  return sessionEmail.toLowerCase() === ownerEmail.toLowerCase();
}

// GET /api/guests/[id] — public detail (id or slug). Unpublished profiles are
// visible to guests managers and to the linked owner. The response tells the
// client whether the viewer may edit (isOwner / canEdit).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getOptionalSession();
    const isManager = hasPermission(session?.user, "guests");

    const guest = await prisma.guest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const isOwner = emailMatches(session?.user?.email, guest.ownerEmail);

    // Hide unpublished profiles from everyone except managers and the owner
    if (!guest.published && !isManager && !isOwner) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    if (isManager) {
      return NextResponse.json(
        { ...guest, isOwner, canEdit: true },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Public / owner view — never expose the private contact email or the
    // owner email
    const { email: _email, ownerEmail: _ownerEmail, ...publicGuest } = guest;
    void _email;
    void _ownerEmail;
    return NextResponse.json(
      { ...publicGuest, isOwner, canEdit: isOwner },
      {
        headers: {
          "Cache-Control": isOwner
            ? "no-store"
            : "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Guest GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest" },
      { status: 500 }
    );
  }
}

// PATCH /api/guests/[id] — update. Guests managers may edit everything; a linked
// owner (matched by verified email) may edit only their own profile's content.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const existing = await prisma.guest.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, ownerEmail: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const isManager = hasPermission(auth.user, "guests");
    const isOwner = emailMatches(auth.user.email, existing.ownerEmail);
    if (!isManager && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    const stringFields = [
      "nameEn",
      "headline",
      "bio",
      "photoUrl",
      "bannerImageUrl",
      "websiteUrl",
      "titleDirection",
      // manager-only string field:
      "email",
    ] as const;
    for (const field of stringFields) {
      if (!(field in body)) continue;
      // Owners without manager rights can't touch manager-only fields
      if (!isManager && !OWNER_EDITABLE.has(field)) continue;
      data[field] = body[field] || null;
    }

    if ("name" in body) {
      if (!body.name || !String(body.name).trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      data.name = String(body.name).trim();
    }

    if ("galleryUrls" in body) {
      data.galleryUrls = Array.isArray(body.galleryUrls) ? body.galleryUrls : [];
    }
    if ("websiteUrl" in body) data.websiteUrl = normalizeExternalUrl(body.websiteUrl);
    if ("titleDirection" in body) data.titleDirection = body.titleDirection || "rtl";

    // Manager-only fields
    if (isManager) {
      if ("slug" in body) {
        const base =
          generateSlug(body.slug || "") ||
          generateSlug(body.nameEn || "") ||
          generateSlug(body.name || "") ||
          "guest";
        data.slug = await generateUniqueSlug(
          base,
          async (candidate) =>
            !!(await prisma.guest.findFirst({
              where: { slug: candidate, NOT: { id: existing.id } },
            }))
        );
      }
      if ("published" in body) data.published = !!body.published;
      if ("isFeatured" in body) data.isFeatured = !!body.isFeatured;
      if ("order" in body) data.order = Number(body.order) || 0;
      if ("ownerEmail" in body) data.ownerEmail = normalizeOwnerEmail(body.ownerEmail);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const guest = await prisma.guest.update({ where: { id: existing.id }, data });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Guest PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

// DELETE /api/guests/[id] — delete guest and all works (guests managers only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("guests");
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
