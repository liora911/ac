import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { fetchEvents } from "@/lib/server/events";
import EventsPageClient from "./EventsPageClient";

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const isAuthorized: boolean = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Fetch initial data on server
  const eventsData = await fetchEvents();

  return (
    <EventsPageClient eventsData={eventsData} isAuthorized={isAuthorized} />
  );
}
