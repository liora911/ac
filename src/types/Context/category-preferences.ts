export interface CategoryPreferences {
  selectedCategoryIds: string[];
  hasSeenWelcome: boolean;
}

export interface CategoryPreferencesContextType {
  selectedCategoryIds: string[];
  hasSeenWelcome: boolean;
  shouldShowWelcome: boolean;
  shouldFilterContent: boolean;
  setSelectedCategories: (ids: string[]) => void;
  markWelcomeSeen: () => void;
  resetPreferences: () => void;
  isCategorySelected: (categoryId: string) => boolean;
}
