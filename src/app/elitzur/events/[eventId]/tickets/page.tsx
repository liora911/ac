"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { Ticket, EventData, TicketStatus } from "@/types/Tickets/tickets";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function EventTicketsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showSuccess, showError } = useNotification();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [ticketToUpdate, setTicketToUpdate] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<TicketStatus>("ATTENDED");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch event and tickets
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch event details
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) {
          throw new Error("Failed to fetch event");
        }
        const eventData = await eventRes.json();
        setEvent(eventData);

        // Fetch tickets for this event
        const ticketsRes = await fetch(`/api/tickets?eventId=${eventId}`);
        if (!ticketsRes.ok) {
          throw new Error("Failed to fetch tickets");
        }
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, isAuthorized]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.holderName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        ticket.holderEmail.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (ticket.holderPhone?.includes(debouncedSearch) ?? false);

      const matchesStatus =
        statusFilter === "" || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, debouncedSearch, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const totalSeats = tickets.reduce((sum, t) => sum + t.numberOfSeats, 0);
    const confirmedSeats = tickets
      .filter((t) => t.status === "CONFIRMED" || t.status === "ATTENDED")
      .reduce((sum, t) => sum + t.numberOfSeats, 0);
    const attendedSeats = tickets
      .filter((t) => t.status === "ATTENDED")
      .reduce((sum, t) => sum + t.numberOfSeats, 0);
    const pendingSeats = tickets
      .filter((t) => t.status === "PENDING")
      .reduce((sum, t) => sum + t.numberOfSeats, 0);

    return { totalTickets, totalSeats, confirmedSeats, attendedSeats, pendingSeats };
  }, [tickets]);

  // Update ticket status
  const handleUpdateStatus = async () => {
    if (!ticketToUpdate) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketToUpdate.accessToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update ticket status");
      }

      // Update local state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketToUpdate.id ? { ...t, status: newStatus } : t
        )
      );

      showSuccess(t("admin.tickets.statusUpdated"));
      setUpdateModalOpen(false);
      setTicketToUpdate(null);
    } catch {
      showError(t("admin.tickets.updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick check-in (mark as attended)
  const handleQuickCheckIn = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.accessToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ATTENDED" }),
      });

      if (!res.ok) {
        throw new Error("Failed to check in");
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id ? { ...t, status: "ATTENDED" } : t
        )
      );

      showSuccess(`${ticket.holderName} ${t("admin.tickets.checkedIn")}`);
    } catch {
      showError(t("admin.tickets.checkInError"));
    }
  };

  // Export to Excel-compatible CSV
  const exportToCSV = () => {
    const statusMap: Record<string, string> = {
      CONFIRMED: t("tickets.statusConfirmed"),
      PENDING: t("tickets.statusPending"),
      CANCELLED: t("tickets.statusCancelled"),
      ATTENDED: t("tickets.statusAttended"),
    };

    const headers = [
      t("admin.tickets.name"),
      t("admin.tickets.email"),
      t("admin.tickets.phone"),
      t("admin.tickets.seats"),
      t("admin.common.status"),
      t("admin.tickets.ticketId"),
      t("admin.tickets.notes"),
      t("admin.tickets.reservedOn"),
    ];

    const rows = filteredTickets.map((ticket) => [
      ticket.holderName,
      ticket.holderEmail,
      ticket.holderPhone || "-",
      ticket.numberOfSeats.toString(),
      statusMap[ticket.status] || ticket.status,
      ticket.id,
      ticket.notes || "-",
      new Date(ticket.createdAt).toLocaleDateString("he-IL"),
    ]);

    // Use tab separator for better Excel compatibility
    const tsvContent = [
      headers.join("\t"),
      ...rows.map((row) =>
        row.map((cell) => cell.replace(/\t/g, " ").replace(/\n/g, " ")).join("\t")
      ),
    ].join("\n");

    // BOM for UTF-8 Hebrew support
    const blob = new Blob(["\uFEFF" + tsvContent], {
      type: "text/tab-separated-values;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const eventName = event?.title?.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, "_") || eventId;
    link.download = `tickets-${eventName}-${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "ATTENDED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: TicketStatus) => {
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

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">{t("admin.auth.signInRequired")}</p>
        <LoginForm />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p>{error}</p>
        <Link
          href="/elitzur?tab=events"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          {t("admin.tickets.backToEvents")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/elitzur?tab=events"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("admin.tickets.backToEvents")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("admin.tickets.title")}
          </h1>
          <p className="text-gray-600 mt-1">{event?.title}</p>
          {event?.eventDate && (
            <p className="text-sm text-gray-500">
              {new Date(event.eventDate).toLocaleDateString()} {event.eventTime && `- ${event.eventTime}`}
            </p>
          )}
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          {t("admin.tickets.exportCSV")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t("admin.tickets.totalTickets")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
          <p className="text-xs text-gray-400">{stats.totalSeats} {t("admin.tickets.seats")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t("admin.tickets.confirmed")}</p>
          <p className="text-2xl font-bold text-green-600">{stats.confirmedSeats}</p>
          <p className="text-xs text-gray-400">{t("admin.tickets.seats")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t("admin.tickets.attended")}</p>
          <p className="text-2xl font-bold text-blue-600">{stats.attendedSeats}</p>
          <p className="text-xs text-gray-400">{t("admin.tickets.seats")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t("admin.tickets.pending")}</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingSeats}</p>
          <p className="text-xs text-gray-400">{t("admin.tickets.seats")}</p>
        </div>
      </div>

      {/* Capacity Bar */}
      {event?.seatsInfo && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{t("admin.tickets.capacity")}</span>
            <span className="font-medium">
              {event.seatsInfo.reservedSeats} / {event.seatsInfo.maxSeats}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (event.seatsInfo.reservedSeats / event.seatsInfo.maxSeats) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {event.seatsInfo.availableSeats} {t("admin.tickets.seatsRemaining")}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.tickets.searchPlaceholder")}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("admin.common.all")}</option>
            <option value="CONFIRMED">{t("tickets.statusConfirmed")}</option>
            <option value="PENDING">{t("tickets.statusPending")}</option>
            <option value="ATTENDED">{t("tickets.statusAttended")}</option>
            <option value="CANCELLED">{t("tickets.statusCancelled")}</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t("admin.tickets.foundTickets").replace("{count}", String(filteredTickets.length))}
        </p>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  {t("admin.tickets.name")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  {t("admin.tickets.contact")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  {t("admin.tickets.seats")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  {t("admin.common.status")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  {t("admin.tickets.reservedOn")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  {t("admin.common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    {t("admin.tickets.noTicketsFound")}
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className={ticket.status === "ATTENDED" ? "bg-blue-50/30" : ""}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.holderName}
                      </div>
                      {ticket.notes && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {ticket.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{ticket.holderEmail}</div>
                      {ticket.holderPhone && (
                        <div className="text-xs text-gray-500">{ticket.holderPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {ticket.numberOfSeats}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ticket.status !== "ATTENDED" && ticket.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleQuickCheckIn(ticket)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title={t("admin.tickets.checkIn")}
                          >
                            <UserCheck className="w-4 h-4" />
                            {t("admin.tickets.checkIn")}
                          </button>
                        )}
                        {ticket.status === "ATTENDED" && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                            <Check className="w-4 h-4" />
                            {t("admin.tickets.checkedInLabel")}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setTicketToUpdate(ticket);
                            setNewStatus(ticket.status);
                            setUpdateModalOpen(true);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          {t("admin.tickets.changeStatus")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setTicketToUpdate(null);
        }}
        title={t("admin.tickets.updateStatusTitle")}
        hideFooter
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {t("admin.tickets.updateStatusFor")} <strong>{ticketToUpdate?.holderName}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.common.status")}
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">{t("tickets.statusPending")}</option>
              <option value="CONFIRMED">{t("tickets.statusConfirmed")}</option>
              <option value="ATTENDED">{t("tickets.statusAttended")}</option>
              <option value="CANCELLED">{t("tickets.statusCancelled")}</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setUpdateModalOpen(false);
                setTicketToUpdate(null);
              }}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {t("admin.common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("admin.common.saving")}
                </>
              ) : (
                t("admin.common.save")
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
