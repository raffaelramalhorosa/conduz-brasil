import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AutoescolaDashboardSettings {
  id: string;
  autoescola_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  sections_order: string[];
  created_at: string;
  updated_at: string;
}

const DEFAULTS: Omit<AutoescolaDashboardSettings, 'id' | 'autoescola_id' | 'created_at' | 'updated_at'> = {
  logo_url: null,
  primary_color: '#FF8C00',
  secondary_color: '#1a1a2e',
  accent_color: '#F59E0B',
  background_color: '#0f0f23',
  text_color: '#F8FAFC',
  font_family: 'Inter',
  sections_order: ['stats', 'agenda', 'instrutores', 'veiculos', 'financeiro', 'alunos', 'chat', 'avaliacoes', 'notificacoes'],
};

export function useAutoescolaDashboardSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['autoescola-dashboard-settings', user?.id];

  const { data: settings, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<AutoescolaDashboardSettings> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('autoescola_dashboard_settings')
        .select('*')
        .eq('autoescola_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          ...data,
          text_color: (data as any).text_color || DEFAULTS.text_color,
          sections_order: (data.sections_order as string[]) || DEFAULTS.sections_order,
        } as AutoescolaDashboardSettings;
      }

      // Create default settings
      const { data: newData, error: insertError } = await supabase
        .from('autoescola_dashboard_settings')
        .insert({
          autoescola_id: user.id,
          ...DEFAULTS,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return {
        ...newData,
        text_color: (newData as any).text_color || DEFAULTS.text_color,
        sections_order: (newData.sections_order as string[]) || DEFAULTS.sections_order,
      } as AutoescolaDashboardSettings;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AutoescolaDashboardSettings>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('autoescola_dashboard_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('autoescola_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações.');
    },
  });

  const uploadLogo = useCallback(async (file: File) => {
    if (!user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/logo.${ext}`;

    // Remove old logo if exists
    await supabase.storage.from('autoescola-logos').remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.webp`]);

    const { error: uploadError } = await supabase.storage
      .from('autoescola-logos')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao fazer upload do logo.');
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('autoescola-logos').getPublicUrl(path);

    await supabase
      .from('autoescola_dashboard_settings')
      .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('autoescola_id', user.id);

    queryClient.invalidateQueries({ queryKey });
    toast.success('Logo atualizado com sucesso!');
  }, [user, queryClient, queryKey]);

  const removeLogo = useCallback(async () => {
    if (!user || !settings?.logo_url) return;

    // Remove all possible logo files
    await supabase.storage.from('autoescola-logos').remove([
      `${user.id}/logo.png`,
      `${user.id}/logo.jpg`,
      `${user.id}/logo.webp`,
    ]);

    await supabase
      .from('autoescola_dashboard_settings')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('autoescola_id', user.id);

    queryClient.invalidateQueries({ queryKey });
    toast.success('Logo removido.');
  }, [user, settings, queryClient, queryKey]);

  return {
    settings: settings || null,
    updateSettings: updateMutation.mutateAsync,
    uploadLogo,
    removeLogo,
    isLoading,
    isSaving: updateMutation.isPending,
    defaults: DEFAULTS,
  };
}
