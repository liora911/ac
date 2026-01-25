/**
 * Ticket and event ticket types
 */

export type TicketStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "ATTENDED";

export interface Ticket {
  id: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string | null;
  numberOfSeats: number;
  status: TicketStatus;
  notes: string | null;
  accessToken: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    eventDate: string;
    eventTime: string | null;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface TicketData {
  id: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string | null;
  numberOfSeats: number;
  status: string;
  notes: string | null;
  accessToken: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    description: string;
    eventType: string;
    location: string | null;
    onlineUrl: string | null;
    eventDate: string;
    eventTime: string | null;
    bannerImageUrl: string | null;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface EventData {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string | null;
  maxSeats: number | null;
  seatsInfo: {
    maxSeats: number;
    reservedSeats: number;
    availableSeats: number;
  } | null;
}
