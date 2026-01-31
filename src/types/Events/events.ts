// Component Props
export interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export interface SeatsInfo {
  maxSeats: number;
  reservedSeats: number;
  availableSeats: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location: string | null;
  onlineUrl: string | null;
  eventDate: Date;
  eventTime: string | null;
  bannerImageUrl: string | null;
  published: boolean;
  isFeatured: boolean;
  isClosed: boolean; // Manually close registration
  categoryId: string;
  authorId: string;
  maxSeats: number | null;
  price: number | null; // Price in agorot (null = free)
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  category: {
    id: string;
    name: string;
    bannerImageUrl: string | null;
  };
  seatsInfo?: SeatsInfo | null;
}

export interface EventCategory {
  id: string;
  name: string;
  bannerImageUrl: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  events: Event[];
  subcategories?: EventCategory[];
}

export interface EventDetailProps {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location: string | null;
  onlineUrl: string | null;
  eventDate: Date;
  eventTime: string | null;
  bannerImageUrl: string | null;
}

export interface CreateEventData {
  title: string;
  description: string;
  eventType: string;
  location?: string;
  onlineUrl?: string;
  eventDate: string;
  eventTime?: string;
  bannerImageUrl?: string;
  categoryId: string;
}

// ============================================
// EVENT COMPONENT PROPS
// ============================================

/**
 * Props for the FeaturedEvent component.
 * Displays a featured event with enhanced styling.
 */
export interface FeaturedEventProps {
  event: Event;
  onEventClick?: (event: Event) => void;
}

/**
 * Props for the EventsCalendar component.
 * Calendar view with event indicators and popover details.
 */
export interface EventsCalendarProps {
  events: Event[];
}

/**
 * Internal type for EventsCalendar - day with its events.
 */
export interface DayEvents {
  date: Date;
  events: Event[];
}
