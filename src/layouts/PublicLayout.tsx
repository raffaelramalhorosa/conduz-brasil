import { ReactNode } from "react";
import LandingNavBar from "@/components/landing/LandingNavBar";
import LandingFooter from "@/components/landing/LandingFooter";

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavBar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
};

export default PublicLayout;
