import { useState, useEffect } from 'react';
import { Palette, Type, Image, LayoutList, RotateCcw, Save, Upload, Trash2, GripVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { toast } from 'sonner';

const FONT_OPTIONS = ['Inter', 'Outfit', 'Lora', 'Space Mono', 'Roboto', 'Poppins', 'Montserrat'];

const SECTION_LABELS: Record<string, string> = {
  stats: '📊 Estatísticas',
  agenda: '📅 Agenda',
  alunos: '👨‍🎓 Alunos',
  financeiro: '💰 Financeiro',
  instrutores: '👨‍🏫 Instrutores',
  notificacoes: '🔔 Notificações',
};

function loadGoogleFont(font: string) {
  const id = `google-font-${font.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export default function PersonalizarDashboard() {
  const { settings, updateSettings, uploadLogo, removeLogo, isLoading, isSaving, defaults } = useDashboardSettings();

  const [primaryColor, setPrimaryColor] = useState(defaults.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(defaults.secondary_color);
  const [accentColor, setAccentColor] = useState(defaults.accent_color);
  const [backgroundColor, setBackgroundColor] = useState(defaults.background_color);
  const [fontFamily, setFontFamily] = useState(defaults.font_family);
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(defaults.sections_order as string[]);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color);
      setSecondaryColor(settings.secondary_color);
      setAccentColor(settings.accent_color);
      setBackgroundColor(settings.background_color);
      setFontFamily(settings.font_family);
      setSectionsOrder(settings.sections_order);
    }
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    const changed =
      primaryColor !== settings.primary_color ||
      secondaryColor !== settings.secondary_color ||
      accentColor !== settings.accent_color ||
      backgroundColor !== settings.background_color ||
      fontFamily !== settings.font_family ||
      JSON.stringify(sectionsOrder) !== JSON.stringify(settings.sections_order);
    setHasChanges(changed);
  }, [primaryColor, secondaryColor, accentColor, backgroundColor, fontFamily, sectionsOrder, settings]);

  useEffect(() => {
    if (fontFamily && fontFamily !== 'Inter') {
      loadGoogleFont(fontFamily);
    }
  }, [fontFamily]);

  const handleSave = async () => {
    await updateSettings({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      font_family: fontFamily,
      sections_order: sectionsOrder,
    });
    setHasChanges(false);
  };

  const handleResetColors = () => {
    setPrimaryColor(defaults.primary_color);
    setSecondaryColor(defaults.secondary_color);
    setAccentColor(defaults.accent_color);
    setBackgroundColor(defaults.background_color);
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    e.currentTarget.style.borderTop = `2px solid var(--school-primary, #FF8C00)`;
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderTop = 'none';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.currentTarget.style.borderTop = 'none';
    if (draggedIndex === null || draggedIndex === index) return;
    const newSections = [...sectionsOrder];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, removed);
    setSectionsOrder(newSections);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
        <h1 className="text-2xl font-bold text-white mb-2">Personalizar Dashboard</h1>
        <p className="text-instructor-text-secondary">Customize a aparência do seu painel</p>
      </div>

      <Tabs defaultValue="cores" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="cores" className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 gap-2">
            <Palette className="w-4 h-4" /> Cores
          </TabsTrigger>
          <TabsTrigger value="tipografia" className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 gap-2">
            <Type className="w-4 h-4" /> Tipografia
          </TabsTrigger>
          <TabsTrigger value="logo" className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 gap-2">
            <Image className="w-4 h-4" /> Logo
          </TabsTrigger>
          <TabsTrigger value="secoes" className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 gap-2">
            <LayoutList className="w-4 h-4" /> Seções
          </TabsTrigger>
        </TabsList>

        {/* Tab Cores */}
        <TabsContent value="cores">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Cores do Dashboard</CardTitle>
              <CardDescription className="text-white/60">Personalize as cores do seu painel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ColorPicker label="Cor Primária" description="Botões e destaques" value={primaryColor} onChange={setPrimaryColor} />
                <ColorPicker label="Cor Secundária" description="Backgrounds de cards" value={secondaryColor} onChange={setSecondaryColor} />
                <ColorPicker label="Cor de Acento" description="Badges e alertas" value={accentColor} onChange={setAccentColor} />
                <ColorPicker label="Cor de Fundo" description="Background geral" value={backgroundColor} onChange={setBackgroundColor} />
              </div>

              <Button variant="outline" size="sm" onClick={handleResetColors} className="border-white/20 text-white hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" /> Restaurar cores padrão
              </Button>

              {/* Preview */}
              <div className="mt-6">
                <Label className="text-white/80 mb-3 block">Preview</Label>
                <div className="rounded-xl p-6 border border-white/10" style={{ backgroundColor }}>
                  <div className="flex gap-4">
                    <div className="rounded-lg p-4 flex-1" style={{ backgroundColor: secondaryColor }}>
                      <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: primaryColor }} />
                      <div className="h-2 w-16 rounded" style={{ backgroundColor: accentColor }} />
                    </div>
                    <div className="rounded-lg p-4 flex-1" style={{ backgroundColor: secondaryColor }}>
                      <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: primaryColor }} />
                      <div className="h-2 w-16 rounded" style={{ backgroundColor: accentColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Tipografia */}
        <TabsContent value="tipografia">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Tipografia</CardTitle>
              <CardDescription className="text-white/60">Escolha a fonte do seu dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white/80 mb-2 block">Fonte</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="w-64 bg-white/5 border-white/20 text-white">
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
                <Label className="text-white/80 mb-3 block">Preview</Label>
                <div className="rounded-xl p-6 bg-white/5 border border-white/10" style={{ fontFamily }}>
                  <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao seu painel, Autoescola!</h2>
                  <p className="text-white/60">Este é um exemplo de como o texto aparecerá com a fonte <strong>{fontFamily}</strong>.</p>
                  <p className="text-white/40 text-sm mt-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Logo */}
        <TabsContent value="logo">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Logo da Autoescola</CardTitle>
              <CardDescription className="text-white/60">Faça upload do logo para usar no dashboard (PNG, JPG, WEBP — máx. 2MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings?.logo_url ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                    <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button variant="destructive" size="sm" onClick={removeLogo}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remover logo
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors bg-white/5">
                  <Upload className="w-8 h-8 text-white/40 mb-2" />
                  <span className="text-white/60 text-sm">Clique ou arraste para fazer upload</span>
                  <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp" onChange={handleLogoUpload} />
                </label>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Seções — Drag and Drop */}
        <TabsContent value="secoes">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Ordem das Seções</CardTitle>
              <CardDescription className="text-white/60">Arraste para reordenar as seções do dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sectionsOrder.map((section, index) => (
                  <div
                    key={section}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
                      draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'
                    }`}
                    style={{
                      backgroundColor: 'var(--school-secondary, #1a1a2e)',
                      borderColor: 'color-mix(in srgb, var(--school-primary, #FF8C00) 20%, transparent)',
                    }}
                  >
                    <GripVertical className="w-5 h-5 text-white/30 flex-shrink-0" />
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--school-primary, #FF8C00) 20%, transparent)',
                        color: 'var(--school-primary, #FF8C00)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 text-white font-medium">{SECTION_LABELS[section] || section}</span>
                  </div>
                ))}
              </div>
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

function ColorPicker({ label, description, value, onChange }: { label: string; description: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
        />
      </div>
      <div className="flex-1">
        <Label className="text-white font-medium">{label}</Label>
        <p className="text-white/50 text-xs">{description}</p>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mt-1 w-28 h-7 text-xs bg-white/5 border-white/20 text-white"
        />
      </div>
      <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: value }} />
    </div>
  );
}
