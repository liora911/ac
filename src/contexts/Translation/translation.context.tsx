"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../../locales/en.json";
import he from "../../locales/he.json";

type Locale = "en" | "he";
type TranslationContextType = {
  t: (key: string) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

type TranslationNode = string | string[] | { [k: string]: TranslationNode };

const translations: Record<Locale, Record<string, TranslationNode>> = {
  en,
  he,
} as const;

function getCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)locale=(en|he)/);
  return match ? (match[1] as Locale) : null;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

function getInitialClientLocale(): Locale {
  if (typeof window === "undefined") return "he";
  // Cookie is the source of truth (also readable server-side)
  const cookieLocale = getCookieLocale();
  if (cookieLocale) return cookieLocale;
  // Fallback to localStorage for existing users
  const saved = localStorage.getItem("locale");
  return saved === "en" ? "en" : "he";
}

export const TranslationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Start with "he" (default language) — matches the blocking script in layout
  const [locale, setLocaleState] = useState<Locale>("he");

  // Sync from cookie/localStorage after hydration
  useEffect(() => {
    const initial = getInitialClientLocale();
    setLocaleState(initial);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist to both cookie (server-readable) and localStorage (backward compat)
    setLocaleCookie(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.dir = newLocale === "he" ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
  };

  // Sync document attributes when locale changes (including initial hydration)
  useEffect(() => {
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    // Ensure cookie is set
    setLocaleCookie(locale);
    localStorage.setItem("locale", locale);
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: TranslationNode | undefined = translations[locale];

    for (const k of keys) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        k in value
      ) {
        value = (value as Record<string, TranslationNode>)[k];
      } else {
        return key;
      }
    }

    if (Array.isArray(value)) return value.join(" ");
    if (typeof value === "string") return value;
    return key;
  };

  return (
    <TranslationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return ctx;
};
