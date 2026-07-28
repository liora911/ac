import React from "react";

/**
 * The shared homepage carousel title — a slate gradient pill with a soft glow.
 * Every section uses this so the titles stay visually identical; pass an
 * optional `icon` (e.g. the Featured flame) to sit before the text.
 */
export default function CarouselTitlePill({
  title,
  icon,
}: {
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      {/* Soft glow behind the badge */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-slate-500/20 via-slate-400/15 to-slate-600/20 dark:from-slate-500/10 dark:via-slate-400/10 dark:to-slate-600/10 rounded-2xl blur-lg" />
      {/* Badge */}
      <div className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 shadow-lg">
        {icon}
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight whitespace-nowrap">
          {title}
        </h2>
      </div>
    </div>
  );
}
