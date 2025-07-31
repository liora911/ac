"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../../locales/en.json";
import he from "../../locales/he.json";

type Locale = "en" | "he";
type TranslationContextType = {
  t: (key: string) => string | string[];
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

const translations = { en, he };

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("locale");
  return saved === "he" ? "he" : "en";
};

export const TranslationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  const t = (key: string): string | string[] => {
    const keys = key.split(".");
    let value: any = translations[locale];
    for (const k of keys) {
      if (value?.[k] !== undefined) {
        value = value[k];
      } else {
        return key;
      }
    }
    return Array.isArray(value)
      ? value
      : typeof value === "string"
      ? value
      : key;
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
