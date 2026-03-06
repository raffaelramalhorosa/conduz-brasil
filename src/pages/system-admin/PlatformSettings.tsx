import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Percent, DollarSign, Calculator, Save, Loader2, CreditCard, ToggleLeft } from 'lucide-react';
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

export default function PlatformSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feeType, setFeeType] = useState<FeeType>('percentage');
  const [feePercentage, setFeePercentage] = useState(0);
  const [feeFixed, setFeeFixed] = useState(0);
  const [currentSettingsId, setCurrentSettingsId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // MP Environment
  const [mpEnvironment, setMpEnvironment] = useState<'sandbox' | 'production'>('sandbox');
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

  const { data: mpEnvData } = useQuery({
    queryKey: ['mp-environment'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mp_environment_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });

  useEffect(() => {
    if (platformSettings) {
      setFeeType(platformSettings.fee_type || 'percentage');
      setFeePercentage(platformSettings.platform_fee_percentage || 0);
      setFeeFixed(platformSettings.platform_fee_fixed || 0);
      setCurrentSettingsId(platformSettings.id);
    }
  }, [platformSettings]);

  useEffect(() => {
    if (mpEnvData) {
      setMpEnvironment(mpEnvData.environment || 'sandbox');
    }
  }, [mpEnvData]);

  const calculateFee = (price: number) => {
    let fee = 0;
    if (feeType === 'percentage' || feeType === 'both') {
      fee += price * (feePercentage / 100);
    }
    if (feeType === 'fixed' || feeType === 'both') {
      fee += feeFixed;
    }
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
        ({ error } = await supabase
          .from('platform_settings' as any)
          .update(payload as any)
          .eq('id', currentSettingsId));
      } else {
        ({ error } = await supabase
          .from('platform_settings' as any)
          .insert(payload as any));
      }

      if (error) throw error;

      try {
        const { data: updatedCount, error: rpcError } = await supabase.rpc(
          'recalculate_pending_bookings_fees' as any,
          {
            p_fee_type: feeType,
            p_fee_percentage: feePercentage,
            p_fee_fixed: feeFixed,
          }
        );
        if (rpcError) console.error('Error recalculating bookings:', rpcError);
        else console.log(`Recalculated fees for ${updatedCount} bookings`);
      } catch (rpcErr) {
        console.error('Error calling recalculate RPC:', rpcErr);
      }

      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-bookings'] });
      toast.success('Taxa da plataforma atualizada e agendamentos recalculados!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMpEnvironment = async (newEnv: 'sandbox' | 'production') => {
    setSavingMp(true);
    try {
      const { data: existing } = await supabase
        .from('mp_environment_settings' as any)
        .select('id')
        .limit(1)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('mp_environment_settings' as any)
          .update({
            environment: newEnv,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          } as any)
          .eq('id', (existing as any).id));
      } else {
        ({ error } = await supabase
          .from('mp_environment_settings' as any)
          .insert({
            environment: newEnv,
            updated_by: user?.id,
          } as any));
      }

      if (error) throw error;

      setMpEnvironment(newEnv);
      queryClient.invalidateQueries({ queryKey: ['mp-environment'] });
      toast.success(
        newEnv === 'production'
          ? '⚠️ Ambiente de Produção ativado — pagamentos reais habilitados!'
          : '🧪 Ambiente de Teste (Sandbox) ativado'
      );
    } catch (err) {
      console.error('Error saving MP environment:', err);
      toast.error('Erro ao salvar ambiente do Mercado Pago');
    } finally {
      setSavingMp(false);
    }
  };

  const simulationPrice = 100;
  const simulatedFee = calculateFee(simulationPrice);
  const isProduction = mpEnvironment === 'production';

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader
        title="Configurações da Plataforma"
        subtitle="Gerencie as taxas e integrações de pagamento"
      />

      {/* Environment Banner */}
      <div className="px-6 pt-4">
        {isProduction ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <span className="text-lg">⚠️</span>
            <span className="text-red-400 font-semibold text-sm">
              Ambiente de Produção ativo — pagamentos reais habilitados
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <span className="text-lg">🧪</span>
            <span className="text-blue-400 font-semibold text-sm">
              Ambiente de Teste ativo
            </span>
          </div>
        )}
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
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
                  Defina o ambiente do Mercado Pago para processar pagamentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-zinc-700 p-4">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">Ambiente do Mercado Pago</Label>
                    <p className="text-xs text-zinc-400">
                      {isProduction
                        ? 'Pagamentos reais estão sendo processados'
                        : 'Usando credenciais de teste (Sandbox)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${!isProduction ? 'text-blue-400' : 'text-zinc-500'}`}>
                      Sandbox
                    </span>
                    <Switch
                      checked={isProduction}
                      disabled={savingMp}
                      onCheckedChange={(checked) =>
                        handleSaveMpEnvironment(checked ? 'production' : 'sandbox')
                      }
                      className="data-[state=checked]:bg-red-500"
                    />
                    <span className={`text-xs font-medium ${isProduction ? 'text-red-400' : 'text-zinc-500'}`}>
                      Produção
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-800/50 p-3 space-y-1">
                  <p className="text-xs text-zinc-400">
                    <strong className="text-zinc-300">Sandbox:</strong> usa as variáveis{' '}
                    <code className="text-yellow-400/80">MERCADOPAGO_PUBLIC_ACESSTOKEN</code> e{' '}
                    <code className="text-yellow-400/80">MERCADOPAGO_PUBLIC</code>
                  </p>
                  <p className="text-xs text-zinc-400">
                    <strong className="text-zinc-300">Produção:</strong> usa as variáveis{' '}
                    <code className="text-yellow-400/80">MERCADOPAGO_PUBLIC_ACESSTOKEN_PROD</code> e{' '}
                    <code className="text-yellow-400/80">MERCADOPAGO_PUBLIC_PROD</code>
                  </p>
                </div>
              </CardContent>
            </Card>

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
                  <RadioGroup
                    value={feeType}
                    onValueChange={(v) => setFeeType(v as FeeType)}
                    className="space-y-3"
                  >
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
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={feePercentage}
                        onChange={(e) => setFeePercentage(Number(e.target.value))}
                        className="bg-zinc-800 border-zinc-700 text-white pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    </div>
                  </div>
                )}

                {(feeType === 'fixed' || feeType === 'both') && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Taxa fixa por aula (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={feeFixed}
                        onChange={(e) => setFeeFixed(Number(e.target.value))}
                        className="bg-zinc-800 border-zinc-700 text-white pl-10"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Simulation */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Simulação</CardTitle>
                <CardDescription className="text-zinc-400">
                  Para uma aula de R$ {simulationPrice.toFixed(2).replace('.', ',')}:
                </CardDescription>
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
                  <span className="text-green-400 font-bold text-lg">
                    R$ {(simulationPrice - simulatedFee).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold h-11"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar configurações de taxa
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
