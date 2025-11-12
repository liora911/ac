"use client";

import React from "react";
import Image from "next/image";
import { Event } from "@/types/Events/events";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer transition-colors z-10"
        >
          &times;
        </button>

        <div className="p-6">
          {/* Banner Image */}
          {event.bannerImageUrl && (
            <div className="w-full aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={event.bannerImageUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {event.title}
          </h1>

          {/* Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <span className="font-medium text-gray-900">Date:</span>{" "}
                {new Date(event.eventDate).toLocaleDateString(dateLocale)}
              </div>
              {event.eventTime && (
                <div>
                  <span className="font-medium text-gray-900">Time:</span>{" "}
                  {event.eventTime}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-900">Type:</span>{" "}
                {event.eventType === "in-person" ? "In-Person" : "Online"}
              </div>
              {event.eventType === "in-person" && event.location && (
                <div>
                  <span className="font-medium text-gray-900">Location:</span>{" "}
                  {event.location}
                </div>
              )}
              {event.eventType === "online" && event.onlineUrl && (
                <div>
                  <span className="font-medium text-gray-900">Link:</span>{" "}
                  <a
                    href={event.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {event.onlineUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description
            </h2>
            <div
              className="text-gray-700 prose prose-sm max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 border-t border-gray-200 pt-6">
            <p>Created by: {event.author.name || event.author.email}</p>
            <p className="text-sm mt-1">
              Category: {event.category.name} • Created:{" "}
              {new Date(event.createdAt).toLocaleDateString(dateLocale)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
