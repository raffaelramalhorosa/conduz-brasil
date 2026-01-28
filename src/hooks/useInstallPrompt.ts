import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface InstallPromptState {
  isInstallable: boolean;
  isInstalling: boolean;
  isInstalled: boolean;
  installError: string | null;
  deferredPrompt: BeforeInstallPromptEvent | null;
  promptInstall: () => Promise<boolean>;
  resetError: () => void;
}

const STORAGE_KEYS = {
  INSTALLED: 'pwa-installed',
  INSTALL_DATE: 'pwa-install-date',
  DECLINED: 'pwa-install-declined',
};

export const useInstallPrompt = (): InstallPromptState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  // Check if already installed
  useEffect(() => {
    const checkIfInstalled = () => {
      const isStandaloneDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isAndroidTWA = document.referrer.includes('android-app://');
      const wasInstalled = localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true';
      
      const installed = isStandaloneDisplayMode || isIOSStandalone || isAndroidTWA || wasInstalled;
      
      if (installed) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      return installed;
    };

    checkIfInstalled();
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    if (isInstalled) return;

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('📥 PWA install prompt captured');
    };

    const handleAppInstalled = () => {
      console.log('🎉 PWA installed successfully!');
      setIsInstalled(true);
      setIsInstallable(false);
      setIsInstalling(false);
      setDeferredPrompt(null);
      
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      localStorage.setItem(STORAGE_KEYS.INSTALL_DATE, new Date().toISOString());
      localStorage.removeItem('app-install-dismissed');
      localStorage.removeItem('app-install-remind-later');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      setInstallError('Prompt de instalação não disponível');
      console.error('❌ No deferred prompt available');
      return false;
    }

    if (isInstalling || isInstalled) {
      return false;
    }

    try {
      setIsInstalling(true);
      setInstallError(null);

      console.log('🚀 Triggering PWA install prompt...');
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log('👤 User choice:', outcome);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
        localStorage.setItem(STORAGE_KEYS.INSTALL_DATE, new Date().toISOString());
        setDeferredPrompt(null);
        return true;
      } else {
        setIsInstalling(false);
        localStorage.setItem(STORAGE_KEYS.DECLINED, new Date().toISOString());
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setInstallError(errorMsg);
      setIsInstalling(false);
      console.error('❌ PWA install error:', error);
      return false;
    }
  }, [deferredPrompt, isInstalling, isInstalled]);

  const resetError = useCallback(() => {
    setInstallError(null);
  }, []);

  return {
    isInstallable,
    isInstalling,
    isInstalled,
    installError,
    deferredPrompt,
    promptInstall,
    resetError,
  };
};
