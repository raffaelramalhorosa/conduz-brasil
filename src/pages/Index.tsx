import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import InstructorsSection from "@/components/InstructorsSection";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { InstallBanner } from "@/components/install-prompt";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <PageTransition>
        <main>
          <HeroSection />
          <HowItWorks />
          <Benefits />
          <InstructorsSection />
          <Testimonials />
          <CTASection />
        </main>
      </PageTransition>
      <Footer />
      <InstallBanner />
    </div>
  );
};

export default Index;
