import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";

// Vercel Analytics API endpoint
const VERCEL_API_BASE = "https://api.vercel.com";

interface VercelAnalyticsResponse {
  data?: {
    pageViews?: number;
    visitors?: number;
    uniqueVisitors?: number;
  };
  series?: Array<{
    key: string;
    total: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "7d";

    // Get Vercel tokens from environment
    const vercelToken = process.env.VERCEL_ANALYTICS_TOKEN;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    // If no token, return demo data with a flag
    if (!vercelToken) {
      return NextResponse.json(
        { error: "Vercel Analytics token not configured" },
        { status: 503 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let fromDate: Date;
    switch (period) {
      case "24h":
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "7d":
      default:
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const fromStr = fromDate.toISOString();
    const toStr = now.toISOString();

    // Build API URL
    const headers = {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    };

    // Fetch page views
    const pageViewsUrl = new URL(`${VERCEL_API_BASE}/v1/analytics/page-views`);
    if (vercelProjectId) pageViewsUrl.searchParams.set("projectId", vercelProjectId);
    if (vercelTeamId) pageViewsUrl.searchParams.set("teamId", vercelTeamId);
    pageViewsUrl.searchParams.set("from", fromStr);
    pageViewsUrl.searchParams.set("to", toStr);

    // Fetch visitors
    const visitorsUrl = new URL(`${VERCEL_API_BASE}/v1/analytics/visitors`);
    if (vercelProjectId) visitorsUrl.searchParams.set("projectId", vercelProjectId);
    if (vercelTeamId) visitorsUrl.searchParams.set("teamId", vercelTeamId);
    visitorsUrl.searchParams.set("from", fromStr);
    visitorsUrl.searchParams.set("to", toStr);

    // Fetch Web Vitals
    const webVitalsUrl = new URL(`${VERCEL_API_BASE}/v1/web-vitals`);
    if (vercelProjectId) webVitalsUrl.searchParams.set("projectId", vercelProjectId);
    if (vercelTeamId) webVitalsUrl.searchParams.set("teamId", vercelTeamId);
    webVitalsUrl.searchParams.set("from", fromStr);
    webVitalsUrl.searchParams.set("to", toStr);

    // Fetch top pages
    const topPagesUrl = new URL(`${VERCEL_API_BASE}/v1/analytics/top-paths`);
    if (vercelProjectId) topPagesUrl.searchParams.set("projectId", vercelProjectId);
    if (vercelTeamId) topPagesUrl.searchParams.set("teamId", vercelTeamId);
    topPagesUrl.searchParams.set("from", fromStr);
    topPagesUrl.searchParams.set("to", toStr);
    topPagesUrl.searchParams.set("limit", "10");

    // Make parallel requests
    const [pageViewsRes, visitorsRes, webVitalsRes, topPagesRes] = await Promise.allSettled([
      fetch(pageViewsUrl.toString(), { headers }),
      fetch(visitorsUrl.toString(), { headers }),
      fetch(webVitalsUrl.toString(), { headers }),
      fetch(topPagesUrl.toString(), { headers }),
    ]);

    // Process responses with fallbacks
    let pageViewsData = { total: 0, change: 0 };
    let visitorsData = { total: 0, unique: 0, change: 0 };
    let webVitalsData: Array<{ name: string; value: number; rating: string; description: string }> = [];
    let topPagesData: Array<{ path: string; views: number; percentage: number }> = [];
    let deviceBreakdown = { desktop: 60, mobile: 35, tablet: 5 };

    if (pageViewsRes.status === "fulfilled" && pageViewsRes.value.ok) {
      const data = await pageViewsRes.value.json();
      pageViewsData = {
        total: data.total || data.pageViews || 0,
        change: data.change || 0,
      };
    }

    if (visitorsRes.status === "fulfilled" && visitorsRes.value.ok) {
      const data = await visitorsRes.value.json();
      visitorsData = {
        total: data.total || data.visitors || 0,
        unique: data.unique || data.uniqueVisitors || 0,
        change: data.change || 0,
      };
    }

    if (webVitalsRes.status === "fulfilled" && webVitalsRes.value.ok) {
      const data = await webVitalsRes.value.json();
      const vitals = data.vitals || data.data || [];

      const vitalDescriptions: Record<string, string> = {
        LCP: "How fast the main content loads",
        FID: "How responsive to user input",
        CLS: "Visual stability of the page",
        TTFB: "Server response time",
        INP: "Overall responsiveness",
      };

      webVitalsData = vitals.map((v: { name: string; value: number; rating?: string }) => ({
        name: v.name,
        value: Math.round(v.value * 100) / 100,
        rating: v.rating || getRating(v.name, v.value),
        description: vitalDescriptions[v.name] || "",
      }));
    }

    // Fallback Web Vitals if empty
    if (webVitalsData.length === 0) {
      webVitalsData = [
        { name: "LCP", value: 0, rating: "good", description: "How fast the main content loads" },
        { name: "FID", value: 0, rating: "good", description: "How responsive to user input" },
        { name: "CLS", value: 0, rating: "good", description: "Visual stability of the page" },
        { name: "TTFB", value: 0, rating: "good", description: "Server response time" },
        { name: "INP", value: 0, rating: "good", description: "Overall responsiveness" },
      ];
    }

    if (topPagesRes.status === "fulfilled" && topPagesRes.value.ok) {
      const data = await topPagesRes.value.json();
      const pages = data.data || data.paths || [];
      const maxViews = pages[0]?.views || pages[0]?.count || 1;

      topPagesData = pages.slice(0, 5).map((p: { path?: string; url?: string; views?: number; count?: number }) => ({
        path: p.path || p.url || "/",
        views: p.views || p.count || 0,
        percentage: Math.round(((p.views || p.count || 0) / maxViews) * 100),
      }));
    }

    // Fallback top pages if empty
    if (topPagesData.length === 0) {
      topPagesData = [
        { path: "/", views: 0, percentage: 100 },
        { path: "/articles", views: 0, percentage: 0 },
        { path: "/lectures", views: 0, percentage: 0 },
      ];
    }

    return NextResponse.json({
      pageViews: pageViewsData,
      visitors: visitorsData,
      webVitals: webVitalsData,
      topPages: topPagesData,
      deviceBreakdown,
      period,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

function getRating(name: string, value: number): string {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const t = thresholds[name];
  if (!t) return "good";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}
