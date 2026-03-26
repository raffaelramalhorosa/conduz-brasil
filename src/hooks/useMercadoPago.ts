import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Tipos do SDK do Mercado Pago ──────────────────────────────────────────────

export interface CardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: 'CPF' | 'CNPJ';
  identificationNumber: string;
}

interface MercadoPagoInstance {
  createCardToken(data: CardTokenData): Promise<{ id: string; [key: string]: unknown }>;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMercadoPago() {
  const mpRef = useRef<MercadoPagoInstance | null>(null);

  // Busca environment + public key do banco
  const { data: mpSettings } = useQuery({
    queryKey: ['mp-settings-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mp_settings')
        .select('key, value')
        .in('key', ['mp_environment', 'mp_prod_public_key', 'mp_sandbox_public_key']);
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => (map[row.key] = row.value));
      const env = map['mp_environment'] || 'sandbox';
      const publicKey = env === 'production'
        ? map['mp_prod_public_key']
        : map['mp_sandbox_public_key'];
      return { env, publicKey: publicKey || '' };
    },
    staleTime: 1000 * 60 * 30,
  });

  // Inicializa o SDK quando a public key estiver disponível
  useEffect(() => {
    const key = mpSettings?.publicKey;
    if (!key) return;
    if (typeof window.MercadoPago === 'undefined') {
      console.warn('[useMercadoPago] SDK não carregado ainda — verifique o script tag no index.html');
      return;
    }
    mpRef.current = new window.MercadoPago(key, { locale: 'pt-BR' });
  }, [mpSettings?.publicKey]);

  async function createCardToken(cardData: CardTokenData): Promise<string> {
    if (typeof window.MercadoPago === 'undefined') {
      throw new Error('SDK do Mercado Pago não está disponível. Recarregue a página e tente novamente.');
    }
    if (!mpSettings?.publicKey) {
      throw new Error('Chave pública do Mercado Pago não configurada. Contate o suporte.');
    }
    // Inicialização lazy caso o useEffect ainda não tenha rodado
    if (!mpRef.current) {
      mpRef.current = new window.MercadoPago(mpSettings.publicKey, { locale: 'pt-BR' });
    }
    const token = await mpRef.current.createCardToken(cardData);
    return token.id;
  }

  return { createCardToken, ready: !!mpSettings?.publicKey };
}
