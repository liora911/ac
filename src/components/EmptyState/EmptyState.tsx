import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * A proper, designed empty state — an icon, a title, and a supporting line —
 * so sparse/unpopulated sections read as intentional rather than broken.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 md:py-24">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
