"use client";

import { signOut } from "next-auth/react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function SignOutButton() {
  const { showSuccess } = useNotification();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    showSuccess(t("auth.signOutSuccess"));
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      title={t("auth.signOut")}
    >
      {t("auth.signOut")}
    </button>
  );
}
