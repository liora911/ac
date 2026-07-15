import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin } from "@/lib/auth/apiAuth";

// GET /api/personal-events — all personal calendar entries (admin only)
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const events = await prisma.personalEvent.findMany({
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(events, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Personal events GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal events" },
      { status: 500 }
    );
  }
}

// POST /api/personal-events — create an entry (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { title, note, date, time, color } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const parsedDate = new Date(date);
    if (!date || isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "A valid date is required" },
        { status: 400 }
      );
    }

    const event = await prisma.personalEvent.create({
      data: {
        title: title.trim(),
        note: note || null,
        date: parsedDate,
        time: time || null,
        color: color || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Personal events POST error:", error);
    return NextResponse.json(
      { error: "Failed to create personal event" },
      { status: 500 }
    );
  }
}
