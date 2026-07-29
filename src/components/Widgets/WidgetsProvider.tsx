"use client";

import { createContext, useContext } from "react";
import type { WidgetState } from "@/types/Widgets/widgets";

// Enabled-widget snapshot, seeded from the server in the root layout so slots
// render with data already present (server HTML, no client flash).
const EnabledWidgetsContext = createContext<WidgetState[]>([]);

export function WidgetsProvider({
  value,
  children,
}: {
  value: WidgetState[];
  children: React.ReactNode;
}) {
  return (
    <EnabledWidgetsContext.Provider value={value}>
      {children}
    </EnabledWidgetsContext.Provider>
  );
}

export function useEnabledWidgets() {
  return useContext(EnabledWidgetsContext);
}
