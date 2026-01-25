"use client";

import { MotionConfig } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import type { MotionProviderProps } from "@/types/Components/components";

export default function MotionProvider({ children }: MotionProviderProps) {
  const { reduceMotion } = useSettings();

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
