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
  Shield,
  Clock,
  ChevronRight,
  Settings,
  Bell,
  FileText,
  Video,
  Heart,
  Filter,
  Check,
  X,
} from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategoryPreferences } from "@/contexts/CategoryPreferencesContext";
import { useCategories } from "@/hooks/useArticles";
import type { AccountClientProps } from "@/types/Account/account";

// Extract username from email
function getUsernameFromEmail(email: string | null | undefined): string {
  if (!email) return "User";
  const prefix = email.split("@")[0];
  // Split by dots, dashes, and underscores, then capitalize each word
  return prefix
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Get initials for avatar
function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    const prefix = email.split("@")[0];
    return prefix.slice(0, 2).toUpperCase();
  }
  return "U";
}

// Generate consistent color from string
function getAvatarColor(email: string | null | undefined): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-purple-500 to-purple-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
  ];
  if (!email) return colors[0];
  const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function AccountContent({
  user,
  subscription,
  ticketCount,
  stats,
}: AccountClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";

  // Category preferences
  const {
    selectedCategoryIds,
    setSelectedCategories,
    resetPreferences,
    shouldFilterContent,
  } = useCategoryPreferences();
  const { data: categories } = useCategories();
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedCategoryIds);

  const success = searchParams.get("subscription") === "success";
  const displayName = user.name || getUsernameFromEmail(user.email);
  const initials = getInitials(user.name, user.email);
  const avatarColor = getAvatarColor(user.email);

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
        alert(t("account.errors.subscriptionPortal"));
      }
    } catch {
      alert(t("account.errors.subscriptionPortal"));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {t("account.subscription.cancelPending")}
        </span>
      );
    }
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {t("account.subscription.active")}
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {t("account.subscription.pastDue")}
          </span>
        );
      case "CANCELED":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {t("account.subscription.canceled")}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success message */}
        {success && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t("account.welcomeMessage")}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar - positioned to overlap banner */}
            <div className="-mt-12 mb-4">
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white dark:border-gray-900`}>
                {initials}
              </div>
            </div>

            {/* Name, Email and Badges - fully in white area */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h1>
                {/* Role Badges */}
                <div className="flex items-center gap-2">
                  {user.role === "ADMIN" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      {t("account.role.admin")}
                    </span>
                  )}
                  {subscription?.status === "ACTIVE" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
                      <Sparkles className="w-4 h-4" />
                      {t("account.role.premium")}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>

            {/* Member Info */}
            {user.createdAt && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {t("account.memberSince")} {formatMemberSince(user.createdAt)}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Subscription Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.subscription.title")}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription ? t("account.subscription.researcher") : t("account.subscription.free")}
                </p>
              </div>
            </div>

            {subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t("account.subscription.status")}</span>
                  {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t("account.subscription.renewDate")}</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      {t("account.subscription.cancelWarning").replace("{date}", formatDate(subscription.currentPeriodEnd))}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  {isLoading ? t("account.subscription.opening") : t("account.subscription.manage")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("account.subscription.upgradeText")}
                </p>
                <Link
                  href="/pricing"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t("account.subscription.upgrade")}
                </Link>
              </div>
            )}
          </div>

          {/* Tickets Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.tickets.title")}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("account.tickets.subtitle")}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{ticketCount}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t("account.tickets.total")}</span>
            </div>

            {ticketCount > 0 ? (
              <Link
                href="/my-tickets"
                className="w-full py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {t("account.tickets.view")}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            ) : (
              <Link
                href="/events"
                className="w-full py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {t("account.tickets.browse")}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            )}
          </div>

          {/* Quick Links Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.quickLinks.title")}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("account.quickLinks.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/favorites"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <Heart className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {t("account.quickLinks.favorites")}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 ms-auto rtl:rotate-180" />
              </Link>
              <Link
                href="/articles"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {t("account.quickLinks.articles")}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 ms-auto rtl:rotate-180" />
              </Link>
              <Link
                href="/lectures"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <Video className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {t("account.quickLinks.lectures")}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 ms-auto rtl:rotate-180" />
              </Link>
              <Link
                href="/events"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {t("account.quickLinks.events")}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 ms-auto rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Content Preferences Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t("categoryPreferences.managePreferences") || "Content Preferences"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {shouldFilterContent
                    ? `${selectedCategoryIds.length} ${selectedCategoryIds.length === 1 ? t("categoryPreferences.categorySelected") : t("categoryPreferences.categoriesSelected")}`
                    : t("categoryPreferences.showingAll") || "Showing all content"}
                </p>
              </div>
            </div>
            {!isEditingPreferences && (
              <button
                onClick={() => {
                  setTempSelectedIds(selectedCategoryIds);
                  setIsEditingPreferences(true);
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium"
              >
                {t("categoryPreferences.changePreferences") || "Change"}
              </button>
            )}
          </div>

          {isEditingPreferences ? (
            <div className="space-y-4">
              {/* Show All Option */}
              <button
                onClick={() => setTempSelectedIds([])}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  tempSelectedIds.length === 0
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    tempSelectedIds.length === 0
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-300 dark:border-gray-500"
                  }`}
                >
                  {tempSelectedIds.length === 0 && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={`font-medium text-sm ${
                  tempSelectedIds.length === 0
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {t("categoryPreferences.showAll") || "Show me everything"}
                </span>
              </button>

              {/* Category Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {categories?.map((category) => {
                  const isSelected = tempSelectedIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setTempSelectedIds((prev) =>
                          prev.includes(category.id)
                            ? prev.filter((id) => id !== category.id)
                            : [...prev, category.id]
                        );
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300 dark:border-gray-500"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-sm ${
                        isSelected
                          ? "text-indigo-700 dark:text-indigo-300 font-medium"
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditingPreferences(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setSelectedCategories(tempSelectedIds);
                    setIsEditingPreferences(false);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  {t("admin.common.save") || "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {shouldFilterContent ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      ?.filter((c) => selectedCategoryIds.includes(c.id))
                      .map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        >
                          {category.name}
                        </span>
                      ))}
                  </div>
                  <button
                    onClick={resetPreferences}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                  >
                    {t("categoryPreferences.resetToAll") || "Reset to show all"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("categoryPreferences.welcomeDescription") || "You're seeing all content. Change preferences to filter by specific categories."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Admin Panel Link */}
        {user.role === "ADMIN" && (
          <Link
            href="/elitzur"
            className="block rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-5 shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">{t("account.admin.title")}</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{t("account.admin.subtitle")}</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </div>
          </Link>
        )}

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          {t("account.logout")}
        </button>

        {/* Back to home */}
        <div className="text-center pb-4">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← {t("account.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccountClient(props: AccountClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AccountContent {...props} />
    </Suspense>
  );
}
