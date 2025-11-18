"use client";

import { navItems } from "@/constants/Nav/data";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LocaleSelect from "../LocaleSelect/locale-select";
import { useSession } from "next-auth/react";
import { useState } from "react";
import GlobalSearch from "../GlobalSearch";
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
  MdSearch,
} from "react-icons/md";

const IconMap: { [key: string]: React.ElementType } = {
  ArticleIcon: MdArticle,
  PresentationIcon: MdOutlineOndemandVideo,
  LectureIcon: MdMic,
  ContactIcon: MdContactMail,
  EventIcon: MdEvent,
  OnlineEventIcon: MdOnlinePrediction,
  PersonIcon: MdPerson,
  MdSearch: MdSearch,
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
            label: "header.adminSettings",
            href: "/elitzur",
            className: "text-red-600 font-semibold",
            icon: "PersonIcon",
          },
        ]
      : []),
  ];

  const mobileNavItems = [
    ...visibleNavItems,
    {
      label: "globalSearch.menuItem",
      href: "#",
      icon: "MdSearch",
      onClick: () => {
        const searchInput = document.querySelector(
          'input[aria-label="Global search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          setMenuOpen(false);
        }
      },
    },
  ];
  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 backdrop-blur-sm shadow-lg px-4 py-3 sm:py-4"
        role="banner"
      >
        <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex-shrink min-w-0 max-w-[80%] text-lg sm:text-2xl font-extrabold tracking-tight cursor-pointer hover:scale-105 transition-transform duration-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 whitespace-normal leading-tight"
            style={{
              background: "linear-gradient(135deg, #007bff 0%, #6610f2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            aria-label={t("header.brandAriaLabel")}
          >
            Avshalom C. Elitzur
          </Link>
          <nav
            className="hidden sm:flex items-center space-x-6 text-base font-medium"
            role="navigation"
            aria-label={t("header.mainNavigation")}
          >
            {visibleNavItems.map(({ label, href, className, icon }) => {
              const IconComponent = icon ? IconMap[icon] : null;
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:scale-105 transition-all duration-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${
                    className || ""
                  }`}
                  style={{
                    textDecoration: pathname === href ? "underline" : "none",
                    textDecorationColor:
                      pathname === href ? "#007bff" : undefined,
                    textUnderlineOffset: pathname === href ? "4px" : undefined,
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {IconComponent && (
                    <IconComponent size={20} aria-hidden="true" />
                  )}
                  {t(label)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block">
                <GlobalSearch />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="sm:hidden text-gray-700 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label={
                  menuOpen
                    ? t("header.closeNavigationMenu")
                    : t("header.openNavigationMenu")
                }
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
              >
                <div className="relative">
                  <MdMenu
                    size={24}
                    className={`transition-all duration-300 ${
                      menuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                    }`}
                    aria-hidden="true"
                  />
                  <MdClose
                    size={24}
                    className={`absolute top-0 left-0 transition-all duration-300 ${
                      menuOpen
                        ? "opacity-100 rotate-0"
                        : "opacity-0 -rotate-180"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>
              <div className="relative shrink-0">
                <LocaleSelect value={locale} onChange={setLocale} />
              </div>
            </div>
          </div>
        </div>
      </header>
      {menuOpen && (
        <nav
          className="fixed top-[64px] left-0 right-0 z-40 sm:hidden bg-white shadow-lg border-t border-gray-200"
          role="navigation"
          aria-label="Mobile navigation"
          id="mobile-navigation"
        >
          <ul className="flex flex-col p-4 space-y-1" role="menubar">
            {mobileNavItems.map(({ label, href, className, icon, onClick }) => {
              const IconComponent = icon ? IconMap[icon] : null;
              const isActive = pathname === href;
              return (
                <li key={href} role="none">
                  {onClick ? (
                    <button
                      onClick={() => {
                        onClick();
                      }}
                      className={`flex items-center gap-3 py-3 px-4 rounded-lg text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md transition-all duration-300 transform hover:translate-x-1 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 w-full text-left ${
                        className || ""
                      }`}
                      role="menuitem"
                    >
                      {IconComponent && (
                        <IconComponent
                          size={22}
                          className="text-gray-600"
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-medium">{t(label)}</span>
                    </button>
                  ) : (
                    <Link
                      href={href}
                      className={`flex items-center gap-3 py-3 px-4 rounded-lg text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md transition-all duration-300 transform hover:translate-x-1 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${
                        className || ""
                      } ${
                        isActive
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 shadow-md"
                          : ""
                      }`}
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                      role="menuitem"
                      aria-current={isActive ? "page" : undefined}
                    >
                      {IconComponent && (
                        <IconComponent
                          size={22}
                          className={
                            isActive ? "text-blue-600" : "text-gray-600"
                          }
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`font-medium ${
                          isActive ? "text-blue-700" : ""
                        }`}
                      >
                        {t(label)}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
