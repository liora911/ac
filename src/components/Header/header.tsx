"use client";

import { navItems } from "@/constants/Nav/data";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";
import { useState } from "react";
import LocaleSelect from "../LocaleSelect/locale-select";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const { t, locale, setLocale } = useTranslation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);

  const visibleNavItems = [
    ...navItems,
    ...(session
      ? [
          {
            label: "העלאת מדיה",
            href: "/elitzur",
            className: "text-red-600 font-semibold",
          },
        ]
      : []),
  ];
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-slate-50 px-4 py-5 sm:py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            A.Elitzur
          </Link>
          <div className="flex items-center gap-4">
            <button
              className="sm:hidden text-2xl focus:outline-none"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <nav className="hidden sm:flex flex flex-wrap justify-center items-center gap-4 text-sm sm:text-base">
              {visibleNavItems.map(({ label, href, className }) => (
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
      {menuOpen && (
        <nav className="fixed top-[72px] left-0 right-0 z-40 sm:hidden bg-slate-100 border-b border-gray-300 shadow-md">
          <ul className="flex flex-col">
            {visibleNavItems.map(({ label, href, className }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block py-2 px-2 rounded hover:bg-slate-200 ${
                    className || ""
                  }`}
                  onClick={() => {
                    setActiveNavItem(href);
                    setMenuOpen(false);
                  }}
                >
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
