"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Events from "@/components/Events/Events";
import CreateEventForm from "@/components/CreateEvent/create_event";
import Image from "next/image";
import { Event } from "@/types/Events/events";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

const EventsPage = () => {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
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
      } catch (err) {
        console.error("Error fetching event data:", err);
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

  const handleBannerUpdate = (imageUrl: string | null, altText: string) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt(altText || "Banner Image");
  };

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
        console.error("Error fetching event data:", err);
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

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            {t("eventsPage.title")}
          </h1>
          {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg transition-all duration-300 text-lg font-semibold rtl shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
            >
              {showCreateForm
                ? t("eventsPage.cancelButton")
                : t("eventsPage.createEventButton")}
            </button>
          )}
        </div>

        {showCreateForm && isAuthorized && (
          <div className="mb-8">
            <CreateEventForm onSuccess={handleEventCreated} />
          </div>
        )}

        <div className="mb-6 h-48 md:h-56 bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 rounded-lg shadow-xl flex items-center justify-center border border-cyan-500/20 overflow-hidden backdrop-blur-sm relative">
          {currentBannerUrl ? (
            <>
              <Image
                src={currentBannerUrl}
                alt={currentBannerAlt}
                fill
                className="object-cover"
                priority
              />
              {}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end">
                <div className="p-4 text-white w-full">
                  <h3
                    className="text-lg md:text-xl font-semibold mb-1"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}
                  >
                    {currentBannerAlt}
                  </h3>
                  {eventsData &&
                    eventsData.find(
                      (event) => event.title === currentBannerAlt
                    ) && (
                      <div className="text-xs md:text-sm opacity-85">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <span className="bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                            📅{" "}
                            {new Date(
                              eventsData.find(
                                (event) => event.title === currentBannerAlt
                              )?.eventDate || ""
                            ).toLocaleDateString(dateLocale)}
                          </span>
                          {eventsData.find(
                            (event) => event.title === currentBannerAlt
                          )?.eventTime && (
                            <span className="bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                              🕐{" "}
                              {
                                eventsData.find(
                                  (event) => event.title === currentBannerAlt
                                )?.eventTime
                              }
                            </span>
                          )}
                        </div>
                        {eventsData.find(
                          (event) => event.title === currentBannerAlt
                        )?.location && (
                          <div className="bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm inline-block">
                            📍{" "}
                            {
                              eventsData.find(
                                (event) => event.title === currentBannerAlt
                              )?.location
                            }
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-lg">
              {isLoading
                ? t("eventsPage.bannerLoading")
                : t("eventsPage.bannerPlaceholder")}
            </p>
          )}
        </div>
        {isLoading && (
          <p className="text-center text-xl text-cyan-300">
            {t("eventsPage.loading")}
          </p>
        )}
        {error && (
          <p className="text-center text-xl text-red-400">
            {t("eventsPage.errorPrefix")}: {error}
          </p>
        )}
        {!isLoading && !error && eventsData && (
          <Events onBannerUpdate={handleBannerUpdate} eventsData={eventsData} />
        )}
        {!isLoading && !error && (!eventsData || eventsData.length === 0) && (
          <p className="text-center text-xl text-cyan-300/70">
            {t("eventsPage.noEventsFound")}
          </p>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
