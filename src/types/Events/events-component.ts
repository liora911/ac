import { Event } from "@/types/Events/events";

export interface EventsProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  eventsData: Event[];
  featuredEventId?: string;
}
