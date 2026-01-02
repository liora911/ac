"use client";

import { Event } from "@/types/Events/events";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useSettings } from "@/contexts/SettingsContext";
import EventModal from "./EventModal";

export interface EventsProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  eventsData: Event[];
  featuredEventId?: string;
}

const Events: React.FC<EventsProps> = ({ onBannerUpdate, eventsData, featuredEventId }) => {
  const { t, locale } = useTranslation();
  const { defaultView } = useSettings();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultView);

  // Sync with settings when defaultView changes
  useEffect(() => {
    setViewMode(defaultView);
  }, [defaultView]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    onBannerUpdate(event.bannerImageUrl || null, event.title);
  };

  const filteredEvents = eventsData.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || event.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Map(
      eventsData.map((event) => [event.category.id, event.category])
    ).values()
  );

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!eventsData) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-gray-200 text-gray-500 text-lg">
        {t("events.loadingData")}
      </div>
    );
  }

  if (eventsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-gray-200 text-gray-500 text-lg">
        {t("events.noEventsAvailable")}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t("events.allEvents")}
        </h2>
        <p className="text-gray-500">
          {filteredEvents.length} {t("events.eventsFound")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={t("events.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
        >
          <option value="all">{t("events.allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-md transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-200"
            }`}
            aria-label={t("events.gridView")}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-md transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-200"
            }`}
            aria-label={t("events.listView")}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer overflow-hidden group"
                onClick={() => handleEventClick(event)}
              >
                {event.bannerImageUrl && (
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <img
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      <span>{formatDate(event.eventDate)}</span>
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
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {event.category.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer group"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {event.bannerImageUrl && (
                    <img
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full md:w-28 h-20 object-cover rounded-lg bg-gray-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-500" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      {event.eventTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-purple-500" />
                          <span>{event.eventTime}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-green-500" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:text-end">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {event.category.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {filteredEvents.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {t("events.noResults")}
          </h3>
          <p className="text-gray-500">{t("events.tryDifferentSearch")}</p>
        </div>
      )}

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
