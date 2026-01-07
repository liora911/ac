"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "שגיאת תצורה",
    description: "יש בעיה בהגדרות השרת. אנא פנה למנהל המערכת.",
  },
  AccessDenied: {
    title: "גישה נדחתה",
    description: "אין לך הרשאה לגשת למשאב זה.",
  },
  Verification: {
    title: "שגיאת אימות",
    description: "הקישור פג תוקף או כבר נעשה בו שימוש. אנא נסה שוב.",
  },
  Default: {
    title: "שגיאה",
    description: "אירעה שגיאה בתהליך ההתחברות. אנא נסה שוב.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";

  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            {errorInfo.description}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <a
              href="/auth/admin-login"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              נסה להתחבר שוב
            </a>
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              חזור לדף הבית
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-200" />
            <div className="h-6 w-32 mx-auto rounded bg-gray-200" />
            <div className="h-4 w-48 mx-auto rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<ErrorSkeleton />}>
      <AuthErrorContent />
    </Suspense>
  );
}
