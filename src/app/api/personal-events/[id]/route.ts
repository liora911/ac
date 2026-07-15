import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin } from "@/lib/auth/apiAuth";

// PATCH /api/personal-events/[id] — update an entry (admin only)
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
    if ("note" in body) data.note = body.note || null;
    if ("time" in body) data.time = body.time || null;
    if ("color" in body) data.color = body.color || null;
    if ("date" in body) {
      const parsedDate = new Date(body.date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "A valid date is required" },
          { status: 400 }
        );
      }
      data.date = parsedDate;
    }

    const event = await prisma.personalEvent.update({ where: { id }, data });
    return NextResponse.json(event);
  } catch (error) {
    console.error("Personal event PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update personal event" },
      { status: 500 }
    );
  }
}

// DELETE /api/personal-events/[id] — delete an entry (admin only)
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
    await prisma.personalEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Personal event DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete personal event" },
      { status: 500 }
    );
  }
}
