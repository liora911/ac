"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Lock, Sparkles } from "lucide-react";

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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
        </div>
      )}

      {/* Premium gate overlay */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {t("premiumGate.title") || "Premium Content"}
        </h3>

        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {t("premiumGate.description") ||
            "This content is available exclusively to Researcher plan subscribers."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {!session ? (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t("premiumGate.loginButton") || "Sign In"}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                {t("premiumGate.subscribeButton") || "Subscribe Now"}
              </Link>
            </>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              {t("premiumGate.upgradeButton") || "Upgrade to Researcher"}
            </Link>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-4">
          {t("premiumGate.benefits") ||
            "Get unlimited access to all premium articles, lectures, and presentations."}
        </p>
      </div>
    </div>
  );
}
