"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Globe, Star, ArrowRight } from "lucide-react";
import { Event } from "@/types/Events/events";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface FeaturedEventProps {
  event: Event;
  onEventClick?: (event: Event) => void;
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({ event, onEventClick }) => {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleClick = () => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl mb-8"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row">
        {/* Image Section */}
        {event.bannerImageUrl && (
          <div className="lg:w-2/5 h-64 lg:h-auto relative">
            <Image
              src={event.bannerImageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-700/50 lg:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-700/70 to-transparent lg:hidden" />
          </div>
        )}

        {/* Content Section */}
        <div className={`flex-1 p-6 lg:p-8 flex flex-col justify-center ${!event.bannerImageUrl ? 'lg:py-12' : ''}`}>
          {/* Featured Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/90 text-yellow-900 text-sm font-semibold shadow-sm">
              <Star size={14} className="fill-current" />
              {t("events.featuredEvent")}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
              {event.category.name}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
            {event.title}
          </h2>

          {/* Event Details */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Calendar size={16} />
              </div>
              <span className="font-medium">{formatDate(event.eventDate)}</span>
            </div>

            {event.eventTime && (
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Clock size={16} />
                </div>
                <span className="font-medium">{event.eventTime}</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MapPin size={16} />
                </div>
                <span className="font-medium">{event.location}</span>
              </div>
            )}

            {event.eventType === "online" && (
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Globe size={16} />
                </div>
                <span className="font-medium">{t("eventDetail.type.online")}</span>
              </div>
            )}
          </div>

          {/* Description Preview */}
          <div
            className="text-white/80 text-sm lg:text-base mb-6 line-clamp-2 leading-relaxed prose-invert"
            dangerouslySetInnerHTML={{
              __html: event.description.substring(0, 200) + (event.description.length > 200 ? '...' : '')
            }}
          />

          {/* Action Button */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            >
              {t("events.viewDetails")}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </button>

            {event.onlineUrl && (
              <a
                href={event.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30"
              >
                <Globe size={18} />
                {t("eventModal.onlineEventLink")}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedEvent;
