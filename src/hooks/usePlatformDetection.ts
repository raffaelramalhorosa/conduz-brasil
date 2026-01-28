import { useState, useEffect } from 'react';

export type PlatformType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

interface PlatformInfo {
  platform: PlatformType;
  deviceType: DeviceType;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
  isStandalone: boolean;
}

export const usePlatformDetection = (): PlatformInfo => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: 'unknown',
    deviceType: 'desktop',
    isIOS: false,
    isAndroid: false,
    isWindows: false,
    isMacOS: false,
    isLinux: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSafari: false,
    isChrome: false,
    isEdge: false,
    isFirefox: false,
    isStandalone: false,
  });

  useEffect(() => {
    const detectPlatform = (): PlatformInfo => {
      const ua = navigator.userAgent;
      const platform = navigator.platform;
      
      // iOS Detection (iPhone, iPad, iPod)
      const isIOS = /iPhone|iPad|iPod/i.test(ua) || 
                    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Android Detection
      const isAndroid = /Android/i.test(ua);
      
      // Windows Detection
      const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
      
      // macOS Detection (exclui iPad que se identifica como Mac)
      const isMacOS = /Mac/i.test(platform) && !isIOS && navigator.maxTouchPoints <= 1;
      
      // Linux Detection
      const isLinux = /Linux/i.test(platform) && !isAndroid;
      
      // Device type detection
      const isMobileUA = /iPhone|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Kindle|Silk/i.test(ua);
      
      const isMobile = (isIOS && /iPhone|iPod/i.test(ua)) || 
                       (isAndroid && /Mobile/i.test(ua)) ||
                       isMobileUA;
      
      const isTablet = (isIOS && /iPad/i.test(ua)) || 
                       (isAndroid && !/Mobile/i.test(ua)) ||
                       isTabletUA;
      
      const isDesktop = !isMobile && !isTablet;
      
      // Browser detection
      const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua) ||
                       (isIOS && !/CriOS|FxiOS|EdgiOS/i.test(ua));
      const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua) && !isSafari;
      const isEdge = /Edg/i.test(ua);
      const isFirefox = /Firefox/i.test(ua);
      
      // Standalone mode detection
      const nav = window.navigator as NavigatorStandalone;
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        nav.standalone === true ||
        document.referrer.includes('android-app://');
      
      // Determine platform type
      let platformType: PlatformType = 'unknown';
      if (isIOS) platformType = 'ios';
      else if (isAndroid) platformType = 'android';
      else if (isWindows) platformType = 'windows';
      else if (isMacOS) platformType = 'macos';
      else if (isLinux) platformType = 'linux';
      
      // Determine device type
      let deviceType: DeviceType = 'desktop';
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      
      return {
        platform: platformType,
        deviceType,
        isIOS,
        isAndroid,
        isWindows,
        isMacOS,
        isLinux,
        isMobile,
        isTablet,
        isDesktop,
        isSafari,
        isChrome,
        isEdge,
        isFirefox,
        isStandalone,
      };
    };

    setPlatformInfo(detectPlatform());
  }, []);

  return platformInfo;
};
