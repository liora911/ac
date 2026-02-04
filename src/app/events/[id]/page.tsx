"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, MapPin, Globe, ArrowLeft } from "lucide-react";
import { Event } from "@/types/Events/events";
import { useTranslation } from "@/contexts/Translation/translation.context";
import RichContent from "@/components/RichContent";
import { formatDateWithWeekday, formatDateShort } from "@/lib/utils/date";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t, locale } = useTranslation();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">{t("eventDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {t("eventDetail.errorTitle")}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || t("eventDetail.notFound")}
          </p>
          <button
            onClick={() => router.push("/events")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("eventDetail.backToEvents")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/events")}
          className="mb-6 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer border border-gray-200 shadow-sm"
        >
          <ArrowLeft size={18} />
          {t("eventDetail.backToEvents")}
        </button>

        {event.bannerImageUrl && (
          <div className="w-full aspect-video mb-8 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 relative">
            <Image
              src={event.bannerImageUrl}
              alt={event.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
          {event.title}
        </h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("eventDetail.detailsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("eventDetail.dateLabel")}
                </p>
                <p className="font-medium">
                  {formatDateWithWeekday(event.eventDate, locale)}
                </p>
              </div>
            </div>

            {event.eventTime && (
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("eventDetail.timeLabel")}
                  </p>
                  <p className="font-medium">{event.eventTime}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Globe size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("eventDetail.typeLabel")}
                </p>
                <p className="font-medium">
                  {event.eventType === "in-person"
                    ? t("eventDetail.type.inPerson")
                    : t("eventDetail.type.online")}
                </p>
              </div>
            </div>

            {event.eventType === "in-person" && event.location && (
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MapPin size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("eventDetail.locationLabel")}
                  </p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {event.eventType === "online" && event.onlineUrl && (
              <div className="flex items-center gap-3 text-gray-700 md:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Globe size={18} className="text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("eventDetail.linkLabel")}
                  </p>
                  <a
                    href={event.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                  >
                    {event.onlineUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("eventDetail.descriptionTitle")}
          </h2>
          <RichContent content={event.description} className="text-gray-700" />
        </div>

        <div className="text-center text-gray-500 border-t border-gray-200 pt-6">
          <p className="text-sm">
            {t("eventDetail.categoryLabel")}: {event.category.name} •{" "}
            {t("eventDetail.createdAtLabel")}:{" "}
            {formatDateShort(event.createdAt, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
