import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/header";
import Footer from "@/components/Footer/footer";
import { TranslationProvider } from "@/contexts/Translation/translation.context";
import AuthSessionProvider from "@/components/Auth/authSessionProvider";
import QueryProvider from "@/lib/react-query/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avshalom Elitzur",
  description:
    "Physicist & Philosopher | TSVF, Quantum Paradoxes, and Foundations",
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
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main
                      id="main-content"
                      className="flex-grow flex flex-col pt-16"
                      role="main"
                    >
                      {children}
                    </main>
                    <Footer />
                  </div>
                </ThemeProvider>
              </NotificationProvider>
            </TranslationProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
