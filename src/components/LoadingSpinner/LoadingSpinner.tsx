"use client";

import React from "react";

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Optional loading message */
  message?: string;
  /** Whether to show in a card container */
  withCard?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-3",
};

/**
 * Reusable loading spinner component with optional message and card wrapper.
 *
 * @example
 * // Simple spinner
 * <LoadingSpinner />
 *
 * @example
 * // With message
 * <LoadingSpinner message="Loading categories..." />
 *
 * @example
 * // In a card
 * <LoadingSpinner
 *   message={t("common.loading")}
 *   withCard
 * />
 *
 * @example
 * // Large spinner
 * <LoadingSpinner size="lg" />
 */
export default function LoadingSpinner({
  size = "md",
  message,
  withCard = false,
  className = "",
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeClasses[size]}`}
      />
      {message && <p className="text-gray-600 dark:text-gray-400">{message}</p>}
    </div>
  );

  if (withCard) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Full-page centered loading spinner
 */
export function PageLoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

/**
 * Inline loading spinner for buttons or small areas
 */
export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent ${className}`}
    />
  );
}
