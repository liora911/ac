// Maps each widget key to its visual components: the admin-card Preview and the
// selectable variant components. Client-side only (imports React components).
import type React from "react";
import type { WidgetComponentProps } from "@/types/Widgets/widgets";
import {
  QuoteCard,
  QuoteBanner,
  QuoteMinimal,
  QuotePreview,
} from "./quote/QuoteWidgets";

export interface WidgetRegistryEntry {
  Preview: React.FC;
  variants: Record<string, React.FC<WidgetComponentProps>>;
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  quoteOfDay: {
    Preview: QuotePreview,
    variants: {
      card: QuoteCard,
      banner: QuoteBanner,
      minimal: QuoteMinimal,
    },
  },
};
