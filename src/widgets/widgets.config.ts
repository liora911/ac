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
  {
    key: "newsletter",
    slot: "homeAboveFooter",
    nameKey: "widgets.items.newsletter.name",
    descriptionKey: "widgets.items.newsletter.description",
    defaultVariant: "card",
    variants: [
      { key: "card", labelKey: "widgets.items.newsletter.variants.card" },
      { key: "compact", labelKey: "widgets.items.newsletter.variants.compact" },
    ],
  },
  {
    key: "announcement",
    slot: "homeUnderHero",
    nameKey: "widgets.items.announcement.name",
    descriptionKey: "widgets.items.announcement.description",
    defaultVariant: "banner",
    variants: [
      { key: "banner", labelKey: "widgets.items.announcement.variants.banner" },
      { key: "card", labelKey: "widgets.items.announcement.variants.card" },
    ],
    configFields: [
      {
        key: "heading",
        labelKey: "widgets.items.announcement.config.heading",
        type: "text",
      },
      {
        key: "body",
        labelKey: "widgets.items.announcement.config.body",
        type: "textarea",
      },
      {
        key: "buttonLabel",
        labelKey: "widgets.items.announcement.config.buttonLabel",
        type: "text",
      },
      {
        key: "buttonUrl",
        labelKey: "widgets.items.announcement.config.buttonUrl",
        type: "url",
      },
    ],
  },
  {
    key: "countdown",
    slot: "articleBelowContent",
    nameKey: "widgets.items.countdown.name",
    descriptionKey: "widgets.items.countdown.description",
    defaultVariant: "compact",
    variants: [
      { key: "compact", labelKey: "widgets.items.countdown.variants.compact" },
      { key: "featured", labelKey: "widgets.items.countdown.variants.featured" },
    ],
  },
  {
    key: "clock",
    slot: "globalFooter",
    nameKey: "widgets.items.clock.name",
    descriptionKey: "widgets.items.clock.description",
    defaultVariant: "purple",
    variants: [
      { key: "purple", labelKey: "widgets.items.clock.variants.purple" },
      { key: "orange", labelKey: "widgets.items.clock.variants.orange" },
      { key: "white", labelKey: "widgets.items.clock.variants.white" },
      { key: "black", labelKey: "widgets.items.clock.variants.black" },
    ],
  },
];

export function getWidgetMeta(key: string): WidgetMeta | undefined {
  return WIDGET_META.find((w) => w.key === key);
}

export function getWidgetsForSlot(slot: WidgetSlotId): WidgetMeta[] {
  return WIDGET_META.filter((w) => w.slot === slot);
}
