"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Globe, X } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Event } from "@/types/Events/events";
import RichContent from "@/components/RichContent";

export interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

const EventModal: React.FC<EventModalProps> = ({
  event,
  isOpen,
  onClose,
  locale,
}) => {
  const { t } = useTranslation();
  if (!event) return null;

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {event.bannerImageUrl && (
              <div className="relative h-48 md:h-56">
                <img
                  src={event.bannerImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 transition-colors shadow-md cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-14rem)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {event.title}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <span className="font-medium">
                    {formatDate(event.eventDate)}
                  </span>
                  {event.eventTime && (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center ms-2">
                        <Clock size={16} className="text-purple-600" />
                      </div>
                      <span>{event.eventTime}</span>
                    </>
                  )}
                </div>

                {event.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <MapPin size={16} className="text-green-600" />
                    </div>
                    <span>{event.location}</span>
                  </div>
                )}

                {event.onlineUrl && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Globe size={16} className="text-cyan-600" />
                    </div>
                    <a
                      href={event.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      {t("eventModal.onlineEventLink")}
                    </a>
                  </div>
                )}

                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    {event.category.name}
                  </span>
                </div>
              </div>

              <RichContent content={event.description} className="text-gray-600" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
