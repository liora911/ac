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
    configFields: [
      {
        key: "quotes",
        labelKey: "widgets.items.quoteOfDay.config.quotes",
        type: "textarea",
      },
      {
        key: "rotation",
        labelKey: "widgets.items.quoteOfDay.config.rotation",
        type: "select",
        options: [
          { value: "1", labelKey: "widgets.items.quoteOfDay.rotation.hourly" },
          {
            value: "12",
            labelKey: "widgets.items.quoteOfDay.rotation.twiceDaily",
          },
          { value: "24", labelKey: "widgets.items.quoteOfDay.rotation.daily" },
          {
            value: "168",
            labelKey: "widgets.items.quoteOfDay.rotation.weekly",
          },
        ],
      },
      { key: "color", labelKey: "widgets.common.color", type: "color" },
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
    defaultVariant: "sunset",
    sampleConfig: {
      heading: "Announcement",
      body: "Your message here…",
    },
    variants: [
      { key: "sunset", labelKey: "widgets.items.announcement.variants.sunset" },
      { key: "ocean", labelKey: "widgets.items.announcement.variants.ocean" },
      { key: "forest", labelKey: "widgets.items.announcement.variants.forest" },
      { key: "slate", labelKey: "widgets.items.announcement.variants.slate" },
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
      { key: "color", labelKey: "widgets.common.color", type: "color" },
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
    configFields: [
      { key: "color", labelKey: "widgets.common.color", type: "color" },
    ],
  },
];

export function getWidgetMeta(key: string): WidgetMeta | undefined {
  return WIDGET_META.find((w) => w.key === key);
}

export function getWidgetsForSlot(slot: WidgetSlotId): WidgetMeta[] {
  return WIDGET_META.filter((w) => w.slot === slot);
}
