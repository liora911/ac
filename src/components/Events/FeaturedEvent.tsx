"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Globe, Sparkles, ArrowRight, Ticket, Users } from "lucide-react";
import { Event } from "@/types/Events/events";
import { useTranslation } from "@/contexts/Translation/translation.context";
import DOMPurify from "dompurify";

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

  // Check if event is upcoming (can reserve tickets)
  const isUpcoming = new Date(event.eventDate) >= new Date();

  // Format price
  const formatPrice = () => {
    if (!event.price) return t("events.free");
    const priceInShekels = event.price / 100;
    return `${event.currency === "ILS" ? "₪" : "$"}${priceInShekels}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg mb-8"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Image Section */}
        <div className="lg:w-2/5 h-64 lg:h-auto relative bg-gray-100 dark:bg-gray-900">
          {event.bannerImageUrl ? (
            <>
              <Image
                src={event.bannerImageUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Featured Badge - Positioned on image */}
          <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-white text-sm font-semibold shadow-md backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-500" />
              {t("events.featuredEvent")}
            </span>
          </div>

          {/* Price Badge - Positioned on image */}
          {isUpcoming && (
            <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-md">
                {formatPrice()}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
          {/* Category */}
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
              {event.category.name}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {event.title}
          </h2>

          {/* Event Details */}
          <div className="flex flex-wrap gap-4 mb-5">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar size={18} className="text-blue-500" />
              <span className="text-sm font-medium">{formatDate(event.eventDate)}</span>
            </div>

            {event.eventTime && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock size={18} className="text-purple-500" />
                <span className="text-sm font-medium">{event.eventTime}</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin size={18} className="text-emerald-500" />
                <span className="text-sm font-medium">{event.location}</span>
              </div>
            )}

            {event.eventType === "online" && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Globe size={18} className="text-cyan-500" />
                <span className="text-sm font-medium">{t("eventDetail.type.online")}</span>
              </div>
            )}

            {event.seatsInfo && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users size={18} className="text-orange-500" />
                <span className="text-sm font-medium">
                  {event.seatsInfo.availableSeats} {t("events.seatsAvailable")}
                </span>
              </div>
            )}
          </div>

          {/* Description Preview */}
          <div
            className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mb-6 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(event.description.substring(0, 200) + (event.description.length > 200 ? '...' : ''))
            }}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Reserve a Spot Button - Primary CTA for upcoming events */}
            {isUpcoming && (
              <Link
                href={`/ticket-acquire?eventId=${event.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer shadow-sm"
              >
                <Ticket size={18} />
                {t("tickets.reserveSpot")}
              </Link>
            )}

            <button
              onClick={handleClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              {t("events.viewDetails")}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </button>

            {event.onlineUrl && (
              <a
                href={event.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
