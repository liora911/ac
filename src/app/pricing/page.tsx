"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function PricingContent() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<"monthly" | "yearly" | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const cancelled = searchParams.get("cancelled");

  const handleSubscribe = async (interval: "monthly" | "yearly") => {
    if (!session) {
      // Redirect to login first
      router.push("/auth/login?callbackUrl=/pricing");
      return;
    }

    setIsLoading(interval);

    try {
      const priceId =
        interval === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_RESEARCHER_MONTHLY_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_RESEARCHER_YEARLY_PRICE_ID;

      const response = await fetch("/api/stripe/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "שגיאה ביצירת המנוי");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("שגיאה ביצירת המנוי");
    } finally {
      setIsLoading(null);
    }
  };

  if (status === "loading") {
    return <PricingSkeleton />;
  }

  // If user already has subscription, show different UI
  if (session?.user.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
            <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              יש לך מנוי חוקר פעיל!
            </h1>
            <p className="text-gray-600 mb-6">
              אתה כבר נהנה מגישה לכל התכנים הפרימיום באתר.
            </p>
            <a
              href="/account"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              נהל את המנוי שלך
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            מנוי חוקר
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            קבל גישה לכל התכנים הפרימיום - מאמרים, הרצאות ומצגות בלעדיות
          </p>
        </div>

        {/* Cancelled notice */}
        {cancelled && (
          <div className="mb-8 max-w-lg mx-auto rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
            התשלום בוטל. אתה יכול לנסות שוב בכל עת.
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Monthly */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">חודשי</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">₪49</span>
              <span className="text-gray-500"> / חודש</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                גישה לכל המאמרים הפרימיום
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                גישה להרצאות בלעדיות
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                מצגות וחומרים נוספים
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                ביטול בכל עת
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={isLoading !== null}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isLoading === "monthly" ? "מעבד..." : "התחל מנוי חודשי"}
            </button>
          </div>

          {/* Yearly */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-sm relative">
            <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              חיסכון של 17%
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">שנתי</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">₪490</span>
              <span className="text-gray-500"> / שנה</span>
              <div className="text-sm text-emerald-600 mt-1">
                ₪40.83 לחודש
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                גישה לכל המאמרים הפרימיום
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                גישה להרצאות בלעדיות
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                מצגות וחומרים נוספים
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-emerald-500" />
                ביטול בכל עת
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe("yearly")}
              disabled={isLoading !== null}
              className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isLoading === "yearly" ? "מעבד..." : "התחל מנוי שנתי"}
            </button>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← חזור לדף הבית
          </a>
        </div>
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="text-center space-y-4">
            <div className="h-10 w-48 bg-gray-200 rounded mx-auto" />
            <div className="h-6 w-96 bg-gray-100 rounded mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="h-80 bg-white rounded-2xl border border-gray-200" />
            <div className="h-80 bg-white rounded-2xl border border-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}
