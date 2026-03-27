import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getMpSettings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data } = await supabaseAdmin.from('mp_settings').select('key, value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  const env = map['mp_environment'] || 'sandbox';
  const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
  return { accessToken: map[`${prefix}_access_token`] || null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Método não permitido' }, 405);
    }

    // ── Autenticação ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Não autenticado' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return jsonResponse({ error: 'Token inválido' }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // ── Payload ───────────────────────────────────────────────────────────────
    const { subscription_id } = await req.json();
    if (!subscription_id) {
      return jsonResponse({ error: 'subscription_id é obrigatório' }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── Verificar que a assinatura pertence ao usuário ────────────────────────
    const { data: subscription, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id, owner_id, owner_type, mp_preapproval_id, current_period_end, status')
      .eq('id', subscription_id)
      .eq('owner_id', userId)
      .single();

    if (subErr || !subscription) {
      return jsonResponse({ error: 'Assinatura não encontrada' }, 403);
    }

    if (subscription.status === 'cancelled') {
      return jsonResponse({ error: 'Assinatura já está cancelada' }, 409);
    }

    // ── Cancelar no Mercado Pago (se houver preapproval vinculado) ────────────
    if (subscription.mp_preapproval_id) {
      const creds = await getMpSettings(supabaseAdmin);
      if (!creds.accessToken) {
        return jsonResponse({ error: 'Token do Mercado Pago não configurado' }, 500);
      }

      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription.mp_preapproval_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${creds.accessToken}`,
          },
          body: JSON.stringify({ status: 'cancelled' }),
        },
      );

      const mpData = await mpRes.json();
      console.log('MP cancel preapproval status:', mpRes.status, 'id:', subscription.mp_preapproval_id);

      if (!mpRes.ok) {
        const mpError = mpData;

        // Se já está cancelado no MP, tudo bem — seguir em frente
        if (mpRes.status === 400 && mpError?.message?.includes('cancelled')) {
          console.log('Preapproval já cancelado no MP, atualizando banco...');
        } else {
          // Erro real — retornar para o usuário
          console.error('Erro ao cancelar no MP:', JSON.stringify(mpError));
          return jsonResponse({ error: 'Erro ao cancelar no Mercado Pago' }, 500);
        }
      }
    } else {
      // Trial sem preapproval — apenas cancelar no banco
      console.log('Cancelando trial sem preapproval, subscription:', subscription.id);
    }

    // ── Atualizar banco ───────────────────────────────────────────────────────
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', subscription.id);

    return jsonResponse({
      success: true,
      access_until: subscription.current_period_end,
    });

  } catch (error) {
    console.error('Erro em cancel-subscription:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      500,
    );
  }
});
