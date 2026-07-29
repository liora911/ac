// The fixed positions on the site where a widget can render. Each slot holds
// at most one enabled widget at a time (one-active-per-slot).
export const WIDGET_SLOTS = [
  "homeUnderHero",
  "homeAboveFooter",
  "articleBelowContent",
  "globalFooter",
] as const;

export type WidgetSlotId = (typeof WIDGET_SLOTS)[number];

export interface WidgetVariantMeta {
  key: string;
  labelKey: string;
}

export type WidgetConfigFieldType = "text" | "textarea" | "url";

export interface WidgetConfigField {
  key: string;
  labelKey: string;
  type: WidgetConfigFieldType;
  placeholder?: string;
}

// Catalogue entry for a widget. Lives in code (src/widgets); the DB only stores
// which widgets are enabled and their chosen variant/config.
export interface WidgetMeta {
  key: string;
  slot: WidgetSlotId;
  nameKey: string;
  descriptionKey: string;
  defaultVariant: string;
  variants: WidgetVariantMeta[];
  configFields?: WidgetConfigField[];
}

export type WidgetVisibility = "public" | "private";

// Persisted state for a widget (one row in the `widgets` table).
export interface WidgetState {
  key: string;
  enabled: boolean;
  variant: string | null;
  config: Record<string, unknown> | null;
  visibility: WidgetVisibility;
}

export interface UpdateWidgetInput {
  enabled?: boolean;
  variant?: string | null;
  config?: Record<string, unknown> | null;
  visibility?: WidgetVisibility;
}

// Props passed to every rendered widget variant component.
export interface WidgetComponentProps {
  config?: Record<string, unknown> | null;
}
