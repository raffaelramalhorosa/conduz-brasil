import React, { createContext, useContext } from 'react';
import { useAutoescolaDashboardSettings, AutoescolaDashboardSettings } from '@/hooks/useAutoescolaDashboardSettings';

interface DashboardSettingsContextType {
  settings: AutoescolaDashboardSettings | null;
  updateSettings: (updates: Partial<AutoescolaDashboardSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  removeLogo: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  defaults: Omit<AutoescolaDashboardSettings, 'id' | 'autoescola_id' | 'created_at' | 'updated_at'>;
}

const DashboardSettingsContext = createContext<DashboardSettingsContextType | undefined>(undefined);

export function DashboardSettingsProvider({ children }: { children: React.ReactNode }) {
  const settingsHook = useAutoescolaDashboardSettings();

  return (
    <DashboardSettingsContext.Provider value={settingsHook}>
      {children}
    </DashboardSettingsContext.Provider>
  );
}

export function useDashboardSettings() {
  const context = useContext(DashboardSettingsContext);
  if (!context) {
    throw new Error('useDashboardSettings must be used within DashboardSettingsProvider');
  }
  return context;
}
