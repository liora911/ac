"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { BookOpen, GraduationCap, Users, ArrowRight } from "lucide-react";
import type { PremiumGateProps } from "@/types/Components/components";

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent"></div>
      </div>
    );
  }

  const benefits = [
    {
      icon: BookOpen,
      label: t("premiumTeaser.benefit1"),
    },
    {
      icon: GraduationCap,
      label: t("premiumTeaser.benefit2"),
    },
    {
      icon: Users,
      label: t("premiumTeaser.benefit3"),
    },
  ];

  // Show premium gate
  return (
    <div className="relative">
      {/* Preview content with fade */}
      {previewContent && (
        <div className="relative overflow-hidden max-h-80">
          <div className="blur-[2px] pointer-events-none select-none opacity-60">
            {previewContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-gray-900/70 dark:to-gray-900"></div>
        </div>
      )}

      {/* Premium gate - Clean academic design */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* Subtle top accent line */}
        <div className="h-1 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 dark:from-gray-800 dark:via-gray-600 dark:to-gray-800"></div>

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Header section */}
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
              {t("premiumGate.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              {t("premiumGate.description")}
            </p>
          </div>

          {/* Benefits - horizontal on desktop, stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:flex-col sm:text-center p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {benefit.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA section */}
          <div className="flex flex-col items-center gap-4">
            {!session ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  {t("premiumGate.subscribeButton")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center text-gray-600 dark:text-gray-400 px-6 py-3 rounded-lg font-medium hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("premiumGate.loginButton")}
                </Link>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                {t("premiumGate.upgradeButton")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t("premiumTeaser.priceHint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
