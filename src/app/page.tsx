import prisma from "@/lib/prisma/prisma";
import Home from "@/components/Home/home";
import type { HomeContent } from "@/types/Home/home-content";
import type { SiteSettings } from "@/types/SiteSettings/settings";

const DEFAULT_HOME_CONTENT: HomeContent = {
  id: "home",
  heroHtml: null,
  heroHtmlLeft: null,
  heroHtmlRight: null,
  imageUrl: null,
  photoCredit: null,
  bioHtml: "",
  updatedAt: null,
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: "settings",
  siteTitle: "Avshalom Elitzur",
  siteDescription: "",
  contactEmail: "",
  contactPhone: "",
  facebookUrl: "",
  youtubeUrl: "",
  defaultLanguage: "he",
};

async function getHomeData() {
  if (!prisma) {
    return { homeContent: DEFAULT_HOME_CONTENT, siteSettings: DEFAULT_SITE_SETTINGS };
  }

  const [homeContent, siteSettings] = await Promise.all([
    prisma.homeContent.findUnique({ where: { id: "home" } }),
    prisma.siteSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return {
    homeContent: homeContent
      ? {
          id: homeContent.id,
          heroHtml: homeContent.heroHtml,
          heroHtmlLeft: homeContent.heroHtmlLeft,
          heroHtmlRight: homeContent.heroHtmlRight,
          imageUrl: homeContent.imageUrl,
          photoCredit: homeContent.photoCredit,
          bioHtml: homeContent.bioHtml || "",
          updatedAt: homeContent.updatedAt?.toISOString() ?? null,
        }
      : DEFAULT_HOME_CONTENT,
    siteSettings: siteSettings
      ? {
          id: siteSettings.id,
          siteTitle: siteSettings.siteTitle,
          siteDescription: siteSettings.siteDescription,
          contactEmail: siteSettings.contactEmail,
          contactPhone: siteSettings.contactPhone,
          facebookUrl: siteSettings.facebookUrl,
          youtubeUrl: siteSettings.youtubeUrl,
          defaultLanguage: siteSettings.defaultLanguage as "he" | "en",
          updatedAt: siteSettings.updatedAt?.toISOString(),
        }
      : DEFAULT_SITE_SETTINGS,
  };
}

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Page() {
  const { homeContent, siteSettings } = await getHomeData();

  return <Home homeContent={homeContent} siteSettings={siteSettings} />;
}
