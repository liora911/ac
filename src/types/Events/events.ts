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
  categoryId: string;
  authorId: string;
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
