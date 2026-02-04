"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import Modal from "@/components/Modal/Modal";
import {
  Search,
  UserPlus,
  UserMinus,
  Crown,
  Loader2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { UserWithSubscription } from "@/types/User/user";
import { formatDateShort } from "@/lib/utils/date";

export default function SubscriptionsAdmin() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "subscribed" | "unsubscribed">("all");

  // Grant subscription modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantDuration, setGrantDuration] = useState<"1month" | "3months" | "1year" | "lifetime">("1month");
  const [grantLoading, setGrantLoading] = useState(false);

  // Revoke subscription modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      showError(t("admin.subscriptions.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGrantSubscription = async () => {
    if (!grantEmail.trim()) {
      showError(t("admin.subscriptions.emailRequired"));
      return;
    }

    try {
      setGrantLoading(true);
      const res = await fetch("/api/admin/subscriptions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: grantEmail.trim().toLowerCase(),
          duration: grantDuration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to grant subscription");
      }

      showSuccess(t("admin.subscriptions.grantSuccess").replace("{email}", grantEmail));
      setShowGrantModal(false);
      setGrantEmail("");
      setGrantDuration("1month");
      fetchUsers();
    } catch (error) {
      showError(error instanceof Error ? error.message : t("admin.subscriptions.grantError"));
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokeSubscription = async () => {
    if (!selectedUser) return;

    try {
      setRevokeLoading(true);
      const res = await fetch("/api/admin/subscriptions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke subscription");
      }

      showSuccess(t("admin.subscriptions.revokeSuccess").replace("{email}", selectedUser.email));
      setShowRevokeModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showError(error instanceof Error ? error.message : t("admin.subscriptions.revokeError"));
    } finally {
      setRevokeLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasActiveSubscription = user.subscription?.status === "ACTIVE";

    if (filterType === "subscribed") return matchesSearch && hasActiveSubscription;
    if (filterType === "unsubscribed") return matchesSearch && !hasActiveSubscription;
    return matchesSearch;
  });

  const getStatusBadge = (subscription: UserWithSubscription["subscription"]) => {
    if (!subscription) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <XCircle className="w-3 h-3" />
          {t("admin.subscriptions.noSubscription")}
        </span>
      );
    }

    switch (subscription.status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            {t("admin.subscriptions.active")}
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            {t("admin.subscriptions.canceled")}
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            {t("admin.subscriptions.pastDue")}
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <XCircle className="w-3 h-3" />
            {t("admin.subscriptions.expired")}
          </span>
        );
      default:
        return null;
    }
  };

  const subscribedCount = users.filter((u) => u.subscription?.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("admin.subscriptions.title")}</h2>
          <p className="text-gray-500 mt-1">
            {t("admin.subscriptions.activeCount").replace("{count}", String(subscribedCount)).replace("{total}", String(users.length))}
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          {t("admin.subscriptions.grantSubscription")}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("admin.subscriptions.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white cursor-pointer"
        >
          <option value="all">{t("admin.subscriptions.allUsers")}</option>
          <option value="subscribed">{t("admin.subscriptions.subscribedOnly")}</option>
          <option value="unsubscribed">{t("admin.subscriptions.unsubscribedOnly")}</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t("admin.subscriptions.noUsersFound")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">משתמש</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תוקף</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                          {user.email?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || t("admin.subscriptions.noName")}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        {user.role === "ADMIN" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            {t("admin.subscriptions.admin")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user.subscription)}
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription?.currentPeriodEnd ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDateShort(user.subscription.currentPeriodEnd, "he")}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription?.status === "ACTIVE" ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRevokeModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                          {t("admin.subscriptions.revokeSubscription")}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setGrantEmail(user.email || "");
                            setShowGrantModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Crown className="w-4 h-4" />
                          {t("admin.subscriptions.grantSubscription")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grant Subscription Modal */}
      <Modal
        isOpen={showGrantModal}
        onClose={() => {
          setShowGrantModal(false);
          setGrantEmail("");
        }}
        title={t("admin.subscriptions.grantTitle")}
        hideFooter
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.subscriptions.emailLabel")}
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("admin.subscriptions.emailHelp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.subscriptions.durationLabel")}
            </label>
            <select
              value={grantDuration}
              onChange={(e) => setGrantDuration(e.target.value as typeof grantDuration)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="1month">{t("admin.subscriptions.duration1Month")}</option>
              <option value="3months">{t("admin.subscriptions.duration3Months")}</option>
              <option value="1year">{t("admin.subscriptions.duration1Year")}</option>
              <option value="lifetime">{t("admin.subscriptions.durationLifetime")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowGrantModal(false);
                setGrantEmail("");
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              {t("admin.subscriptions.cancel")}
            </button>
            <button
              onClick={handleGrantSubscription}
              disabled={grantLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {grantLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {t("admin.subscriptions.grantSubscription")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Revoke Subscription Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedUser(null);
        }}
        title={t("admin.subscriptions.revokeTitle")}
        message={t("admin.subscriptions.revokeConfirm").replace("{email}", selectedUser?.email || "")}
        showCancel
        cancelText={t("admin.subscriptions.cancel")}
        confirmText={revokeLoading ? t("admin.subscriptions.revoking") : t("admin.subscriptions.revokeSubscription")}
        onConfirm={handleRevokeSubscription}
      />
    </div>
  );
}
