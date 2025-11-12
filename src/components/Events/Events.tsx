"use client";

import { Event } from "@/types/Events/events";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Globe,
  Filter,
  Search,
  X,
} from "lucide-react";

interface EventsProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  eventsData: Event[];
}

interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {event.bannerImageUrl && (
              <div className="relative h-48 md:h-64">
                <img
                  src={event.bannerImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {event.title}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Calendar size={18} />
                  <span>
                    {new Date(event.eventDate).toLocaleDateString("he-IL")}
                  </span>
                  {event.eventTime && (
                    <>
                      <Clock size={18} className="ml-4" />
                      <span>{event.eventTime}</span>
                    </>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-blue-300">
                    <MapPin size={18} />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.onlineUrl && (
                  <div className="flex items-center gap-2 text-green-300">
                    <Globe size={18} />
                    <a
                      href={event.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-200 underline"
                    >
                      קישור לאירוע מקוון
                    </a>
                  </div>
                )}
                <div className="text-sm text-purple-300">
                  קטגוריה: {event.category.name}
                </div>
                <div
                  className="prose prose-invert max-w-none text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Events: React.FC<EventsProps> = ({ onBannerUpdate, eventsData }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    new Set(eventsData.map((event) => event.category.name))
  );

  if (!eventsData) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl">
        טוען נתוני אירועים...
      </div>
    );
  }

  if (eventsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl">
        אין אירועים זמינים כרגע.
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-gray-100 min-h-[calc(100vh-200px)]"
      style={{ direction: "rtl" }}
    >
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
          כל האירועים
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="חפש אירועים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl border transition-all ${
                viewMode === "grid"
                  ? "bg-cyan-600 border-cyan-400 text-white"
                  : "border-cyan-500/30 text-gray-400 hover:border-cyan-400"
              }`}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-xl border transition-all ${
                viewMode === "list"
                  ? "bg-cyan-600 border-cyan-400 text-white"
                  : "border-cyan-500/30 text-gray-400 hover:border-cyan-400"
              }`}
            >
              📋
            </button>
          </div>
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800/80 via-blue-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handleEventClick(event)}
              >
                {event.bannerImageUrl && (
                  <div className="relative h-48">
                    <img
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-6">
                  <h4 className="text-xl font-semibold mb-3 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent line-clamp-2">
                    {event.title}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        {new Date(event.eventDate).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                    {event.eventTime && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{event.eventTime}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-purple-300">
                    {event.category.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-4">
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gradient-to-r from-slate-800/80 via-blue-900/80 to-slate-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {event.bannerImageUrl && (
                    <img
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full md:w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold mb-2 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      {event.title}
                    </h4>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString(
                            "he-IL"
                          )}
                        </span>
                      </div>
                      {event.eventTime && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{event.eventTime}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-purple-300">
                      קטגוריה: {event.category.name}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Events;
