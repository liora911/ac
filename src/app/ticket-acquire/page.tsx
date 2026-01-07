"use client";

import React, { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Ticket,
  User,
  Mail,
  Phone,
  Users,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { Event } from "@/types/Events/events";
import { useTranslation } from "@/contexts/Translation/translation.context";

function TicketAcquireContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketAccessToken, setTicketAccessToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    holderName: "",
    holderEmail: "",
    holderPhone: "",
    numberOfSeats: 1,
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError(t("tickets.noEventSelected"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error(t("tickets.eventNotFound"));
        }
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, t]);

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.holderName.trim()) {
      errors.holderName = t("tickets.nameRequired");
    } else if (formData.holderName.trim().length < 2) {
      errors.holderName = t("tickets.nameMinLength");
    }

    if (!formData.holderEmail.trim()) {
      errors.holderEmail = t("tickets.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.holderEmail)) {
      errors.holderEmail = t("tickets.emailInvalid");
    }

    if (formData.holderPhone && !/^[\d\s\-+()]+$/.test(formData.holderPhone)) {
      errors.holderPhone = t("tickets.phoneInvalid");
    }

    if (formData.numberOfSeats < 1 || formData.numberOfSeats > 4) {
      errors.numberOfSeats = t("tickets.seatsInvalid");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !eventId || !event) return;

    setIsSubmitting(true);

    try {
      // For paid events, redirect to Stripe checkout
      if (event.price && event.price > 0) {
        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId,
            ...formData,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t("tickets.paymentFailed") || "Payment failed");
        }

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // For free events, create ticket directly
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("tickets.reservationFailed"));
      }

      setTicketAccessToken(data.accessToken);
      setSubmitSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numberOfSeats" ? parseInt(value) || 1 : value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tickets.errorTitle")}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={18} />
            {t("tickets.backToEvents")}
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess && ticketAccessToken) {
    return (
      <div
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        style={{ direction: locale === "he" ? "rtl" : "ltr" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t("tickets.reservationSuccess")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t("tickets.reservationSuccessMessage")}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              {t("tickets.confirmationEmailSent")} <strong>{formData.holderEmail}</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/ticket-summary/${ticketAccessToken}`}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <Ticket size={18} />
                {t("tickets.viewTicket")}
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                {t("tickets.backToEvents")}
              </Link>
            </div>
          </div>
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
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
          {t("tickets.backToEvents")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Info Card */}
          {event && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {event.bannerImageUrl && (
                <div className="relative h-48">
                  <Image
                    src={event.bannerImageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("tickets.date")}</p>
                      <p className="font-medium">{formatDate(event.eventDate)}</p>
                    </div>
                  </div>

                  {event.eventTime && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Clock size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("tickets.time")}</p>
                        <p className="font-medium">{event.eventTime}</p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <MapPin size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("tickets.location")}</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.eventType === "online" && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Globe size={18} className="text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("tickets.eventType")}</p>
                        <p className="font-medium">{t("eventDetail.type.online")}</p>
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <CreditCard size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("tickets.price") || "Price"}</p>
                      <p className="font-medium">
                        {event.price && event.price > 0
                          ? `₪${(event.price / 100).toFixed(2)}`
                          : t("tickets.free") || "Free"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    {event.category.name}
                  </span>

                  {/* Seats availability badge */}
                  {event.seatsInfo ? (
                    event.seatsInfo.availableSeats > 0 ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        event.seatsInfo.availableSeats <= 5
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-green-100 text-green-700 border border-green-200"
                      }`}>
                        <Users size={14} />
                        {event.seatsInfo.availableSeats <= 5
                          ? t("tickets.lastSeatsRemaining").replace("{count}", String(event.seatsInfo.availableSeats))
                          : t("tickets.seatsRemaining").replace("{count}", String(event.seatsInfo.availableSeats))
                        }
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle size={14} />
                        {t("tickets.soldOut")}
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      <Users size={14} />
                      {t("tickets.unlimitedSeats")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reservation Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Ticket size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t("tickets.reserveTitle")}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("tickets.reserveSubtitle")}
                </p>
              </div>
            </div>

            {/* Show sold out message if no seats available */}
            {event?.seatsInfo && event.seatsInfo.availableSeats <= 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("tickets.eventFull")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t("tickets.noSeatsAvailable")}
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  {t("tickets.backToEvents")}
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="holderName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <User size={16} className="inline me-2" />
                  {t("tickets.nameLabel")}
                </label>
                <input
                  type="text"
                  id="holderName"
                  name="holderName"
                  value={formData.holderName}
                  onChange={handleChange}
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    formErrors.holderName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("tickets.namePlaceholder")}
                />
                {formErrors.holderName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.holderName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="holderEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Mail size={16} className="inline me-2" />
                  {t("tickets.emailLabel")}
                </label>
                <input
                  type="email"
                  id="holderEmail"
                  name="holderEmail"
                  value={formData.holderEmail}
                  onChange={handleChange}
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    formErrors.holderEmail ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("tickets.emailPlaceholder")}
                />
                {formErrors.holderEmail && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.holderEmail}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="holderPhone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Phone size={16} className="inline me-2" />
                  {t("tickets.phoneLabel")}
                  <span className="text-gray-400 ms-1">({t("tickets.optional")})</span>
                </label>
                <input
                  type="tel"
                  id="holderPhone"
                  name="holderPhone"
                  value={formData.holderPhone}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    formErrors.holderPhone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("tickets.phonePlaceholder")}
                />
                {formErrors.holderPhone && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.holderPhone}</p>
                )}
              </div>

              {/* Number of Seats */}
              <div>
                <label
                  htmlFor="numberOfSeats"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Users size={16} className="inline me-2" />
                  {t("tickets.seatsLabel")}
                </label>
                <input
                  type="number"
                  id="numberOfSeats"
                  name="numberOfSeats"
                  value={formData.numberOfSeats}
                  onChange={handleChange}
                  min={1}
                  max={event?.seatsInfo ? Math.min(4, event.seatsInfo.availableSeats) : 4}
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    formErrors.numberOfSeats ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {event?.seatsInfo && event.seatsInfo.availableSeats < 4 && (
                  <p className="mt-1 text-xs text-orange-600">
                    {t("tickets.lastSeatsRemaining").replace("{count}", String(event.seatsInfo.availableSeats))}
                  </p>
                )}
                {formErrors.numberOfSeats && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.numberOfSeats}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("tickets.notesLabel")}
                  <span className="text-gray-400 ms-1">({t("tickets.optional")})</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder={t("tickets.notesPlaceholder")}
                />
              </div>

              {/* Total Price Display for Paid Events */}
              {event?.price && event.price > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{t("tickets.total") || "Total"}</span>
                    <span className="text-2xl font-bold text-amber-700">
                      ₪{((event.price * formData.numberOfSeats) / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.numberOfSeats} × ₪{(event.price / 100).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-lg focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg flex items-center justify-center gap-2 cursor-pointer ${
                  event?.price && event.price > 0
                    ? "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {t("tickets.processing")}
                  </>
                ) : event?.price && event.price > 0 ? (
                  <>
                    <CreditCard size={20} />
                    {t("tickets.payAndReserve") || "Pay & Reserve"} - ₪{((event.price * formData.numberOfSeats) / 100).toFixed(2)}
                  </>
                ) : (
                  <>
                    <Ticket size={20} />
                    {t("tickets.reserveButton")}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                {t("tickets.disclaimer")}
              </p>
            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-xl">Loading...</p>
      </div>
    </div>
  );
}

export default function TicketAcquirePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketAcquireContent />
    </Suspense>
  );
}
