import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { getOptionalSession, isAdminEmail } from "@/lib/auth/apiAuth";

// GET /api/widgets — public returns enabled widgets only; admins (?all=true)
// get every stored widget state so the admin library can show current config.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantAll = searchParams.get("all") === "true";

    let isAdmin = false;
    if (wantAll) {
      const session = await getOptionalSession();
      isAdmin = isAdminEmail(session?.user?.email);
    }

    const widgets = await prisma.widget.findMany({
      where: isAdmin ? {} : { enabled: true, visibility: "public" },
    });

    return NextResponse.json(widgets, {
      headers: {
        "Cache-Control": isAdmin
          ? "no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Widgets GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch widgets" },
      { status: 500 }
    );
  }
}
