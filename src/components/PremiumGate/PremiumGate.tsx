"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Lock, Sparkles, Crown } from "lucide-react";

interface PremiumGateProps {
  isPremium: boolean;
  children: React.ReactNode;
  previewContent?: React.ReactNode;
}

export default function PremiumGate({
  isPremium,
  children,
  previewContent,
}: PremiumGateProps) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  // If not premium content, show everything
  if (!isPremium) {
    return <>{children}</>;
  }

  // Check if user has access (admin or active subscription)
  const hasAccess =
    session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show premium gate
  return (
    <div className="relative">
      {/* Preview content with blur */}
      {previewContent && (
        <div className="relative overflow-hidden max-h-96">
          <div className="blur-sm pointer-events-none select-none">
            {previewContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-gray-900/80 dark:to-gray-900"></div>
        </div>
      )}

      {/* Premium gate overlay */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center shadow-xl shadow-amber-100/50 dark:shadow-amber-900/20">
        {/* Icon with animation */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse opacity-20"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-300/50 dark:shadow-amber-900/50">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title with crown */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          {t("premiumGate.title") || "Premium Content"}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {t("premiumGate.description") ||
            "This content is available exclusively to Researcher plan subscribers."}
        </p>

        {/* Benefits pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t("premiumTeaser.benefit1")}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t("premiumTeaser.benefit2")}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t("premiumTeaser.benefit3")}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {!session ? (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              >
                {t("premiumGate.loginButton") || "Sign In"}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 hover:scale-105"
              >
                <Crown className="w-5 h-5" />
                {t("premiumGate.subscribeButton") || "Subscribe Now"}
              </Link>
            </>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 hover:scale-105"
            >
              <Crown className="w-5 h-5" />
              {t("premiumGate.upgradeButton") || "Upgrade to Researcher"}
            </Link>
          )}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          {t("premiumTeaser.priceHint")}
        </p>
      </div>
    </div>
  );
}
