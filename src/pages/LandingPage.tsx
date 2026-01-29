import LandingNavBar from "@/components/landing/LandingNavBar";
import LandingHeroSection from "@/components/landing/LandingHeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import LandingCTASection from "@/components/landing/LandingCTASection";
import TrustBadgesSection from "@/components/landing/TrustBadgesSection";
import LandingFooter from "@/components/landing/LandingFooter";
import { PageTransition } from "@/components/PageTransition";
import { InstallBanner } from "@/components/install-prompt";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavBar />
      <PageTransition>
        <main>
          <LandingHeroSection />
          <StatsSection />
          <FeaturesSection />
          <HowItWorksSection />
          <BenefitsSection />
          <TestimonialsSection />
          <PricingSection />
          <FAQSection />
          <LandingCTASection />
          <TrustBadgesSection />
        </main>
      </PageTransition>
      <LandingFooter />
      <InstallBanner />
    </div>
  );
};

export default LandingPage;
