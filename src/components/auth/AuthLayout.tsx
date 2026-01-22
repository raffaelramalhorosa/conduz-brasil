import { ReactNode } from 'react';
import { AuthHeroSection } from './AuthHeroSection';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md px-6 py-8 lg:px-8">
          {children}
        </div>
      </div>
      
      {/* Right Side - Hero */}
      <AuthHeroSection />
    </div>
  );
}
