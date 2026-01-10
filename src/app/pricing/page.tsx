"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight, Heart, BookOpen, Video, FileText } from "lucide-react";
import { Suspense } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";

function PricingContent() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<"monthly" | "yearly" | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";

  const cancelled = searchParams.get("cancelled");

  const handleSubscribe = async (interval: "monthly" | "yearly") => {
    if (!session) {
      router.push("/auth/login?callbackUrl=/pricing");
      return;
    }

    setIsLoading(interval);

    try {
      const priceId =
        interval === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_RESEARCHER_MONTHLY_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_RESEARCHER_YEARLY_PRICE_ID;

      const response = await fetch("/api/stripe/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || t("pricing.errors.generic"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t("pricing.errors.generic"));
    } finally {
      setIsLoading(null);
    }
  };

  if (status === "loading") {
    return <PricingSkeleton />;
  }

  // If user already has subscription
  if (session?.user.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-8">
            <Sparkles className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("pricing.alreadySubscribed.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("pricing.alreadySubscribed.description")}
            </p>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t("pricing.alreadySubscribed.manageButton")}
              <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            {t("pricing.supportBadge")}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("pricing.title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Support Research Message */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t("pricing.supportResearch.title")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {t("pricing.supportResearch.description")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancelled notice */}
        {cancelled && (
          <div className="mb-8 max-w-lg mx-auto rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 text-center">
            {t("pricing.cancelled")}
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          {/* Monthly */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("pricing.monthly.title")}
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">₪49</span>
              <span className="text-gray-500 dark:text-gray-400"> / {t("pricing.monthly.period")}</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.premiumArticles")}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.exclusiveLectures")}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.presentations")}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.cancelAnytime")}
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={isLoading !== null}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading === "monthly" ? t("pricing.processing") : t("pricing.monthly.button")}
            </button>
          </div>

          {/* Yearly - Recommended */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-white dark:bg-gray-900 p-6 shadow-sm relative">
            <div className="absolute -top-3 right-4 rtl:right-auto rtl:left-4 bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              {t("pricing.yearly.badge")}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("pricing.yearly.title")}
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">₪490</span>
              <span className="text-gray-500 dark:text-gray-400"> / {t("pricing.yearly.period")}</span>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                {t("pricing.yearly.perMonth")}
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.premiumArticles")}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.exclusiveLectures")}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.presentations")}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.cancelAnytime")}
              </li>
              <li className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <Heart className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {t("pricing.features.supportResearch")}
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe("yearly")}
              disabled={isLoading !== null}
              className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading === "yearly" ? t("pricing.processing") : t("pricing.yearly.button")}
            </button>
          </div>
        </div>

        {/* What's included section */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
            {t("pricing.whatsIncluded.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {t("pricing.whatsIncluded.articles.title")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pricing.whatsIncluded.articles.description")}
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {t("pricing.whatsIncluded.lectures.title")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pricing.whatsIncluded.lectures.description")}
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {t("pricing.whatsIncluded.presentations.title")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pricing.whatsIncluded.presentations.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            ← {t("pricing.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="text-center space-y-4">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded mx-auto" />
            <div className="h-6 w-96 bg-gray-100 dark:bg-gray-800 rounded mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800" />
            <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}
