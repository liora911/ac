export interface OnlineEventItem {
  id: string;
  day: string;
  date: number;
  time: string;
  title: string;
  platform: string;
  status: "Sold Out" | "Register" | "Join Link";
  eventLink?: string;
}

export interface OnlineEventMonthGroup {
  monthYear: string;
  events: OnlineEventItem[];
}
