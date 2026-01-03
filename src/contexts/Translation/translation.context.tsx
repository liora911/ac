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

export const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("locale");
  return saved === "he" ? "he" : "en";
};

export const TranslationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Always start with "en" for SSR, then sync with localStorage in useEffect
  const [locale, setLocale] = useState<Locale>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load locale from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "he") {
      setLocale("he");
    }
    setIsHydrated(true);
  }, []);

  // Sync locale to localStorage and document
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("locale", locale);
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale, isHydrated]);

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
