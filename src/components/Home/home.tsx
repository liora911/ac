import HeroSection from "./HeroSection";
import ContentSection from "./ContentSection";
import WidgetSlot from "@/components/Widgets/WidgetSlot";
import type { HomeContent } from "@/types/Home/home-content";
import type { SiteSettings } from "@/types/SiteSettings/settings";

interface HomeProps {
  homeContent: HomeContent | null;
  siteSettings: SiteSettings | null;
}

const Home: React.FC<HomeProps> = ({ homeContent, siteSettings }) => {
  return (
    <main className="flex flex-col min-h-screen text-[var(--foreground)]">
      <HeroSection homeContent={homeContent} siteSettings={siteSettings} />
      <WidgetSlot id="homeUnderHero" className="max-w-6xl mx-auto px-6 my-8" />
      <ContentSection />
      <WidgetSlot id="homeAboveFooter" className="max-w-6xl mx-auto px-6 my-10" />
    </main>
  );
};

export default Home;
