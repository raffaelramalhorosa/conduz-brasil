import { useState, useEffect } from 'react';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export const usePlatformDetection = () => {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    
    // Detectar iOS
    const iosCheck = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(iosCheck);
    
    // Detectar Safari
    const safariCheck = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS/i.test(ua);
    setIsSafari(safariCheck);
    
    // Detectar standalone (já instalado)
    const nav = window.navigator as NavigatorStandalone;
    const standaloneCheck = nav.standalone === true || 
                            window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standaloneCheck);
    
    // Determinar plataforma
    if (iosCheck) {
      setPlatform('ios');
    } else if (/Android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  return {
    platform,
    isIOS,
    isSafari,
    isStandalone,
    isDesktop: platform === 'desktop',
    isAndroid: platform === 'android'
  };
};
