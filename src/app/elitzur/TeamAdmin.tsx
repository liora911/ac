"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import {
  useAdminUsers,
  useUpdateAdminUser,
  type AdminUser,
} from "@/hooks/useAdminUsers";
import { GRANTABLE_SECTIONS, isFullAdmin } from "@/constants/permissions";
import { Loader2, Search, ShieldCheck, User as UserIcon } from "lucide-react";

const cardCls =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm";
const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function UserRow({ user }: { user: AdminUser }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const updateUser = useUpdateAdminUser();

  const admin = user.role === "ADMIN";

  const save = async (payload: { role?: "USER" | "ADMIN"; permissions?: string[] }) => {
    try {
      await updateUser.mutateAsync({ id: user.id, ...payload });
      showSuccess(t("adminTeam.saved"));
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminTeam.errorGeneric"));
    }
  };

  const toggleAdmin = () => save({ role: admin ? "USER" : "ADMIN" });

  const toggleSection = (key: string) => {
    const next = user.permissions.includes(key)
      ? user.permissions.filter((p) => p !== key)
      : [...user.permissions, key];
    save({ permissions: next });
  };

  return (
    <div className={`${cardCls} flex flex-col gap-4`}>
      <div className="flex items-center gap-3 flex-wrap">
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-[160px]">
          {user.name && (
            <div className="font-semibold text-gray-900 dark:text-white">
              {user.name}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate" dir="ltr">
            {user.email}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleAdmin}
          disabled={updateUser.isPending}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
            admin
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          title={admin ? t("adminTeam.demoteHint") : t("adminTeam.promoteHint")}
        >
          {admin ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <UserIcon className="w-4 h-4" />
          )}
          {admin ? t("adminTeam.fullAdmin") : t("adminTeam.regularUser")}
        </button>
      </div>

      {/* Section permissions — only meaningful for non-admins */}
      {admin ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("adminTeam.adminHasAll")}
        </p>
      ) : (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("adminTeam.sectionsLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {GRANTABLE_SECTIONS.map((section) => {
              const on = user.permissions.includes(section.key);
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  disabled={updateUser.isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                    on
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={on}
                >
                  {t(section.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const { data: users, isLoading, isError } = useAdminUsers(query || undefined);

  // Safety: the tab is already gated, but never render the controls to a non-admin
  if (!isFullAdmin(session?.user)) {
    return (
      <div className={`${cardCls} text-center text-gray-500 dark:text-gray-400 py-12`}>
        {t("adminTeam.adminsOnly")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("adminTeam.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("adminTeam.subtitle")}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("adminTeam.searchPlaceholder")}
          className={`${inputCls} ps-9`}
          dir="auto"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : isError ? (
        <div className={`${cardCls} text-center text-red-500 py-12`}>
          {t("adminTeam.errorGeneric")}
        </div>
      ) : !users || users.length === 0 ? (
        <div className={`${cardCls} text-center text-gray-500 dark:text-gray-400 py-12`}>
          {t("adminTeam.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
