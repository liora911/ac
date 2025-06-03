export interface OnlineEventItem {
  id: string;
  day: string;
  date: number;
  time: string;
  title: string;
  platform: string;
  status: "Sold Out" | "Register" | "Join Link";
  eventLink?: string; // Optional link for registration or joining
}

export interface OnlineEventMonthGroup {
  monthYear: string;
  events: OnlineEventItem[];
}
