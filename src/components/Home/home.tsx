import HeroSection from "./HeroSection";
import ContentSection from "./ContentSection";
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
      <ContentSection />
    </main>
  );
};

export default Home;
