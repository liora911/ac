import { useState, useEffect } from "react";

type Locale = "en" | "he";

import enTranslations from "../locales/en.json";
import heTranslations from "../locales/he.json";

const translations = {
  en: enTranslations,
  he: heTranslations,
};

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";

  const savedLocale = localStorage.getItem("locale") as Locale;
  return savedLocale && ["en", "he"].includes(savedLocale) ? savedLocale : "en";
};

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLocale = getInitialLocale();
    if (savedLocale !== locale) {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("locale", locale);
  }, [locale, isMounted]);

  const translate = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return {
    t: translate,
    locale,
    setLocale: handleSetLocale,
    isMounted,
  };
}
