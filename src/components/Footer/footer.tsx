"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, FolderOpen, FileText, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useSubscribeNewsletter } from "@/hooks/useNewsletter";
import type {
  ArticlePreview,
  CategoryWithArticles,
  FooterSitemapData,
} from "@/types/Sitemap/footer-sitemap";
import { SITEMAP_CACHE_KEY, SITEMAP_CACHE_DURATION } from "@/constants/cache";

function BlackHoleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="accretionDisk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="30%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#fff4e0" />
          <stop offset="70%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ff6b35" />
        </linearGradient>
        <radialGradient id="eventHorizon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="70%" stopColor="#000000" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="#ff6b3522" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#glow)" />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="5"
        fill="none"
        stroke="url(#accretionDisk)"
        strokeWidth="2"
        opacity="0.6"
      />
      <circle cx="16" cy="16" r="6" fill="url(#eventHorizon)" />
      <circle
        cx="16"
        cy="16"
        r="7"
        fill="none"
        stroke="#ffd700"
        strokeWidth="0.5"
        opacity="0.8"
      />
      <path
        d="M 2 16 Q 16 21 30 16"
        fill="none"
        stroke="url(#accretionDisk)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoryItem({ category }: { category: CategoryWithArticles }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="text-start">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full cursor-pointer"
      >
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{category.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({category.articles.length})
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ms-auto flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 ms-auto flex-shrink-0" />
        )}
      </button>

      {isExpanded && category.articles.length > 0 && (
        <ul className="mt-2 ms-6 space-y-1.5">
          {category.articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/articles/${article.slug}`}
                className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{article.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CachedSitemapData {
  data: FooterSitemapData;
  timestamp: number;
}

function getCachedSitemapData(): FooterSitemapData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(SITEMAP_CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp }: CachedSitemapData = JSON.parse(cached);
    if (Date.now() - timestamp < SITEMAP_CACHE_DURATION) {
      return data;
    }
    // Cache expired, remove it
    localStorage.removeItem(SITEMAP_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedSitemapData(data: FooterSitemapData): void {
  if (typeof window === "undefined") return;
  try {
    const cacheEntry: CachedSitemapData = { data, timestamp: Date.now() };
    localStorage.setItem(SITEMAP_CACHE_KEY, JSON.stringify(cacheEntry));
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

function NewsletterSignup() {
  const { t } = useTranslation();
  const subscribe = useSubscribeNewsletter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate(email.trim(), {
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {t("newsletter.footerTitle")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {t("newsletter.footerDescription")}
        </p>

        {subscribe.isSuccess ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            {t("newsletter.success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")}
              required
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {subscribe.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("newsletter.subscribe")
              )}
            </button>
          </form>
        )}

        {subscribe.isError && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            {t("newsletter.error")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Footer() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const isHebrew = locale === "he";
  const [sitemapData, setSitemapData] = useState<FooterSitemapData | null>(
    null,
  );
  const [isSitemapExpanded, setIsSitemapExpanded] = useState(false);

  useEffect(() => {
    // Try to get cached data first
    const cached = getCachedSitemapData();
    if (cached) {
      setSitemapData(cached);
      return; // Don't fetch if cache is valid
    }

    const fetchSitemapData = async () => {
      try {
        const res = await fetch("/api/footer-sitemap");
        if (res.ok) {
          const data = await res.json();
          setSitemapData(data);
          setCachedSitemapData(data); // Cache the response
        }
      } catch (error) {
        console.error("Failed to fetch footer sitemap:", error);
      }
    };
    fetchSitemapData();
  }, []);

  // Hide footer on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <footer
      className="w-full border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 px-4 py-8"
      dir={isHebrew ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto">
        {/* Newsletter Section */}
        <NewsletterSignup />

        {/* Bottom section */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>{t("footer.contact")}</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <BlackHoleIcon className="w-4 h-4" />
            <span>
              {t("footer.developedBy")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
