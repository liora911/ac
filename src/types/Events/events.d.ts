export interface EventItem {
  id: string;
  day: string;
  date: number;
  time: string;
  location: string;
  venue: string;
  status: "Sold Out" | "Buy Tickets";
  ticketLink?: string;
}

export interface EventMonthGroup {
  monthYear: string;
  events: EventItem[];
}
