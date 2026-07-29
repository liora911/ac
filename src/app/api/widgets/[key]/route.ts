import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma/prisma";
import {
  requireAdmin,
  isAuthError,
  authErrorResponse,
} from "@/lib/auth/apiAuth";
import { getWidgetMeta, getWidgetsForSlot } from "@/widgets/widgets.config";

// PATCH /api/widgets/[key] — admin-only. Enable/disable, choose variant, set
// config. Enabling a widget disables any other widget sharing its slot
// (one-active-per-slot).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return authErrorResponse(auth);

    const { key } = await params;
    const meta = getWidgetMeta(key);
    if (!meta) {
      return NextResponse.json({ error: "Unknown widget" }, { status: 404 });
    }

    const body = await request.json();
    const update: Prisma.WidgetUpdateInput = {};
    if ("enabled" in body) update.enabled = !!body.enabled;
    if ("variant" in body) {
      update.variant = meta.variants.some((v) => v.key === body.variant)
        ? body.variant
        : meta.defaultVariant;
    }
    if ("config" in body) {
      update.config =
        body.config == null
          ? Prisma.JsonNull
          : (body.config as Prisma.InputJsonValue);
    }

    const willEnable = "enabled" in body && !!body.enabled;

    const saved = await prisma.$transaction(async (tx) => {
      if (willEnable) {
        const siblings = getWidgetsForSlot(meta.slot)
          .filter((w) => w.key !== key)
          .map((w) => w.key);
        if (siblings.length) {
          await tx.widget.updateMany({
            where: { key: { in: siblings }, enabled: true },
            data: { enabled: false },
          });
        }
      }
      return tx.widget.upsert({
        where: { key },
        create: {
          key,
          enabled: "enabled" in body ? !!body.enabled : false,
          variant:
            "variant" in body && typeof update.variant === "string"
              ? update.variant
              : meta.defaultVariant,
          config:
            "config" in body && body.config != null
              ? (body.config as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
        update,
      });
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Widget PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update widget" },
      { status: 500 }
    );
  }
}
