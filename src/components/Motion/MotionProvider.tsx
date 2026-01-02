"use client";

import { MotionConfig } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";

interface MotionProviderProps {
  children: React.ReactNode;
}

export default function MotionProvider({ children }: MotionProviderProps) {
  const { reduceMotion } = useSettings();

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
