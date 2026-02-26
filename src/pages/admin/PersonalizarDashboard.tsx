import { useState, useEffect } from 'react';
import { Palette, Type, Image, Save, Upload, Trash2, Moon, Sun, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { toast } from 'sonner';
import { applySchoolTheme } from '@/lib/schoolTheme';

const FONT_OPTIONS = ['Inter', 'Outfit', 'Lora', 'Space Mono', 'Roboto', 'Poppins', 'Montserrat'];

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

function loadGoogleFont(font: string) {
  const id = `google-font-${font.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function detectThemeId(settings: { primary_color: string; background_color: string }): string | null {
  return themes.find(t => t.primary_color === settings.primary_color && t.background_color === settings.background_color)?.id || null;
}

export default function PersonalizarDashboard() {
  const { settings, updateSettings, uploadLogo, removeLogo, isLoading, isSaving } = useDashboardSettings();

  const [fontFamily, setFontFamily] = useState('Inter');
  const [hasChanges, setHasChanges] = useState(false);
  const [themeCategory, setThemeCategory] = useState<'dark' | 'light'>('dark');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFontFamily(settings.font_family);
      const detected = detectThemeId(settings);
      if (detected) {
        setSelectedThemeId(detected);
        const t = themes.find(th => th.id === detected);
        if (t) setThemeCategory(t.category);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    setHasChanges(fontFamily !== settings.font_family);
  }, [fontFamily, settings]);

  useEffect(() => {
    if (fontFamily && fontFamily !== 'Inter') {
      loadGoogleFont(fontFamily);
    }
  }, [fontFamily]);

  const handleSave = async () => {
    await updateSettings({ font_family: fontFamily });
    setHasChanges(false);
  };

  const handleSelectTheme = async (theme: Theme) => {
    setSelectedThemeId(theme.id);

    // Apply CSS vars immediately (preview)
    applySchoolTheme({
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
    });

    // Save to database
    await updateSettings({
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
    } as any);

    toast.success('Tema aplicado!');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    await uploadLogo(file);
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

      <Tabs defaultValue="temas" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="temas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Palette className="w-4 h-4" /> Temas
          </TabsTrigger>
          <TabsTrigger value="tipografia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Type className="w-4 h-4" /> Tipografia
          </TabsTrigger>
          <TabsTrigger value="logo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Image className="w-4 h-4" /> Logo
          </TabsTrigger>
        </TabsList>

        {/* Tab Temas */}
        <TabsContent value="temas">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle style={{ color: 'var(--school-text, hsl(var(--foreground)))' }}>Tema</CardTitle>
              <CardDescription style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Escolha um tema para o dashboard da sua autoescola</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Escuro / Claro */}
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

              {/* Grade de temas */}
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
                    {/* Preview do tema */}
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

                    {/* Nome do tema */}
                    <div className="px-2 py-2 text-center" style={{ backgroundColor: theme.secondary_color }}>
                      <p className="text-[11px] font-medium" style={{ color: theme.text_color }}>{theme.name}</p>
                    </div>

                    {/* Checkmark se selecionado */}
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
        </TabsContent>

        {/* Tab Tipografia */}
        <TabsContent value="tipografia">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle style={{ color: 'var(--school-text, hsl(var(--foreground)))' }}>Tipografia</CardTitle>
              <CardDescription style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Escolha a fonte do seu dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block" style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Fonte</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(font => {
                      loadGoogleFont(font);
                      return (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6">
                <Label className="mb-3 block" style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Preview</Label>
                <div className="rounded-xl p-6 bg-card border border-border" style={{ fontFamily }}>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--school-text, hsl(var(--foreground)))' }}>Bem-vindo ao seu painel, Autoescola!</h2>
                  <p style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Este é um exemplo de como o texto aparecerá com a fonte <strong>{fontFamily}</strong>.</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--school-text-muted, hsl(var(--muted-foreground)))' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Logo */}
        <TabsContent value="logo">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle style={{ color: 'var(--school-text, hsl(var(--foreground)))' }}>Logo da Autoescola</CardTitle>
              <CardDescription style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }}>Faça upload do logo para usar no dashboard (PNG, JPG, WEBP — máx. 2MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings?.logo_url ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 rounded-xl border border-border overflow-hidden bg-card flex items-center justify-center">
                    <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button variant="destructive" size="sm" onClick={removeLogo}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remover logo
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors bg-card">
                  <Upload className="w-8 h-8 mb-2" style={{ color: 'var(--school-text-muted, hsl(var(--muted-foreground)))' }} />
                  <span style={{ color: 'var(--school-text-secondary, hsl(var(--muted-foreground)))' }} className="text-sm">Clique ou arraste para fazer upload</span>
                  <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp" onChange={handleLogoUpload} />
                </label>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="min-w-[180px]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}
