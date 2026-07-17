"use client";

import { usePathname } from "next/navigation";
import type { MainContentProps } from "@/types/Components/components";

export default function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  // The admin dashboard has no public navbar, so no clearance needed there
  const isAdminPage = pathname?.startsWith("/elitzur");

  return (
    <main
      id="main-content"
      // pt-[60px] clears the fixed public navbar — without it the first
      // 60px of every page (e.g. the breadcrumbs) hide behind the navbar
      className={`flex-grow flex flex-col ${
        isAuthPage || isAdminPage ? "" : "pt-[60px]"
      }`}
      role="main"
    >
      {children}
    </main>
  );
}
