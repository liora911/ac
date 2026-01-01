"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
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
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  QrCode,
  Share2,
  Download,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface TicketData {
  id: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string | null;
  numberOfSeats: number;
  status: string;
  notes: string | null;
  accessToken: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    description: string;
    eventType: string;
    location: string | null;
    onlineUrl: string | null;
    eventDate: string;
    eventTime: string | null;
    bannerImageUrl: string | null;
    category: {
      id: string;
      name: string;
    };
  };
}

export default function TicketSummaryPage() {
  const params = useParams();
  const accessToken = params.id as string;
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const ticketRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!accessToken) {
        setError(t("tickets.invalidTicket"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/tickets/${accessToken}`);
        if (!response.ok) {
          throw new Error(t("tickets.ticketNotFound"));
        }
        const data = await response.json();
        setTicket(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [accessToken, t]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "ATTENDED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return t("tickets.statusConfirmed");
      case "PENDING":
        return t("tickets.statusPending");
      case "CANCELLED":
        return t("tickets.statusCancelled");
      case "ATTENDED":
        return t("tickets.statusAttended");
      default:
        return status;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket?.event.title,
          text: t("tickets.shareText"),
          url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert(t("tickets.linkCopied"));
    }
  };

  const downloadPDF = async () => {
    const element = ticketRef.current;
    if (!element || !ticket) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        foreignObjectRendering: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        const position = heightLeft - imgHeight;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `ticket-${ticket.event.title.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "-")}-${ticket.id.slice(0, 8)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
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

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tickets.errorTitle")}
          </h1>
          <p className="text-gray-600 mb-6">{error || t("tickets.ticketNotFound")}</p>
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

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
          {t("tickets.backToEvents")}
        </Link>

        {/* Ticket Card */}
        <div ref={ticketRef} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header with Event Image */}
          {ticket.event.bannerImageUrl && (
            <div className="relative h-48 md:h-64">
              <Image
                src={ticket.event.bannerImageUrl}
                alt={ticket.event.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 start-4 end-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  <CheckCircle size={14} />
                  {getStatusText(ticket.status)}
                </span>
              </div>
            </div>
          )}

          {/* Ticket Content */}
          <div className="p-6 md:p-8">
            {/* Event Title */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {ticket.event.title}
                  </h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    {ticket.event.category.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                    title={t("tickets.share")}
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t("tickets.downloadPdf")}
                  >
                    {isDownloading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    ) : (
                      <Download size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-6 relative">
              <div className="absolute -start-8 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full"></div>
              <div className="absolute -end-8 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full"></div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t("tickets.eventDetails")}
                </h3>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("tickets.date")}</p>
                    <p className="font-medium">{formatDate(ticket.event.eventDate)}</p>
                  </div>
                </div>

                {ticket.event.eventTime && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Clock size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("tickets.time")}</p>
                      <p className="font-medium">{ticket.event.eventTime}</p>
                    </div>
                  </div>
                )}

                {ticket.event.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <MapPin size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("tickets.location")}</p>
                      <p className="font-medium">{ticket.event.location}</p>
                    </div>
                  </div>
                )}

                {ticket.event.eventType === "online" && ticket.event.onlineUrl && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Globe size={18} className="text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("tickets.onlineLink")}</p>
                      <a
                        href={ticket.event.onlineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 underline"
                      >
                        {t("tickets.joinEvent")}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {t("tickets.ticketHolder")}
                </h3>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <User size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("tickets.name")}</p>
                    <p className="font-medium">{ticket.holderName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Mail size={18} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("tickets.email")}</p>
                    <p className="font-medium">{ticket.holderEmail}</p>
                  </div>
                </div>

                {ticket.holderPhone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Phone size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("tickets.phone")}</p>
                      <p className="font-medium">{ticket.holderPhone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Users size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("tickets.seats")}</p>
                    <p className="font-medium">
                      {ticket.numberOfSeats} {ticket.numberOfSeats === 1 ? t("tickets.seat") : t("tickets.seatsPlural")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {ticket.notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  {t("tickets.notes")}
                </h3>
                <p className="text-gray-700">{ticket.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm text-gray-500">
                  <p>
                    {t("tickets.ticketId")}: <span className="font-mono">{ticket.id.slice(0, 8)}...</span>
                  </p>
                  <p>
                    {t("tickets.reservedOn")}: {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">
                    {t("tickets.keepTicket")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
