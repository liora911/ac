"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";

const errorKeyMap: Record<string, string> = {
  Configuration: "configuration",
  AccessDenied: "accessDenied",
  Verification: "verification",
  Default: "default",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const error = searchParams.get("error") || "Default";
  const errorKey = errorKeyMap[error] || "default";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-lg">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t(`authError.${errorKey}.title`)}
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t(`authError.${errorKey}.description`)}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <a
              href="/auth/admin-login"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("authError.tryAgain")}
            </a>
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              {t("authError.backToHome")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-32 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-48 mx-auto rounded bg-gray-100 dark:bg-gray-600" />
            <div className="h-10 w-full rounded bg-gray-100 dark:bg-gray-600" />
            <div className="h-10 w-full rounded bg-gray-100 dark:bg-gray-600" />
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
