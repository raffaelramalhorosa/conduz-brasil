import React, { useState, useEffect } from "react";
import { X, Download, Smartphone, Loader2 } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import { IOSInstallModal } from "./IOSInstallModal";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEYS = {
  DISMISSED: "app-install-dismissed",
  REMIND_LATER: "app-install-remind-later",
  ALREADY_INSTALLED: "app-already-installed",
  SESSION_SHOWN: "app-install-session-shown",
};

const REMIND_DAYS = 7;

export const InstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { isInstallable, isInstalling, isInstalled, installError, promptInstall } = useInstallPrompt();
  const { isIOS, isAndroid, isStandalone, isDesktop, isSafari, platform } = usePlatformDetection();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled || isStandalone) return;

    // Don't show if already shown this session
    if (sessionStorage.getItem(STORAGE_KEYS.SESSION_SHOWN)) return;

    // Check localStorage for dismissed/remind later
    const dismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED);
    const remindLater = localStorage.getItem(STORAGE_KEYS.REMIND_LATER);

    if (dismissed || remindLater) {
      const timestamp = parseInt(dismissed || remindLater || "0");
      const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

      if (daysSince < REMIND_DAYS) return;
    }

    // Only show on public pages
    const isPublicPage = ["/", "/instrutores", "/mapa-instrutores"].includes(location.pathname);

    if (!isPublicPage) return;

    // Show banner after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem(STORAGE_KEYS.SESSION_SHOWN, "true");
      console.log('📊 Install banner shown:', { platform, isIOS, isDesktop, isInstallable });
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstalled, isStandalone, location.pathname, platform, isIOS, isDesktop, isInstallable]);

  const handleInstallClick = async () => {
    console.log('🎯 Install button clicked:', { platform, isIOS, isDesktop, isInstallable, isSafari });

    // DECISION TREE:
    
    // 1️⃣ iOS + Safari = Show iOS modal with manual instructions
    if (isIOS) {
      console.log('📱 iOS flow: Opening iOS modal');
      setShowIOSModal(true);
      return;
    }

    // 2️⃣ Desktop/Android + PWA available = Trigger native PWA install
    if (isInstallable) {
      console.log('💻 PWA flow: Triggering native install prompt');
      const installed = await promptInstall();
      if (installed) {
        setIsVisible(false);
      }
      return;
    }

    // 3️⃣ Desktop + PWA NOT available = Open instructions page
    if (isDesktop) {
      console.log('💻 Desktop fallback: Opening install-electron page');
      navigate("/install-electron");
      return;
    }

    // 4️⃣ Android without PWA = Open instructions page
    if (isAndroid) {
      console.log('🤖 Android fallback: Opening install-electron page');
      navigate("/install-electron");
      return;
    }

    // 5️⃣ Generic fallback
    console.log('❓ Generic fallback: Opening install-electron page');
    navigate("/install-electron");
  };

  const handleRemindLater = () => {
    localStorage.setItem(STORAGE_KEYS.REMIND_LATER, Date.now().toString());
    setIsVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed bottom-5 right-5 w-[400px] max-w-[calc(100vw-40px)] bg-gradient-to-br from-accent to-primary rounded-2xl p-5 shadow-xl z-[9999] animate-fade-in"
        style={{
          animation: "slideInRight 0.5s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-white font-semibold text-lg mb-1">Instale o App Conduz Brasil!</h3>
            <p className="text-white/90 text-sm leading-relaxed">Acesso rápido e notificações em tempo real</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 items-center">
          <Button 
            onClick={handleInstallClick} 
            disabled={isInstalling}
            className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Instalando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Instalar Agora
              </>
            )}
          </Button>
          <button
            onClick={handleRemindLater}
            className="text-white px-4 py-3 text-base hover:opacity-100 opacity-90 transition-opacity"
          >
            Depois
          </button>
        </div>

        {/* Error message */}
        {installError && (
          <div className="mt-3 bg-red-500/20 text-white text-sm p-2 rounded-lg text-center">
            Não foi possível instalar. Tente novamente.
          </div>
        )}
      </div>

      {/* iOS Modal - ONLY for iOS devices */}
      {showIOSModal && isIOS && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
