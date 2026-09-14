import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requirePermission, getOptionalSession } from "@/lib/auth/apiAuth";
import { hasPermission } from "@/constants/permissions";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import { normalizeExternalUrl } from "@/lib/utils/url";

// Normalize an owner email for storage/matching. Blank → null (unlink).
function normalizeOwnerEmail(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().toLowerCase();
}

// GET /api/guests — public list of published guests (managers see all with ?all=true)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantAll = searchParams.get("all") === "true";

    let includeUnpublished = false;
    if (wantAll) {
      const session = await getOptionalSession();
      includeUnpublished = hasPermission(session?.user, "guests");
    }

    const guests = await prisma.guest.findMany({
      where: includeUnpublished ? {} : { published: true },
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        headline: true,
        photoUrl: true,
        bannerImageUrl: true,
        websiteUrl: true,
        titleDirection: true,
        published: true,
        isFeatured: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        // Managers get the private email, the full rich-text bio, the gallery,
        // and the linked owner email so the edit form can pre-fill; the public
        // list stays lean without them. (galleryUrls MUST be here — otherwise the
        // form seeds an empty gallery and saving overwrites galleryUrls with [].)
        ...(includeUnpublished
          ? { email: true, bio: true, galleryUrls: true, ownerEmail: true }
          : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(guests, {
      headers: includeUnpublished
        ? { "Cache-Control": "no-store" }
        : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Guests GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}

// POST /api/guests — create a guest (guests managers only)
export async function POST(request: Request) {
  try {
    const auth = await requirePermission("guests");
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      name,
      nameEn,
      slug: slugInput,
      headline,
      bio,
      photoUrl,
      bannerImageUrl,
      galleryUrls,
      websiteUrl,
      email,
      ownerEmail,
      titleDirection = "rtl",
      published = false,
      isFeatured = false,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Slug priority: admin-typed slug → English title → Hebrew name → "guest"
    const slugBase =
      generateSlug(slugInput || "") ||
      generateSlug(nameEn || "") ||
      generateSlug(name) ||
      "guest";
    const slug = await generateUniqueSlug(
      slugBase,
      async (candidate) =>
        !!(await prisma.guest.findUnique({ where: { slug: candidate } }))
    );

    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        slug,
        headline: headline || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        bannerImageUrl: bannerImageUrl || null,
        galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : [],
        websiteUrl: normalizeExternalUrl(websiteUrl),
        email: email || null,
        ownerEmail: normalizeOwnerEmail(ownerEmail),
        titleDirection,
        published,
        isFeatured,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Guests POST error:", error);
    const message = error instanceof Error ? error.message : "";
    const prismaCode = (error as { code?: string })?.code;
    // Most common setup failure: schema not pushed / stale Prisma client
    if (
      prismaCode === "P2021" ||
      message.includes("does not exist") ||
      message.includes("Cannot read properties of undefined")
    ) {
      return NextResponse.json(
        {
          error:
            "Database is missing the guests tables. Run `npx prisma db push` and restart the dev server.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
}
