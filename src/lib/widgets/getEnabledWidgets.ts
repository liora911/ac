import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma/prisma";
import type { WidgetState } from "@/types/Widgets/widgets";

// Cache tag so an admin edit (PATCH /api/widgets/[key]) can revalidate the
// public snapshot immediately via revalidateTag(WIDGETS_CACHE_TAG).
export const WIDGETS_CACHE_TAG = "widgets";

async function queryEnabledWidgets(): Promise<WidgetState[]> {
  try {
    const rows = await prisma.widget.findMany({ where: { enabled: true } });
    return rows.map((r) => ({
      key: r.key,
      enabled: r.enabled,
      variant: r.variant,
      config: (r.config ?? null) as Record<string, unknown> | null,
    }));
  } catch (error) {
    // Never let a widget-lookup failure take down the whole layout/page.
    console.error("getEnabledWidgets failed:", error);
    return [];
  }
}

/**
 * Server-side source of truth for which widgets are enabled. Cached (tagged) so
 * every slot on a page shares one query, and the public site can be rendered on
 * the server with widgets already in the HTML (no client flash, SEO-friendly).
 */
export const getEnabledWidgets = unstable_cache(
  queryEnabledWidgets,
  ["enabled-widgets"],
  { tags: [WIDGETS_CACHE_TAG], revalidate: 300 }
);
