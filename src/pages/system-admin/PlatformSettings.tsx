import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Percent, DollarSign, Calculator, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
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
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Taxa da plataforma atualizada!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const simulationPrice = 100;
  const simulatedFee = calculateFee(simulationPrice);

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader
        title="Configurações da Plataforma"
        subtitle="Gerencie as taxas cobradas sobre cada aula"
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <>
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

                {/* Fee values */}
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
              Salvar configurações
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
