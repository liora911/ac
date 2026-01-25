"use client";

import { usePathname } from "next/navigation";
import type { MainContentProps } from "@/types/Components/components";

export default function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <main
      id="main-content"
      className={`flex-grow flex flex-col ${isAuthPage ? "" : "pt-20"}`}
      role="main"
    >
      {children}
    </main>
  );
}
