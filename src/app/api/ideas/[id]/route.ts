import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin } from "@/lib/auth/apiAuth";

// PATCH /api/ideas/[id] — update an idea note (admin only)
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

    const data: Record<string, unknown> = {};
    if ("title" in body) data.title = String(body.title).trim();
    if ("content" in body) data.content = body.content || null;
    if ("color" in body) data.color = body.color || null;
    if ("pinned" in body) data.pinned = !!body.pinned;

    const idea = await prisma.ideaNote.update({ where: { id }, data });
    return NextResponse.json(idea);
  } catch (error) {
    console.error("Idea PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}

// DELETE /api/ideas/[id] — delete an idea note (admin only)
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
    await prisma.ideaNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Idea DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    );
  }
}
