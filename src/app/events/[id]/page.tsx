"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Event } from "@/types/Events/events";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl">טוען אירוע...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">שגיאה</h1>
          <p className="text-gray-300 mb-6">{error || "האירוע לא נמצא"}</p>
          <button
            onClick={() => router.push("/events")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזור לאירועים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {}
        <button
          onClick={() => router.push("/events")}
          className="mb-6 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          ← חזור לאירועים
        </button>

        {}
        {event.bannerImageUrl && (
          <div className="w-full aspect-video mb-8 rounded-xl overflow-hidden bg-gray-800 shadow-lg">
            <Image
              src={event.bannerImageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        {}
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-400 mb-6 text-center">
          {event.title}
        </h1>

        {}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">פרטי האירוע</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="font-medium text-white">תאריך:</span>{" "}
              {new Date(event.eventDate).toLocaleDateString("he-IL")}
            </div>
            {event.eventTime && (
              <div>
                <span className="font-medium text-white">שעה:</span>{" "}
                {event.eventTime}
              </div>
            )}
            <div>
              <span className="font-medium text-white">סוג:</span>{" "}
              {event.eventType === "in-person" ? "פרונטלי" : "אונליין"}
            </div>
            {event.eventType === "in-person" && event.location && (
              <div>
                <span className="font-medium text-white">מיקום:</span>{" "}
                {event.location}
              </div>
            )}
            {event.eventType === "online" && event.onlineUrl && (
              <div>
                <span className="font-medium text-white">קישור:</span>{" "}
                <a
                  href={event.onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {event.onlineUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">תיאור</h2>
          <div
            className="text-gray-300 prose prose-sm max-w-none leading-relaxed prose-invert"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </div>

        {}
        <div className="mt-8 text-center text-gray-400">
          <p>נוצר על ידי: {event.author.name || event.author.email}</p>
          <p className="text-sm mt-1">
            קטגוריה: {event.category.name} • נוצר ב:{" "}
            {new Date(event.createdAt).toLocaleDateString("he-IL")}
          </p>
        </div>
      </div>
    </div>
  );
}
