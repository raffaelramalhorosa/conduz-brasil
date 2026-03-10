import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Percent, DollarSign, Calculator, Save, Loader2, CreditCard, Eye, EyeOff, Pencil, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SystemAdminHeader } from '@/components/system-admin/SystemAdminHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type FeeType = 'percentage' | 'fixed' | 'both';

interface CredentialField {
  key: string;
  label: string;
  type: 'password' | 'text';
}

const sandboxFields: CredentialField[] = [
  { key: 'mp_sandbox_access_token', label: 'Access Token', type: 'password' },
  { key: 'mp_sandbox_public_key', label: 'Public Key', type: 'password' },
  { key: 'mp_sandbox_client_id', label: 'Client ID', type: 'text' },
  { key: 'mp_sandbox_client_secret', label: 'Client Secret', type: 'password' },
];

const prodFields: CredentialField[] = [
  { key: 'mp_prod_access_token', label: 'Access Token', type: 'password' },
  { key: 'mp_prod_public_key', label: 'Public Key', type: 'password' },
  { key: 'mp_prod_client_id', label: 'Client ID', type: 'text' },
  { key: 'mp_prod_client_secret', label: 'Client Secret', type: 'password' },
];

function CredentialCard({
  title,
  fields,
  credentials,
  isActive,
  onSave,
}: {
  title: string;
  fields: CredentialField[];
  credentials: Record<string, string>;
  isActive: boolean;
  onSave: (values: Record<string, string>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const v: Record<string, string> = {};
    fields.forEach((f) => (v[f.key] = credentials[f.key] || ''));
    setValues(v);
  }, [credentials, fields]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      setEditing(false);
      toast.success('Credenciais atualizadas com sucesso!');
    } catch {
      toast.error('Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`bg-zinc-900 ${isActive ? 'border-green-500 border-2' : 'border-zinc-700'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base">{title}</CardTitle>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={isActive ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400'}
          >
            {isActive ? 'Em uso' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-zinc-400 text-xs">{field.label}</Label>
            <div className="relative">
              <Input
                type={field.type === 'password' && !visible[field.key] ? 'password' : 'text'}
                value={editing ? values[field.key] : values[field.key] ? '••••••••••••' : ''}
                onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                disabled={!editing}
                placeholder={editing ? `Insira ${field.label}` : 'Não configurado'}
                className="bg-zinc-800 border-zinc-700 text-white pr-10 text-sm"
              />
              {field.type === 'password' && editing && (
                <button
                  type="button"
                  onClick={() => setVisible((p) => ({ ...p, [field.key]: !p[field.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {visible[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-yellow-400 hover:bg-yellow-500 text-zinc-900"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-zinc-700 text-zinc-300">
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="border-zinc-700 text-zinc-300"
            >
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlatformSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feeType, setFeeType] = useState<FeeType>('percentage');
  const [feePercentage, setFeePercentage] = useState(0);
  const [feeFixed, setFeeFixed] = useState(0);
  const [currentSettingsId, setCurrentSettingsId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingMp, setSavingMp] = useState(false);

  const { data: platformSettings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_settings' as any)
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });

  const { data: mpCredentials } = useQuery({
    queryKey: ['mp-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mp_settings' as any)
        .select('key, value');
      const map: Record<string, string> = {};
      (data as any[])?.forEach((row: any) => (map[row.key] = row.value));
      return map;
    },
  });

  const mpEnvironment = (mpCredentials?.mp_environment as 'sandbox' | 'production') || 'sandbox';
  const isProduction = mpEnvironment === 'production';

  useEffect(() => {
    if (platformSettings) {
      setFeeType(platformSettings.fee_type || 'percentage');
      setFeePercentage(platformSettings.platform_fee_percentage || 0);
      setFeeFixed(platformSettings.platform_fee_fixed || 0);
      setCurrentSettingsId(platformSettings.id);
    }
  }, [platformSettings]);

  const calculateFee = (price: number) => {
    let fee = 0;
    if (feeType === 'percentage' || feeType === 'both') fee += price * (feePercentage / 100);
    if (feeType === 'fixed' || feeType === 'both') fee += feeFixed;
    return Math.round(fee * 100) / 100;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        platform_fee_percentage: feePercentage,
        platform_fee_fixed: feeFixed,
        fee_type: feeType,
        is_active: true,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };
      let error;
      if (currentSettingsId) {
        ({ error } = await supabase.from('platform_settings' as any).update(payload as any).eq('id', currentSettingsId));
      } else {
        ({ error } = await supabase.from('platform_settings' as any).insert(payload as any));
      }
      if (error) throw error;

      try {
        const { data: updatedCount, error: rpcError } = await supabase.rpc('recalculate_pending_bookings_fees' as any, {
          p_fee_type: feeType, p_fee_percentage: feePercentage, p_fee_fixed: feeFixed,
        });
        if (rpcError) console.error('Error recalculating bookings:', rpcError);
      } catch (rpcErr) { console.error('Error calling recalculate RPC:', rpcErr); }

      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Taxa da plataforma atualizada e agendamentos recalculados!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Erro ao salvar configurações');
    } finally { setSaving(false); }
  };

  const handleToggleEnvironment = async (checked: boolean) => {
    const newEnv = checked ? 'production' : 'sandbox';
    setSavingMp(true);
    try {
      const { error } = await supabase
        .from('mp_settings' as any)
        .update({ value: newEnv, updated_at: new Date().toISOString(), updated_by: user?.id } as any)
        .eq('key', 'mp_environment');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['mp-settings'] });
      toast.success(newEnv === 'production'
        ? '⚠️ Ambiente de Produção ativado — pagamentos reais habilitados!'
        : '🧪 Ambiente de Teste (Sandbox) ativado');
    } catch (err) {
      console.error('Error saving MP environment:', err);
      toast.error('Erro ao salvar ambiente do Mercado Pago');
    } finally { setSavingMp(false); }
  };

  const handleSaveCredentials = async (values: Record<string, string>) => {
    const promises = Object.entries(values).map(([key, value]) =>
      supabase
        .from('mp_settings' as any)
        .update({ value, updated_at: new Date().toISOString(), updated_by: user?.id } as any)
        .eq('key', key)
    );
    const results = await Promise.all(promises);
    const err = results.find((r) => r.error);
    if (err?.error) throw err.error;
    queryClient.invalidateQueries({ queryKey: ['mp-settings'] });
  };

  const simulationPrice = 100;
  const simulatedFee = calculateFee(simulationPrice);

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader title="Configurações da Plataforma" subtitle="Gerencie as taxas e integrações de pagamento" />

      {/* Environment Banner */}
      <div className="px-6 pt-4">
        {isProduction ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <span className="text-lg">⚠️</span>
            <span className="text-red-400 font-semibold text-sm">Ambiente de Produção ativo — pagamentos reais habilitados</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <span className="text-lg">🧪</span>
            <span className="text-blue-400 font-semibold text-sm">Ambiente de Teste ativo</span>
          </div>
        )}
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <>
            {/* MP Environment Toggle */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-yellow-400" />
                  Configurações de Pagamento
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Defina o ambiente e as credenciais do Mercado Pago.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-zinc-700 p-4">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">Ambiente do Mercado Pago</Label>
                    <p className="text-xs text-zinc-400">
                      {isProduction ? 'Pagamentos reais estão sendo processados' : 'Usando credenciais de teste (Sandbox)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${!isProduction ? 'text-blue-400' : 'text-zinc-500'}`}>Sandbox</span>
                    <Switch
                      checked={isProduction}
                      disabled={savingMp}
                      onCheckedChange={handleToggleEnvironment}
                      className="data-[state=checked]:bg-red-500"
                    />
                    <span className={`text-xs font-medium ${isProduction ? 'text-red-400' : 'text-zinc-500'}`}>Produção</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credential Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CredentialCard
                title="🧪 Sandbox (Teste)"
                fields={sandboxFields}
                credentials={mpCredentials || {}}
                isActive={!isProduction}
                onSave={handleSaveCredentials}
              />
              <CredentialCard
                title="🔴 Produção"
                fields={prodFields}
                credentials={mpCredentials || {}}
                isActive={isProduction}
                onSave={handleSaveCredentials}
              />
            </div>

            {/* Fee Type */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-yellow-400" />
                  Taxa da Plataforma
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Defina a taxa cobrada pela plataforma sobre cada aula realizada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-zinc-300">Tipo de cobrança</Label>
                  <RadioGroup value={feeType} onValueChange={(v) => setFeeType(v as FeeType)} className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-yellow-400/30 cursor-pointer transition-colors">
                      <RadioGroupItem value="percentage" className="mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Porcentagem</p>
                        <p className="text-xs text-zinc-400">Cobra X% sobre o valor de cada aula</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-yellow-400/30 cursor-pointer transition-colors">
                      <RadioGroupItem value="fixed" className="mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Valor fixo</p>
                        <p className="text-xs text-zinc-400">Cobra R$ X por aula realizada</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-yellow-400/30 cursor-pointer transition-colors">
                      <RadioGroupItem value="both" className="mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Ambos</p>
                        <p className="text-xs text-zinc-400">Cobra porcentagem + valor fixo</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {(feeType === 'percentage' || feeType === 'both') && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Taxa percentual (%)</Label>
                    <div className="relative">
                      <Input type="number" min={0} max={100} step={0.1} value={feePercentage} onChange={(e) => setFeePercentage(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white pr-8" />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    </div>
                  </div>
                )}

                {(feeType === 'fixed' || feeType === 'both') && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Taxa fixa por aula (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                      <Input type="number" min={0} step={0.01} value={feeFixed} onChange={(e) => setFeeFixed(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white pl-10" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Simulation */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Simulação</CardTitle>
                <CardDescription className="text-zinc-400">Para uma aula de R$ {simulationPrice.toFixed(2).replace('.', ',')}:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Valor da aula</span>
                  <span className="text-white font-medium">R$ {simulationPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Taxa da plataforma</span>
                  <span className="text-red-400">- R$ {simulatedFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Instrutor recebe</span>
                  <span className="text-green-400 font-bold text-lg">R$ {(simulationPrice - simulatedFee).toFixed(2).replace('.', ',')}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold h-11">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar configurações de taxa
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
