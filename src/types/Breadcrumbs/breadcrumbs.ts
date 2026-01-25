import type { ReactNode } from "react";

export type CrumbTemplate = {
  href?: string;
  labelKey?: string;
  rawSegment?: string;
  label?: ReactNode;
  isCurrent?: boolean;
};

export type StaticSegmentKeys = Record<string, string>;
