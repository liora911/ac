"use client";

import React from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface AuthPromptProps {
  /** Title text or translation key result */
  title?: string;
  /** Message text or translation key result */
  message?: string;
  /** Button text or translation key result */
  buttonText?: string;
  /** URL to redirect to on button click */
  redirectUrl?: string;
  /** Whether to show in a card container */
  withCard?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable component for showing unauthenticated/unauthorized prompts.
 * Displays a message with a login button.
 *
 * @example
 * // Basic usage with defaults
 * <AuthPrompt />
 *
 * @example
 * // With custom text
 * <AuthPrompt
 *   title={t("createEvent.loginRequiredTitle")}
 *   message={t("createEvent.loginRequiredMessage")}
 *   buttonText={t("createEvent.loginButton")}
 * />
 *
 * @example
 * // Without card wrapper
 * <AuthPrompt withCard={false} />
 */
export default function AuthPrompt({
  title,
  message,
  buttonText,
  redirectUrl = "/elitzur",
  withCard = true,
  className = "",
}: AuthPromptProps) {
  const { t, locale } = useTranslation();

  const displayTitle = title || (locale === "he" ? "נדרשת התחברות" : "Login Required");
  const displayMessage =
    message ||
    (locale === "he"
      ? "עליך להתחבר כדי לגשת לתוכן זה."
      : "You must be logged in to access this content.");
  const displayButtonText = buttonText || (locale === "he" ? "התחבר" : "Log In");

  const content = (
    <div className={className}>
      <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
        {displayTitle}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">{displayMessage}</p>
      <button
        onClick={() => (window.location.href = redirectUrl)}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
      >
        {displayButtonText}
      </button>
    </div>
  );

  if (withCard) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Unauthorized prompt for admin-only content
 */
export function UnauthorizedPrompt({
  message,
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  const { locale } = useTranslation();

  const displayMessage =
    message ||
    (locale === "he"
      ? "אין לך הרשאה לגשת לתוכן זה."
      : "You don't have permission to access this content.");

  return (
    <div
      className={`p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 ${className}`}
    >
      <p className="text-amber-800 dark:text-amber-200">{displayMessage}</p>
    </div>
  );
}
