"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  FontSize,
  DefaultView,
  SettingsContextType,
} from "@/types/SettingsContext/settings";

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const [defaultView, setDefaultViewState] = useState<DefaultView>("grid");
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize") as FontSize | null;
    const savedReduceMotion = localStorage.getItem("reduceMotion");
    const savedDefaultView = localStorage.getItem("defaultView") as DefaultView | null;

    if (savedFontSize === "small" || savedFontSize === "medium" || savedFontSize === "large") {
      setFontSizeState(savedFontSize);
    }

    if (savedReduceMotion === "true") {
      setReduceMotionState(true);
    }

    if (savedDefaultView === "grid" || savedDefaultView === "list") {
      setDefaultViewState(savedDefaultView);
    }

    setMounted(true);
  }, []);

  // Apply font size to document
  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize, mounted]);

  // Apply reduce motion preference
  useEffect(() => {
    if (!mounted) return;

    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
    localStorage.setItem("reduceMotion", String(reduceMotion));
  }, [reduceMotion, mounted]);

  // Save default view preference
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem("defaultView", defaultView);
  }, [defaultView, mounted]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  const setReduceMotion = (reduce: boolean) => {
    setReduceMotionState(reduce);
  };

  const setDefaultView = (view: DefaultView) => {
    setDefaultViewState(view);
  };

  return (
    <SettingsContext.Provider
      value={{
        fontSize,
        setFontSize,
        reduceMotion,
        setReduceMotion,
        defaultView,
        setDefaultView,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
