"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface CategoryPreferences {
  selectedCategoryIds: string[];
  hasSeenWelcome: boolean;
}

interface CategoryPreferencesContextType {
  selectedCategoryIds: string[];
  hasSeenWelcome: boolean;
  shouldShowWelcome: boolean;
  shouldFilterContent: boolean;
  setSelectedCategories: (ids: string[]) => void;
  markWelcomeSeen: () => void;
  resetPreferences: () => void;
  isCategorySelected: (categoryId: string) => boolean;
}

const STORAGE_KEY = "categoryPreferences";

const defaultPreferences: CategoryPreferences = {
  selectedCategoryIds: [],
  hasSeenWelcome: false,
};

const CategoryPreferencesContext = createContext<CategoryPreferencesContextType | undefined>(
  undefined
);

export function CategoryPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<CategoryPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CategoryPreferences;
        // Validate the structure
        if (
          Array.isArray(parsed.selectedCategoryIds) &&
          typeof parsed.hasSeenWelcome === "boolean"
        ) {
          setPreferences(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load category preferences:", error);
    }
    setMounted(true);
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save category preferences:", error);
    }
  }, [preferences, mounted]);

  const setSelectedCategories = useCallback((ids: string[]) => {
    setPreferences((prev) => ({
      ...prev,
      selectedCategoryIds: ids,
    }));
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      hasSeenWelcome: true,
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({
      selectedCategoryIds: [],
      hasSeenWelcome: true, // Keep welcome as seen after reset
    });
  }, []);

  const isCategorySelected = useCallback(
    (categoryId: string) => {
      // If no categories selected, all are considered "selected" (show all)
      if (preferences.selectedCategoryIds.length === 0) {
        return true;
      }
      return preferences.selectedCategoryIds.includes(categoryId);
    },
    [preferences.selectedCategoryIds]
  );

  // Only show welcome if mounted (hydrated) and hasn't seen it yet
  const shouldShowWelcome = mounted && !preferences.hasSeenWelcome;

  // Only filter content if user has selected specific categories
  const shouldFilterContent = preferences.selectedCategoryIds.length > 0;

  return (
    <CategoryPreferencesContext.Provider
      value={{
        selectedCategoryIds: preferences.selectedCategoryIds,
        hasSeenWelcome: preferences.hasSeenWelcome,
        shouldShowWelcome,
        shouldFilterContent,
        setSelectedCategories,
        markWelcomeSeen,
        resetPreferences,
        isCategorySelected,
      }}
    >
      {children}
    </CategoryPreferencesContext.Provider>
  );
}

export function useCategoryPreferences() {
  const context = useContext(CategoryPreferencesContext);
  if (context === undefined) {
    throw new Error("useCategoryPreferences must be used within a CategoryPreferencesProvider");
  }
  return context;
}
