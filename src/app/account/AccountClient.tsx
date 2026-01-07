"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  CreditCard,
  Ticket,
  LogOut,
  ExternalLink,
  Sparkles,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Suspense } from "react";
import { UserRole } from "@prisma/client";

interface AccountClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  ticketCount: number;
}

function AccountContent({
  user,
  subscription,
  ticketCount,
}: AccountClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const success = searchParams.get("subscription") === "success";

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "שגיאה בפתיחת ניהול המנוי");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("שגיאה בפתיחת ניהול המנוי");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          יבוטל בסוף התקופה
        </span>
      );
    }
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
            פעיל
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            תשלום נדרש
          </span>
        );
      case "CANCELED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            מבוטל
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">החשבון שלי</h1>
        </div>

        {/* Success message */}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            ברוך הבא! המנוי שלך הופעל בהצלחה.
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            פרטים אישיים
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{user.email}</span>
            </div>
            {user.name && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.name}</span>
              </div>
            )}
            {user.role === "ADMIN" && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href="/elitzur"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  פאנל ניהול
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            מנוי
          </h2>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">סטטוס</span>
                {getStatusBadge(
                  subscription.status,
                  subscription.cancelAtPeriodEnd
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">תאריך חידוש</span>
                <span className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <span className="text-sm text-amber-700">
                    המנוי שלך יבוטל ב-{formatDate(subscription.currentPeriodEnd)}
                    . ניתן לחדש דרך ניהול המנוי.
                  </span>
                </div>
              )}
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? "פותח..." : "נהל מנוי"}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">אין לך מנוי פעיל</p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                הירשם למנוי חוקר
              </a>
            </div>
          )}
        </div>

        {/* Tickets Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-gray-400" />
            כרטיסים
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">כרטיסים שרכשת</span>
            <span className="text-gray-900 font-medium">{ticketCount}</span>
          </div>
          {ticketCount > 0 && (
            <a
              href="/my-tickets"
              className="mt-4 block text-center py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              צפה בכרטיסים
            </a>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full py-3 px-4 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </button>

        {/* Back to home */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← חזור לדף הבית
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AccountClient(props: AccountClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AccountContent {...props} />
    </Suspense>
  );
}
