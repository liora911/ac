import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma/prisma";
import {
  requireAdmin,
  isAuthError,
  authErrorResponse,
} from "@/lib/auth/apiAuth";
import { getWidgetMeta, getWidgetsForSlot } from "@/widgets/widgets.config";
import { WIDGETS_CACHE_TAG } from "@/lib/widgets/getEnabledWidgets";

// Config must be a plain JSON object (not an array/primitive) and reasonably
// small — reject anything else so a widget can't be fed junk.
function sanitizeConfig(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value == null) return Prisma.JsonNull;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("config must be an object");
  }
  const json = JSON.stringify(value);
  if (json.length > 10_000) throw new Error("config too large");
  return JSON.parse(json) as Prisma.InputJsonValue;
}

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

    let configValue: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
    if ("config" in body) {
      try {
        configValue = sanitizeConfig(body.config);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid config" },
          { status: 400 }
        );
      }
      update.config = configValue;
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
          config: configValue ?? Prisma.JsonNull,
        },
        update,
      });
    });

    // Refresh the server-seeded public snapshot immediately after any change
    revalidateTag(WIDGETS_CACHE_TAG);

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Widget PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update widget" },
      { status: 500 }
    );
  }
}
