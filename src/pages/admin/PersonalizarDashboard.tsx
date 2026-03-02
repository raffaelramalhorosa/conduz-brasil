import { useState, useEffect } from 'react';
import { Moon, Sun, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { toast } from 'sonner';
import { applySchoolTheme } from '@/lib/schoolTheme';

interface Theme {
  id: string;
  name: string;
  category: 'dark' | 'light';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

const themes: Theme[] = [
  { id: 'dark-orange', name: 'Laranja Escuro', category: 'dark', primary_color: '#FF8C00', secondary_color: '#1a1a2e', accent_color: '#F59E0B', background_color: '#0f0f23', text_color: '#F8FAFC' },
  { id: 'dark-blue', name: 'Azul Noturno', category: 'dark', primary_color: '#3B82F6', secondary_color: '#1E293B', accent_color: '#60A5FA', background_color: '#0F172A', text_color: '#F1F5F9' },
  { id: 'dark-green', name: 'Verde Floresta', category: 'dark', primary_color: '#22C55E', secondary_color: '#1A2E1A', accent_color: '#4ADE80', background_color: '#0F1F0F', text_color: '#F0FDF4' },
  { id: 'dark-purple', name: 'Roxo Noite', category: 'dark', primary_color: '#A855F7', secondary_color: '#1E1B2E', accent_color: '#C084FC', background_color: '#13111C', text_color: '#FAF5FF' },
  { id: 'dark-red', name: 'Vermelho Elegante', category: 'dark', primary_color: '#EF4444', secondary_color: '#2E1A1A', accent_color: '#F87171', background_color: '#1F0F0F', text_color: '#FEF2F2' },
  { id: 'dark-teal', name: 'Turquesa Profundo', category: 'dark', primary_color: '#14B8A6', secondary_color: '#1A2E2B', accent_color: '#2DD4BF', background_color: '#0F1F1D', text_color: '#F0FDFA' },
  { id: 'light-orange', name: 'Laranja Claro', category: 'light', primary_color: '#EA580C', secondary_color: '#FFFFFF', accent_color: '#F97316', background_color: '#FFF7ED', text_color: '#1C1917' },
  { id: 'light-blue', name: 'Azul Clássico', category: 'light', primary_color: '#2563EB', secondary_color: '#FFFFFF', accent_color: '#3B82F6', background_color: '#EFF6FF', text_color: '#1E293B' },
  { id: 'light-green', name: 'Verde Suave', category: 'light', primary_color: '#16A34A', secondary_color: '#FFFFFF', accent_color: '#22C55E', background_color: '#F0FDF4', text_color: '#14532D' },
  { id: 'light-purple', name: 'Roxo Lavanda', category: 'light', primary_color: '#9333EA', secondary_color: '#FFFFFF', accent_color: '#A855F7', background_color: '#FAF5FF', text_color: '#3B0764' },
  { id: 'light-neutral', name: 'Neutro Profissional', category: 'light', primary_color: '#475569', secondary_color: '#FFFFFF', accent_color: '#64748B', background_color: '#F8FAFC', text_color: '#0F172A' },
  { id: 'light-warm', name: 'Bege Acolhedor', category: 'light', primary_color: '#B45309', secondary_color: '#FFFBEB', accent_color: '#D97706', background_color: '#FEFCE8', text_color: '#422006' },
];

function detectThemeId(settings: { primary_color: string; background_color: string }): string | null {
  return themes.find(t => t.primary_color === settings.primary_color && t.background_color === settings.background_color)?.id || null;
}

export default function PersonalizarDashboard() {
  const { settings, updateSettings, isLoading } = useDashboardSettings();

  const [themeCategory, setThemeCategory] = useState<'dark' | 'light'>('dark');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const detected = detectThemeId(settings);
      if (detected) {
        setSelectedThemeId(detected);
        const t = themes.find(th => th.id === detected);
        if (t) setThemeCategory(t.category);
      }
    }
  }, [settings]);

  const handleSelectTheme = async (theme: Theme) => {
    setSelectedThemeId(theme.id);

    applySchoolTheme({
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
    });

    await updateSettings({
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
    } as any);

    toast.success('Tema aplicado!');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--school-text, hsl(var(--foreground)))' }}>Personalizar Dashboard</h1>
        <p style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Customize a aparência do seu painel</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle style={{ color: 'var(--school-text, hsl(var(--foreground)))' }}>Tema</CardTitle>
          <CardDescription style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Escolha um tema para o dashboard da sua autoescola</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 mb-4">
            <Button
              variant={themeCategory === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setThemeCategory('dark')}
            >
              <Moon className="w-4 h-4 mr-1.5" />
              Escuros
            </Button>
            <Button
              variant={themeCategory === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setThemeCategory('light')}
            >
              <Sun className="w-4 h-4 mr-1.5" />
              Claros
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {themes.filter(t => t.category === themeCategory).map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                  selectedThemeId === theme.id
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="p-3 h-24" style={{ backgroundColor: theme.background_color }}>
                  <div className="flex gap-2 h-full">
                    <div className="w-8 rounded-lg" style={{ backgroundColor: theme.secondary_color, border: `1px solid ${theme.primary_color}20` }}>
                      <div className="w-3 h-3 rounded mx-auto mt-2" style={{ backgroundColor: theme.primary_color }} />
                      <div className="w-3 h-1 rounded mx-auto mt-1.5" style={{ backgroundColor: theme.accent_color, opacity: 0.5 }} />
                      <div className="w-3 h-1 rounded mx-auto mt-1" style={{ backgroundColor: theme.accent_color, opacity: 0.3 }} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 w-16 rounded" style={{ backgroundColor: theme.text_color, opacity: 0.8 }} />
                      <div className="h-1.5 w-12 rounded" style={{ backgroundColor: theme.text_color, opacity: 0.3 }} />
                      <div className="flex gap-1 mt-2">
                        <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.secondary_color }} />
                        <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.primary_color, opacity: 0.2 }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-2 py-2 text-center" style={{ backgroundColor: theme.secondary_color }}>
                  <p className="text-[11px] font-medium" style={{ color: theme.text_color }}>{theme.name}</p>
                </div>

                {selectedThemeId === theme.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
