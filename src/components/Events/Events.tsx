"use client";

import { Event } from "@/types/Events/events";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import EventModal from "./EventModal";
import type { EventsProps } from "@/types/Events/events-component";
import { formatDateShort } from "@/lib/utils/date";

export type { EventsProps };

const Events: React.FC<EventsProps> = ({ onBannerUpdate, eventsData }) => {
  const { t, locale } = useTranslation();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    onBannerUpdate(event.bannerImageUrl || null, event.title);
  };

  if (!eventsData) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-lg">
        {t("events.loadingData")}
      </div>
    );
  }

  if (eventsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-lg">
        {t("events.noEventsAvailable")}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t("events.allEvents")}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {eventsData.length} {t("events.eventsFound")}
        </p>
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {eventsData.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => handleEventClick(event)}
            >
              {event.bannerImageUrl && (
                <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-900">
                  <img
                    src={event.bannerImageUrl}
                    alt={event.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {event.title}
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <span>{formatDateShort(event.eventDate, locale)}</span>
                  </div>
                  {event.eventTime && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-purple-500" />
                      <span>{event.eventTime}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-green-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {event.category.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locale={locale}
      />
    </div>
  );
};

export default Events;
