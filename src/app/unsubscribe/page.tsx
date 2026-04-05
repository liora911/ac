"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/newsletter/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setStatus(res.ok ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              הוסרת בהצלחה
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You have been unsubscribed from the newsletter.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              הוסרת מרשימת התפוצה בהצלחה.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Back to site
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              שגיאה
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Invalid or expired unsubscribe link.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Back to site
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
