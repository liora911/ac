import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";
import { Ticket, Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { formatDateWithWeekday } from "@/lib/utils/date";

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/my-tickets");
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: {
      event: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
            מאושר
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            ממתין לתשלום
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            בוטל
          </span>
        );
      case "ATTENDED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            השתתף
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Ticket className="w-8 h-8" />
            הכרטיסים שלי
          </h1>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              אין לך כרטיסים עדיין
            </h2>
            <p className="text-gray-500 mb-6">
              כשתרכוש כרטיסים לאירועים, הם יופיעו כאן
            </p>
            <a
              href="/events"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              עיין באירועים
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ticket.event.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateWithWeekday(ticket.event.eventDate, "he")}
                      </span>
                      {ticket.event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {ticket.event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {ticket.numberOfSeats}{" "}
                      {ticket.numberOfSeats === 1 ? "מקום" : "מקומות"}
                    </span>
                    <span>{ticket.holderName}</span>
                  </div>
                  <a
                    href={`/ticket-summary/${ticket.accessToken}`}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    פרטי כרטיס
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <a
            href="/account"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← חזור לחשבון
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            חזור לדף הבית
          </a>
        </div>
      </div>
    </div>
  );
}
