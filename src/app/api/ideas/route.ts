import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin } from "@/lib/auth/apiAuth";

// GET /api/ideas — all idea notes (admin only, pinned first)
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const ideas = await prisma.ideaNote.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(ideas, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Ideas GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

// POST /api/ideas — create an idea note (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { title, content, color, pinned = false } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const idea = await prisma.ideaNote.create({
      data: {
        title: title.trim(),
        content: content || null,
        color: color || null,
        pinned: !!pinned,
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Ideas POST error:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}
