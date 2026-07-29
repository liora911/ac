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
import {
  NewsletterCard,
  NewsletterCompact,
  NewsletterPreview,
} from "./newsletter/NewsletterWidget";
import {
  AnnouncementBanner,
  AnnouncementCard,
  AnnouncementPreview,
} from "./announcement/AnnouncementWidget";
import {
  CountdownCompact,
  CountdownFeatured,
  CountdownPreview,
} from "./countdown/CountdownWidget";
import {
  ClockPurple,
  ClockOrange,
  ClockWhite,
  ClockBlack,
  ClockPreview,
} from "./clock/ClockWidget";

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
  newsletter: {
    Preview: NewsletterPreview,
    variants: {
      card: NewsletterCard,
      compact: NewsletterCompact,
    },
  },
  announcement: {
    Preview: AnnouncementPreview,
    variants: {
      banner: AnnouncementBanner,
      card: AnnouncementCard,
    },
  },
  countdown: {
    Preview: CountdownPreview,
    variants: {
      compact: CountdownCompact,
      featured: CountdownFeatured,
    },
  },
  clock: {
    Preview: ClockPreview,
    variants: {
      purple: ClockPurple,
      orange: ClockOrange,
      white: ClockWhite,
      black: ClockBlack,
    },
  },
};
