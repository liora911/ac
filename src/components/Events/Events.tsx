"use client";

import { Event } from "@/types/Events/events";
import React, { useState, useEffect, useRef } from "react";

interface EventsProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  eventsData: Event[];
}

const Events: React.FC<EventsProps> = ({ onBannerUpdate, eventsData }) => {
  const handleEventClick = (event: Event) => {
    onBannerUpdate(event.bannerImageUrl || null, event.title);
  };

  if (!eventsData) {
    return (
      <div
        className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl"
        style={{ direction: "rtl" }}
      >
        טוען נתוני אירועים...
      </div>
    );
  }

  if (eventsData.length === 0) {
    return (
      <div
        className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl"
        style={{ direction: "rtl" }}
      >
        אין אירועים זמינים כרגע.
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-[calc(100vh-200px)]"
      style={{ direction: "rtl" }}
    >
      <h2 className="text-3xl font-bold mb-6 text-white">כל האירועים</h2>
      <div className="space-y-6">
        {eventsData.map((event) => (
          <div
            key={event.id}
            className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-blue-500/30 transition-shadow cursor-pointer"
            onClick={() => handleEventClick(event)}
          >
            <h4 className="text-2xl font-semibold mb-2 text-blue-400">
              {event.title}
            </h4>
            <p className="text-gray-300 mb-3">{event.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>
                תאריך: {new Date(event.eventDate).toLocaleDateString("he-IL")}
              </span>
              {event.eventTime && <span>שעה: {event.eventTime}</span>}
            </div>
            {event.location && (
              <div className="mt-2 text-sm text-gray-400">
                מיקום: {event.location}
              </div>
            )}
            {event.onlineUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-1">
                  קישור לאירוע מקוון:
                </p>
                <a
                  href={event.onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {event.onlineUrl}
                </a>
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              קטגוריה: {event.category.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
