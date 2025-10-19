"use client";

import { navItems } from "@/constants/Nav/data";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LocaleSelect from "../LocaleSelect/locale-select";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Clock from "../Clock/Clock";
import {
  MdArticle,
  MdOutlineOndemandVideo,
  MdMic,
  MdContactMail,
  MdEvent,
  MdOnlinePrediction,
  MdMenu,
  MdClose,
  MdPerson,
} from "react-icons/md";

const IconMap: { [key: string]: React.ElementType } = {
  ArticleIcon: MdArticle,
  PresentationIcon: MdOutlineOndemandVideo,
  LectureIcon: MdMic,
  ContactIcon: MdContactMail,
  EventIcon: MdEvent,
  OnlineEventIcon: MdOnlinePrediction,
  PersonIcon: MdPerson,
};

export default function Header() {
  const { data: session, status } = useSession();
  const { t, locale, setLocale } = useTranslation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  const visibleNavItems = [
    ...navItems,
    ...(session
      ? [
          {
            label: "משתמש מחובר",
            href: "/elitzur",
            className: "text-red-600 font-semibold",
            icon: "PersonIcon",
          },
        ]
      : []),
  ];
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white shadow-md px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #007bff 0%, #6610f2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            A.Elitzur
          </Link>
          <div className="flex items-center space-x-4">
            {session && <Clock />}
            <button
              className="sm:hidden text-gray-700 focus:outline-none cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
            </button>
            <nav className="hidden sm:flex items-center space-x-6 text-base font-medium">
              {visibleNavItems.map(({ label, href, className }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-gray-700 hover:text-blue-600 transition-colors duration-200 ${
                    className || ""
                  }`}
                  style={{
                    textDecoration: pathname === href ? "underline" : "none",
                    textDecorationColor:
                      pathname === href ? "#007bff" : undefined,
                    textUnderlineOffset: pathname === href ? "4px" : undefined,
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
        <nav className="fixed top-[64px] left-0 right-0 z-40 sm:hidden bg-white shadow-lg">
          <ul className="flex flex-col p-4 space-y-2">
            {visibleNavItems.map(({ label, href, className, icon }) => {
              const IconComponent = icon ? IconMap[icon] : null;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 py-2 px-3 rounded-md text-gray-800 hover:bg-blue-100 transition-colors duration-200 ${
                      className || ""
                    }`}
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                  >
                    {IconComponent && <IconComponent size={20} />}
                    {t(label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
