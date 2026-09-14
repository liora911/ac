import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { requireAdmin } from "@/lib/auth/apiAuth";
import { sanitizePermissions } from "@/constants/permissions";

// PATCH /api/admin/users/[id] — update a user's role and/or section permissions
// (full admin only). Promoting to ADMIN grants everything; permissions apply to
// non-admins only.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: { role?: "USER" | "ADMIN"; permissions?: string[] } = {};

    if ("role" in body) {
      if (body.role !== "USER" && body.role !== "ADMIN") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      // Guard against locking yourself out of admin
      if (
        target.id === auth.user.id &&
        target.role === "ADMIN" &&
        body.role === "USER"
      ) {
        return NextResponse.json(
          { error: "You cannot remove your own admin access." },
          { status: 400 }
        );
      }
      data.role = body.role;
    }

    if ("permissions" in body) {
      data.permissions = sanitizePermissions(body.permissions);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
