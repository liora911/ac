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
      // Clears the fixed public navbar by its measured height (set by the
      // Header; it varies by width) so the breadcrumbs never slide under it
      className={`flex-grow flex flex-col ${
        isAuthPage || isAdminPage ? "" : "pt-[var(--navbar-height)]"
      }`}
      role="main"
    >
      {children}
    </main>
  );
}
