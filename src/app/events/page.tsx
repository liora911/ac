"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Event } from "@/types/Events/events";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import EventModal from "@/components/Events/EventModal";

const Events = dynamic(() => import("@/components/Events/Events"), {
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
});

const FeaturedEvent = dynamic(
  () => import("@/components/Events/FeaturedEvent"),
  {
    loading: () => (
      <div className="animate-pulse bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl h-64 mb-8" />
    ),
  }
);

const CreateEventForm = dynamic(
  () => import("@/components/CreateEvent/create_event"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

const EventsPage = () => {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [eventsData, setEventsData] = useState<Event[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch events: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: Event[] = await response.json();
        setEventsData(data);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        setEventsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, []);

  // Get the featured event - prioritize manually marked, then auto-select by date
  const featuredEvent = useMemo(() => {
    if (!eventsData || eventsData.length === 0) return null;

    // First, check if any event is manually marked as featured
    const manuallyFeatured = eventsData.find((event) => event.isFeatured);
    if (manuallyFeatured) return manuallyFeatured;

    // Fallback: Sort by event date (upcoming first) then by creation date
    const sortedEvents = [...eventsData].sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      const now = new Date();

      // Prioritize upcoming events
      const isAUpcoming = dateA >= now;
      const isBUpcoming = dateB >= now;

      if (isAUpcoming && !isBUpcoming) return -1;
      if (!isAUpcoming && isBUpcoming) return 1;

      // If both upcoming or both past, sort by date
      if (isAUpcoming && isBUpcoming) {
        return dateA.getTime() - dateB.getTime(); // Nearest upcoming first
      }

      return dateB.getTime() - dateA.getTime(); // Most recent past event first
    });

    return sortedEvents[0];
  }, [eventsData]);

  // Get remaining events (excluding featured)
  const remainingEvents = useMemo(() => {
    if (!eventsData || !featuredEvent) return eventsData || [];
    return eventsData.filter((event) => event.id !== featuredEvent.id);
  }, [eventsData, featuredEvent]);

  const handleEventCreated = () => {
    const fetchEventData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch events: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: Event[] = await response.json();
        setEventsData(data);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        setEventsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
    setShowCreateForm(false);
  };

  const isAuthorized: boolean = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Handler for featured event click - opens modal
  const handleFeaturedEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t("eventsPage.title")}
          </h1>
        </div>

        {showCreateForm && isAuthorized && (
          <div className="mb-8">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <CreateEventForm onSuccess={handleEventCreated} />
            </Suspense>
          </div>
        )}

        {/* Featured Event Section */}
        {isLoading && (
          <div className="animate-pulse bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl h-64 mb-8" />
        )}

        {!isLoading && !error && featuredEvent && (
          <Suspense
            fallback={
              <div className="animate-pulse bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl h-64 mb-8" />
            }
          >
            <FeaturedEvent
              event={featuredEvent}
              onEventClick={handleFeaturedEventClick}
            />
          </Suspense>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col md:flex-row gap-8 p-4 md:p-6 bg-white text-gray-900 min-h-[calc(100vh-400px)] rounded-lg">
            <aside className="w-full md:w-1/4 lg:w-1/5 bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-5/6"></div>
                <div className="h-8 bg-gray-200 rounded w-4/5"></div>
              </div>
            </aside>
            <main className="w-full md:w-3/4 lg:w-4/5">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 h-64 animate-pulse"
                  >
                    <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}

        {error && (
          <p className="text-center text-xl text-red-500">
            {t("eventsPage.errorPrefix")}: {error}
          </p>
        )}

        {/* Events List */}
        {!isLoading && !error && eventsData && eventsData.length > 0 && (
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <Events
              onBannerUpdate={() => {}}
              eventsData={remainingEvents.length > 0 ? remainingEvents : eventsData}
              featuredEventId={featuredEvent?.id}
            />
          </Suspense>
        )}

        {!isLoading && !error && (!eventsData || eventsData.length === 0) && (
          <p className="text-center text-xl text-gray-400">
            {t("eventsPage.noEventsFound")}
          </p>
        )}
      </div>

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        locale={locale}
      />
    </div>
  );
};

export default EventsPage;
