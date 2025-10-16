import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/header";
import Footer from "@/components/Footer/footer";
import { TranslationProvider } from "@/contexts/Translation/translation.context";
import AuthSessionProvider from "@/components/Auth/authSessionProvider";
import QueryProvider from "@/lib/react-query/QueryProvider";

const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avshalom Elitzur", // This will be handled by the TranslationProvider
  description:
    "Physicist & Philosopher | TSVF, Quantum Paradoxes, and Foundations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <AuthSessionProvider>
            <TranslationProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow flex flex-col pt-19">
                  {children}
                </main>
                <Footer />
              </div>
            </TranslationProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
