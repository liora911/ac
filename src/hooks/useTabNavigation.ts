import { useState, useCallback } from "react";

type TabNumber = 1 | 2 | 3;

interface UseTabNavigationReturn {
  /** Currently active tab */
  activeTab: TabNumber;
  /** Set of confirmed/completed tabs */
  confirmedTabs: Set<TabNumber>;
  /** Mark a tab as confirmed and optionally advance to next */
  confirmTab: (tab: TabNumber) => void;
  /** Check if a tab can be accessed (previous tab confirmed or tab itself confirmed) */
  canAccessTab: (tab: TabNumber) => boolean;
  /** Handle tab click - only switches if tab is accessible */
  handleTabClick: (tab: TabNumber) => void;
  /** Directly set the active tab (for programmatic navigation) */
  setActiveTab: (tab: TabNumber) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Check if all tabs are confirmed */
  isComplete: boolean;
}

/**
 * Hook for managing multi-step form tab navigation.
 * Supports a 3-tab wizard pattern with confirmation/validation gates.
 *
 * @param initialTab - Starting tab (default: 1)
 * @param autoAdvance - Whether to auto-advance to next tab on confirm (default: true)
 * @returns Tab navigation state and handlers
 *
 * @example
 * const {
 *   activeTab,
 *   confirmedTabs,
 *   confirmTab,
 *   canAccessTab,
 *   handleTabClick,
 * } = useTabNavigation();
 *
 * // Render tab buttons
 * <button
 *   onClick={() => handleTabClick(1)}
 *   className={activeTab === 1 ? "active" : ""}
 *   disabled={!canAccessTab(1)}
 * >
 *   Tab 1
 * </button>
 *
 * // Confirm current tab and move to next
 * <button onClick={() => confirmTab(activeTab)}>
 *   Continue
 * </button>
 */
export function useTabNavigation(
  initialTab: TabNumber = 1,
  autoAdvance = true
): UseTabNavigationReturn {
  const [activeTab, setActiveTab] = useState<TabNumber>(initialTab);
  const [confirmedTabs, setConfirmedTabs] = useState<Set<TabNumber>>(new Set());

  const confirmTab = useCallback(
    (tab: TabNumber) => {
      setConfirmedTabs((prev) => new Set([...prev, tab]));
      if (autoAdvance && tab < 3) {
        setActiveTab((tab + 1) as TabNumber);
      }
    },
    [autoAdvance]
  );

  const canAccessTab = useCallback(
    (tab: TabNumber): boolean => {
      if (tab === 1) return true;
      // Can access if previous tab is confirmed OR this tab itself is confirmed
      return (
        confirmedTabs.has((tab - 1) as TabNumber) || confirmedTabs.has(tab)
      );
    },
    [confirmedTabs]
  );

  const handleTabClick = useCallback(
    (tab: TabNumber) => {
      if (canAccessTab(tab)) {
        setActiveTab(tab);
      }
    },
    [canAccessTab]
  );

  const reset = useCallback(() => {
    setActiveTab(initialTab);
    setConfirmedTabs(new Set());
  }, [initialTab]);

  const isComplete = confirmedTabs.size === 3;

  return {
    activeTab,
    confirmedTabs,
    confirmTab,
    canAccessTab,
    handleTabClick,
    setActiveTab,
    reset,
    isComplete,
  };
}

export default useTabNavigation;
