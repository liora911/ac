import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin, getOptionalSession, isAdminEmail } from "@/lib/auth/apiAuth";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

// GET /api/guests — public list of published guests (admins see all with ?all=true)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantAll = searchParams.get("all") === "true";

    let includeUnpublished = false;
    if (wantAll) {
      const session = await getOptionalSession();
      includeUnpublished = isAdminEmail(session?.user?.email);
    }

    const guests = await prisma.guest.findMany({
      where: includeUnpublished ? {} : { published: true },
      select: {
        id: true,
        name: true,
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
        ...(includeUnpublished ? { email: true } : {}),
        _count: {
          select: {
            works: includeUnpublished ? true : { where: { published: true } },
          },
        },
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

// POST /api/guests — create a guest (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      name,
      headline,
      bio,
      photoUrl,
      bannerImageUrl,
      websiteUrl,
      email,
      titleDirection = "rtl",
      published = false,
      isFeatured = false,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = await generateUniqueSlug(
      generateSlug(name) || "guest",
      async (candidate) =>
        !!(await prisma.guest.findUnique({ where: { slug: candidate } }))
    );

    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        slug,
        headline: headline || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        bannerImageUrl: bannerImageUrl || null,
        websiteUrl: websiteUrl || null,
        email: email || null,
        titleDirection,
        published,
        isFeatured,
      },
      include: { _count: { select: { works: true } } },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Guests POST error:", error);
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
}
