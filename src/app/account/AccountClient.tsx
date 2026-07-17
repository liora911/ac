"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  CreditCard,
  Ticket,
  LogOut,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Shield,
  Clock,
  ChevronRight,
  Settings,
  Heart,
  Filter,
  Check,
  X,
  Crown,
  Bell,
  User,
  Pencil,
  Calendar,
  MapPin,
  Users,
  FileText,
  Video,
  Presentation,
} from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategoryPreferences } from "@/contexts/CategoryPreferencesContext";
import { useCategories } from "@/hooks/useArticles";
import { useFavoritesFull } from "@/hooks/useFavorites";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import type { AccountClientProps } from "@/types/Account/account";
import NotificationsSection from "@/components/Notifications/NotificationsSection";
import LanguageToggle from "@/components/Settings/LanguageToggle";
import ThemeToggleSection from "@/components/Settings/ThemeToggleSection";
import FontSizeToggle from "@/components/Settings/FontSizeToggle";
import ReduceMotionToggle from "@/components/Settings/ReduceMotionToggle";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatDate, formatMonthYear, formatDateWithWeekday } from "@/lib/utils/date";
import { stripHtml } from "@/lib/utils/stripHtml";

// Extract username from email
function getUsernameFromEmail(email: string | null | undefined): string {
  if (!email) return "User";
  const prefix = email.split("@")[0];
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

type TabId = "subscription" | "activity" | "notifications" | "preferences" | "settings";

interface TabDef {
  id: TabId;
  labelKey: string;
  icon: React.ReactNode;
}

function AccountContent({
  user,
  subscription,
  ticketCount,
  favoritesCount,
}: AccountClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("activity");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [currentName, setCurrentName] = useState(user.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";

  const validConfirmations = ["delete", "מחק"];

  const {
    selectedCategoryIds,
    setSelectedCategories,
    resetPreferences,
    shouldFilterContent,
  } = useCategoryPreferences();
  const { data: categories } = useCategories();
  const { data: favorites, isLoading: favoritesLoading } = useFavoritesFull();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const { data: myTickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/my-tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });
  const queryClient = useQueryClient();
  const { data: newsletterStatus } = useQuery<{ subscribed: boolean }>({
    queryKey: ["newsletter-me"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/me");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const newsletterToggle = useMutation({
    mutationFn: async (subscribe: boolean) => {
      const res = await fetch("/api/newsletter/me", {
        method: subscribe ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-me"] });
    },
  });
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedCategoryIds);

  const success = searchParams.get("subscription") === "success";
  const displayName = currentName || getUsernameFromEmail(user.email);
  const initials = getInitials(currentName, user.email);
  const avatarColor = getAvatarColor(user.email);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setCurrentName(editName.trim());
        setIsEditingName(false);
      }
    } catch {
      // silently fail
    } finally {
      setIsSavingName(false);
    }
  };

  const tabs: TabDef[] = [
    { id: "subscription", labelKey: "account.subscription.title", icon: <CreditCard className="w-4 h-4" /> },
    { id: "activity", labelKey: "account.tabs.activity", icon: <Heart className="w-4 h-4" /> },
    { id: "notifications", labelKey: "account.notifications.title", icon: <Bell className="w-4 h-4" /> },
    { id: "preferences", labelKey: "account.tabs.preferences", icon: <Filter className="w-4 h-4" /> },
    { id: "settings", labelKey: "account.tabs.settings", icon: <Settings className="w-4 h-4" /> },
  ];

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

  const handleDeleteAccount = async () => {
    if (!validConfirmations.includes(deleteConfirmation.toLowerCase().trim())) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        const data = await response.json();
        alert(data.error || t("account.deleteAccount.error"));
      }
    } catch {
      alert(t("account.deleteAccount.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {t("account.subscription.cancelPending")}
        </span>
      );
    }
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      PAST_DUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      CANCELED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    const labels: Record<string, string> = {
      ACTIVE: t("account.subscription.active"),
      PAST_DUE: t("account.subscription.pastDue"),
      CANCELED: t("account.subscription.canceled"),
    };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.CANCELED}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ── Tab Content Renderers ──

  const renderSubscription = () => (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {subscription ? t("account.subscription.researcher") : t("account.subscription.free")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("account.subscription.title")}
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
                {formatDate(subscription.currentPeriodEnd, locale)}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  {t("account.subscription.cancelWarning").replace("{date}", formatDate(subscription.currentPeriodEnd, locale))}
                </span>
              </div>
            )}
            <button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      {/* ── Tickets Section ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.tickets.title")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {myTickets?.length ?? ticketCount} {t("account.tickets.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {ticketsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : myTickets && myTickets.length > 0 ? (
          <div className="space-y-3">
            {myTickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                href={`/ticket-summary/${ticket.accessToken}`}
                className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {ticket.event?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {ticket.event?.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateWithWeekday(ticket.event.eventDate, locale)}
                        </span>
                      )}
                      {ticket.event?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ticket.event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ticket.numberOfSeats}
                      </span>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                    ticket.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    ticket.status === "ATTENDED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    ticket.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {ticket.status === "CONFIRMED" ? t("account.tickets.confirmed") :
                     ticket.status === "ATTENDED" ? t("account.tickets.attended") :
                     ticket.status === "CANCELLED" ? t("account.tickets.cancelled") :
                     t("account.tickets.pending")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
            <Ticket className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>{t("account.tickets.empty")}</p>
            <Link href="/events" className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
              {t("account.tickets.browse")}
            </Link>
          </div>
        )}
      </div>

      {/* ── Favorites Section ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.quickLinks.favorites")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {favorites?.counts?.total ?? favoritesCount} {t("account.favorites.subtitle")}
              </p>
            </div>
          </div>
          {(favorites?.counts?.total ?? 0) > 0 && (
            <Link href="/favorites" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              {t("account.favorites.viewAll")}
            </Link>
          )}
        </div>

        {favoritesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (favorites?.counts?.total ?? 0) > 0 ? (
          <div className="space-y-3">
            {/* Articles */}
            {favorites?.articles && favorites.articles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  {t("favorites.tabs.articles")} ({favorites.articles.length})
                </h4>
                <div className="space-y-2">
                  {favorites.articles.slice(0, 20).map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug || article.id}`}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      {article.articleImage ? (
                        <img src={article.articleImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{article.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {article.category?.name} · {article.readDuration} {t("common.minRead")}
                        </p>
                      </div>
                      <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Lectures */}
            {favorites?.lectures && favorites.lectures.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 mt-4">
                  <Video className="w-3 h-3" />
                  {t("favorites.tabs.lectures")} ({favorites.lectures.length})
                </h4>
                <div className="space-y-2">
                  {favorites.lectures.slice(0, 20).map((lecture) => (
                    <Link
                      key={lecture.id}
                      href={`/lectures/${lecture.id}`}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lecture.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lecture.category?.name} · {lecture.duration}
                        </p>
                      </div>
                      <FavoriteButton itemId={lecture.id} itemType="LECTURE" size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Presentations */}
            {favorites?.presentations && favorites.presentations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 mt-4">
                  <Presentation className="w-3 h-3" />
                  {t("favorites.tabs.presentations")} ({favorites.presentations.length})
                </h4>
                <div className="space-y-2">
                  {favorites.presentations.slice(0, 20).map((pres) => (
                    <Link
                      key={pres.id}
                      href={`/presentations/${pres.id}`}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Presentation className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pres.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {pres.category?.name} · {pres.imageUrls?.length} {t("common.slides")}
                        </p>
                      </div>
                      <FavoriteButton itemId={pres.id} itemType="PRESENTATION" size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
            <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>{t("account.favorites.empty")}</p>
            <Link href="/articles" className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
              {t("account.favorites.browse")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <NotificationsSection />
  );

  const renderPreferences = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
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

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsEditingPreferences(false)}
              className="flex-1 py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
  );

  const renderSettings = () => (
    <div className="space-y-4">
      {/* Display Settings */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-5">
        <LanguageToggle />
        <ThemeToggleSection />
        <FontSizeToggle />
        <ReduceMotionToggle />
      </div>

      {/* Newsletter Subscription */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.newsletter.title")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("account.newsletter.description")}</p>
            </div>
          </div>
          <button
            onClick={() => newsletterToggle.mutate(!newsletterStatus?.subscribed)}
            disabled={newsletterToggle.isPending}
            className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
              newsletterStatus?.subscribed
                ? "bg-blue-600"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                newsletterStatus?.subscribed ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Admin Panel Link */}
      {user.role === "ADMIN" && (
        <Link
          href="/elitzur"
          className="block rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
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

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        {t("account.logout")}
      </button>

      {/* Delete Account */}
      <button
        onClick={() => setShowDeleteModal(true)}
        className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <X className="w-4 h-4" />
        {t("account.deleteAccount.button")}
      </button>
    </div>
  );

  const tabContent: Record<TabId, () => React.ReactNode> = {
    subscription: renderSubscription,
    activity: renderActivity,
    notifications: renderNotifications,
    preferences: renderPreferences,
    settings: renderSettings,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-6 px-3 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Success message */}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t("account.welcomeMessage")}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Left Sidebar — sticky so navigation never scrolls away ── */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-4 lg:sticky lg:top-20">
            {/* Profile Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              {/* Mini Banner */}
              <div className="h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
              <div className="px-5 pb-5">
                {/* Avatar */}
                <div className="-mt-8 mb-3">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-lg border-3 border-white dark:border-gray-900`}>
                    {initials}
                  </div>
                </div>

                {/* Name & Edit */}
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                      autoFocus
                      className="flex-1 min-w-0 px-2 py-1 text-sm font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName || !editName.trim()}
                      className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setIsEditingName(false); setEditName(currentName || ""); }}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {displayName}
                    </h1>
                    <button
                      onClick={() => { setEditName(currentName || getUsernameFromEmail(user.email)); setIsEditingName(true); }}
                      className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      title={t("account.editNickname")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 truncate">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {user.role === "ADMIN" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      {t("account.role.admin")}
                    </span>
                  )}
                  {subscription?.status === "ACTIVE" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                      <Crown className="w-3 h-3" />
                      {t("account.role.premium")}
                    </span>
                  )}
                </div>

                {/* Member Since */}
                {user.createdAt && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {t("account.memberSince")} {formatMonthYear(user.createdAt, locale)}
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              {tabs.filter((tab) => tab.id !== "subscription").map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className={activeTab === tab.id ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}>
                    {tab.icon}
                  </span>
                  {t(tab.labelKey)}
                  {tab.id === "notifications" && unreadCount > 0 && (
                    <span className="ms-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <ChevronRight className="w-4 h-4 ms-auto rtl:rotate-180" />
                  )}
                </button>
              ))}
            </nav>

          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
              {tabContent[activeTab]()}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("account.deleteAccount.title")}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("account.deleteAccount.warning")}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {t("account.deleteAccount.confirmInstruction")}
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={t("account.deleteAccount.confirmPlaceholder")}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              dir="ltr"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("admin.common.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!validConfirmations.includes(deleteConfirmation.toLowerCase().trim()) || isDeleting}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? t("account.deleteAccount.deleting") : t("account.deleteAccount.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
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
