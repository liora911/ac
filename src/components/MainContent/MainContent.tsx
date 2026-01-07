"use client";

import { usePathname } from "next/navigation";

interface MainContentProps {
  children: React.ReactNode;
}

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
