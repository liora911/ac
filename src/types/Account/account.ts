import type { UserRole } from "@prisma/client";

/**
 * Props for the AccountClient component.
 * User account page with subscription, tickets, and preferences.
 */
export interface AccountClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
    createdAt?: string;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  ticketCount: number;
  stats?: {
    articlesRead?: number;
    lecturesWatched?: number;
    eventsAttended?: number;
  };
}
