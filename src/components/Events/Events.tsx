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
      className="p-4 md:p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-gray-100 min-h-[calc(100vh-200px)]"
      style={{ direction: "rtl" }}
    >
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
        כל האירועים
      </h2>
      <div className="space-y-6">
        {eventsData.map((event) => (
          <div
            key={event.id}
            className="bg-gradient-to-r from-slate-800/80 via-blue-900/80 to-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer"
            onClick={() => handleEventClick(event)}
          >
            <h4 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              {event.title}
            </h4>
            <p className="text-gray-200 mb-3 leading-relaxed">
              {event.description}
            </p>
            <div className="flex justify-between items-center text-sm text-cyan-300/80">
              <span>
                תאריך: {new Date(event.eventDate).toLocaleDateString("he-IL")}
              </span>
              {event.eventTime && <span>שעה: {event.eventTime}</span>}
            </div>
            {event.location && (
              <div className="mt-2 text-sm text-blue-300/80">
                מיקום: {event.location}
              </div>
            )}
            {event.onlineUrl && (
              <div className="mt-2">
                <p className="text-sm text-cyan-300/80 mb-1">
                  קישור לאירוע מקוון:
                </p>
                <a
                  href={event.onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/50 hover:decoration-cyan-300 transition-colors"
                >
                  {event.onlineUrl}
                </a>
              </div>
            )}
            <div className="mt-2 text-sm text-blue-400/70">
              קטגוריה: {event.category.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
