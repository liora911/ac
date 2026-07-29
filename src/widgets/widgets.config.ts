// Pure widget catalogue — NO React imports, so it's safe to use on the server
// (API routes) and the client alike. The visual components live in registry.tsx.
import type { WidgetMeta, WidgetSlotId } from "@/types/Widgets/widgets";

export const WIDGET_META: WidgetMeta[] = [
  {
    key: "quoteOfDay",
    slot: "homeAboveFooter",
    nameKey: "widgets.items.quoteOfDay.name",
    descriptionKey: "widgets.items.quoteOfDay.description",
    defaultVariant: "card",
    variants: [
      { key: "card", labelKey: "widgets.items.quoteOfDay.variants.card" },
      { key: "banner", labelKey: "widgets.items.quoteOfDay.variants.banner" },
      { key: "minimal", labelKey: "widgets.items.quoteOfDay.variants.minimal" },
    ],
  },
];

export function getWidgetMeta(key: string): WidgetMeta | undefined {
  return WIDGET_META.find((w) => w.key === key);
}

export function getWidgetsForSlot(slot: WidgetSlotId): WidgetMeta[] {
  return WIDGET_META.filter((w) => w.slot === slot);
}
