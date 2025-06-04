"use client";

import { navItems } from "@/constants/Nav/data";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { useState } from "react";
import LocaleSelect from "../LocaleSelect/locale-select";

export default function Header() {
  const { t, locale, setLocale } = useTranslation();

  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-slate-50 px-4 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          A.Elitzur
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex flex-wrap justify-center items-center gap-4 text-sm sm:text-base">
            {navItems.map(({ label, href, className }) => (
              <Link
                key={href}
                href={href}
                className={`hover:underline underline-offset-4 ${
                  className || ""
                }`}
                onClick={() => setActiveNavItem(href)}
                style={{
                  textDecoration:
                    activeNavItem === href ? "underline" : undefined,
                }}
              >
                {t(label)}
              </Link>
            ))}
          </nav>

          <div className="relative shrink-0">
            <LocaleSelect value={locale} onChange={setLocale} />
          </div>
        </div>
      </div>
    </header>
  );
}
