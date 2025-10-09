"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Events from "@/components/Events/Events";
import CreateEventForm from "@/components/CreateEvent/create_event";
import Image from "next/image";
import { Event } from "@/types/Events/events";
import { ALLOWED_EMAILS } from "@/constants/auth";

const EventsPage = () => {
  const { data: session } = useSession();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>("Banner Image");
  const [eventsData, setEventsData] = useState<Event[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      } catch (err: any) {
        console.error("Error fetching event data:", err);
        setError(err.message || "An unknown error occurred");
        setEventsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, []);

  const handleBannerUpdate = (imageUrl: string | null, altText: string) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt(altText || "Banner Image");
  };

  const handleEventCreated = () => {
    // Refresh the event data
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
      } catch (err: any) {
        console.error("Error fetching event data:", err);
        setError(err.message || "An unknown error occurred");
        setEventsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
    setShowCreateForm(false);
  };

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: "rtl" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            כל האירועים
          </h1>
          {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg transition-all duration-300 text-lg font-semibold rtl shadow-lg hover:shadow-cyan-500/25"
            >
              {showCreateForm ? "ביטול" : "העלאת אירוע חדש"}
            </button>
          )}
        </div>

        {showCreateForm && isAuthorized && (
          <div className="mb-8">
            <CreateEventForm onSuccess={handleEventCreated} />
          </div>
        )}

        <div className="mb-10 h-48 sm:h-64 md:h-80 bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 rounded-xl shadow-2xl flex items-center justify-center border border-cyan-500/20 overflow-hidden backdrop-blur-sm">
          {currentBannerUrl ? (
            <Image
              src={currentBannerUrl}
              alt={currentBannerAlt}
              width={1200}
              height={320}
              className="object-cover w-full h-full"
              priority
            />
          ) : (
            <p className="text-gray-400 text-xl">
              {isLoading ? "טוען באנר..." : "תמונה/באנר של האירועים יופיע כאן"}
            </p>
          )}
        </div>
        {isLoading && (
          <p className="text-center text-xl text-cyan-300">טוען אירועים...</p>
        )}
        {error && (
          <p className="text-center text-xl text-red-400">
            שגיאה בטעינת אירועים: {error}
          </p>
        )}
        {!isLoading && !error && eventsData && (
          <Events onBannerUpdate={handleBannerUpdate} eventsData={eventsData} />
        )}
        {!isLoading && !error && (!eventsData || eventsData.length === 0) && (
          <p className="text-center text-xl text-cyan-300/70">
            לא נמצאו אירועים.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
