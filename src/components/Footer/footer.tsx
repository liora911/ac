"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";

function BlackHoleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="accretionDisk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="30%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#fff4e0" />
          <stop offset="70%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ff6b35" />
        </linearGradient>
        <radialGradient id="eventHorizon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="70%" stopColor="#000000" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="#ff6b3522" />
        </radialGradient>
      </defs>
      {/* Outer glow */}
      <circle cx="16" cy="16" r="15" fill="url(#glow)" />
      {/* Accretion disk - back */}
      <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="url(#accretionDisk)" strokeWidth="2" opacity="0.6" />
      {/* Event horizon (black hole) */}
      <circle cx="16" cy="16" r="6" fill="url(#eventHorizon)" />
      {/* Photon ring */}
      <circle cx="16" cy="16" r="7" fill="none" stroke="#ffd700" strokeWidth="0.5" opacity="0.8" />
      {/* Accretion disk - front */}
      <path d="M 2 16 Q 16 21 30 16" fill="none" stroke="url(#accretionDisk)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Footer() {
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-slate-50 px-4 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
        <p dir={isHebrew ? "rtl" : "ltr"}>{t("footer.contact")}</p>
        <div
          className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400"
          dir={isHebrew ? "rtl" : "ltr"}
        >
          <BlackHoleIcon className="w-4 h-4" />
          <span>
            {isHebrew ? "פותח באהבה על ידי: Y.M" : "Developed By: Y.M"}
          </span>
        </div>
      </div>
    </footer>
  );
}
