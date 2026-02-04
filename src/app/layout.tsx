import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import Header from "@/components/Header/header";
import Footer from "@/components/Footer/footer";
import { TranslationProvider } from "@/contexts/Translation/translation.context";
import AuthSessionProvider from "@/components/Auth/authSessionProvider";
import QueryProvider from "@/lib/react-query/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CategoryPreferencesProvider } from "@/contexts/CategoryPreferencesContext";
import MotionProvider from "@/components/Motion/MotionProvider";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import MainContent from "@/components/MainContent/MainContent";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import StatCounter from "@/components/Analytics/StatCounter";

// Lazy load WelcomeModal - only ~5% of users (first-time visitors) need it
const WelcomeModal = dynamic(
  () => import("@/components/CategoryPreferences/WelcomeModal")
);

import { BASE_URL } from "@/constants/app";

const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Avshalom C. Elitzur | Physicist & Philosopher",
    template: "%s | Avshalom C. Elitzur",
  },
  description:
    "Prof. Avshalom C. Elitzur - Physicist and philosopher specializing in quantum mechanics, TSVF (Two-State Vector Formalism), quantum paradoxes, and the foundations of physics. Explore articles, lectures, and presentations.",
  keywords: [
    "Avshalom Elitzur",
    "quantum physics",
    "quantum mechanics",
    "TSVF",
    "Two-State Vector Formalism",
    "quantum paradoxes",
    "Elitzur-Vaidman bomb tester",
    "foundations of physics",
    "philosophy of science",
    "theoretical physics",
  ],
  authors: [{ name: "Avshalom C. Elitzur" }],
  creator: "Avshalom C. Elitzur",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "he_IL",
    url: BASE_URL,
    siteName: "Avshalom C. Elitzur",
    title: "Avshalom C. Elitzur | Physicist & Philosopher",
    description:
      "Prof. Avshalom C. Elitzur - Physicist and philosopher specializing in quantum mechanics, TSVF, quantum paradoxes, and the foundations of physics.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Avshalom C. Elitzur - Physicist & Philosopher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Avshalom C. Elitzur | Physicist & Philosopher",
    description:
      "Prof. Avshalom C. Elitzur - Physicist and philosopher specializing in quantum mechanics, TSVF, quantum paradoxes, and the foundations of physics.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have the verification codes
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.className} antialiased focus-visible:outline-2 focus-visible:outline-blue-500`}
        suppressHydrationWarning={true}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <AuthSessionProvider>
            <TranslationProvider>
              <NotificationProvider>
                <ThemeProvider>
                  <SettingsProvider>
                    <CategoryPreferencesProvider>
                      <MotionProvider>
                        <div className="flex flex-col min-h-screen">
                          <Header />
                          <MainContent>
                            <Breadcrumbs />
                            {children}
                          </MainContent>
                          <Footer />
                        </div>
                        <WelcomeModal />
                      </MotionProvider>
                    </CategoryPreferencesProvider>
                  </SettingsProvider>
                </ThemeProvider>
              </NotificationProvider>
            </TranslationProvider>
          </AuthSessionProvider>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
        <StatCounter />
      </body>
    </html>
  );
}
