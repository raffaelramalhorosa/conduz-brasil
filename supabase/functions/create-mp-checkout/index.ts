import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getMpSettings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data } = await supabaseAdmin.from('mp_settings').select('key, value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  const env = map['mp_environment'] || 'sandbox';
  const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
  return {
    environment: env,
    isSandbox: env !== 'production',
    accessToken: map[`${prefix}_access_token`] || null,
    publicKey: map[`${prefix}_public_key`] || null,
    clientId: map[`${prefix}_client_id`] || null,   // App ID — required for marketplace split
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === AUTENTICAÇÃO JWT ===
    // amount e student_id NÃO são aceitos do body — derivados do JWT e do banco
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userToken = authHeader.replace('Bearer ', '');

    const { booking_id, description } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório: booking_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verificar identidade do chamador via JWT
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !authData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = authData.user.id;

    // === BUSCAR BOOKING ===
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, instructor_id, driving_school_id, is_affiliated_booking, total_price, status, payment_status')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que o chamador é o aluno deste booking
    const { data: studentProfile } = await supabaseAdmin
      .from('student_profiles')
      .select('id')
      .eq('user_id', callerUserId)
      .single();

    if (!studentProfile || booking.student_id !== studentProfile.id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para pagar este agendamento' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === VALOR AUTORITATIVO VEM DO BANCO, NUNCA DO CLIENT ===
    const parsedAmount = typeof booking.total_price === 'string'
      ? parseFloat(booking.total_price)
      : booking.total_price;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error('total_price inválido no booking:', booking.total_price);
      return new Response(
        JSON.stringify({ error: 'Valor do agendamento inválido' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const validStatuses = ['confirmed', 'accepted', 'pending_payment', 'awaiting_payment'];
    if (!validStatuses.includes(booking.status)) {
      console.log('BLOQUEIO: Status inválido', booking.status);
      return new Response(JSON.stringify({ error: 'invalid_booking_status', message: `Status '${booking.status}' não pode ser pago` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === PROTEÇÃO CONTRA PAGAMENTO DUPLICADO ===
    const { data: existingCharges } = await supabaseAdmin
      .from('payment_charges')
      .select('id, status')
      .eq('booking_id', booking_id)
      .in('status', ['approved', 'in_process']);

    if (existingCharges && existingCharges.length > 0) {
      return new Response(JSON.stringify({ error: 'already_paid', message: 'Esta aula já possui pagamento aprovado' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === BUSCAR CONTA MP DO INSTRUTOR/ESCOLA (token OAuth por vendedor) ===
    // Fluxo correto do Checkout Pro Marketplace:
    //   - Criar a preferência com o ACCESS TOKEN DO VENDEDOR (obtido via OAuth)
    //   - Definir marketplace_fee = comissão da plataforma
    //   - O MP deduz a comissão e repassa o restante automaticamente ao vendedor
    const mpAccountQuery = supabaseAdmin
      .from('mp_connected_accounts')
      .select('mp_user_id, mp_access_token')
      .eq('is_active', true);

    if (booking.is_affiliated_booking && booking.driving_school_id) {
      mpAccountQuery.eq('driving_school_id', booking.driving_school_id);
    } else {
      mpAccountQuery.eq('instructor_id', booking.instructor_id);
    }

    const { data: mpAccount } = await mpAccountQuery.maybeSingle();

    if (!mpAccount?.mp_access_token) {
      const entity = booking.is_affiliated_booking ? 'autoescola' : 'instrutor';
      console.log(`${entity} sem MP conectado:`, booking.instructor_id, booking.driving_school_id);
      return new Response(JSON.stringify({ error: 'instructor_mp_not_connected', message: `O ${entity} não configurou o recebimento via Mercado Pago` }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === BUSCAR CONFIGURAÇÕES DA PLATAFORMA (client_id, ambiente, fallback token) ===
    const creds = await getMpSettings(supabaseAdmin);
    if (!creds.accessToken) {
      return new Response(JSON.stringify({ error: 'Token da plataforma não configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Token do vendedor (OAuth) — usado para criar a preferência no lugar do token da plataforma
    const sellerToken = mpAccount.mp_access_token;

    console.log('Ambiente:', creds.environment);
    console.log('marketplace app client_id:', creds.clientId);
    console.log('mp_user_id do vendedor:', mpAccount.mp_user_id);
    console.log('Usando token do VENDEDOR para criar preferência (primeiros 20):', sellerToken?.slice(0, 20));

    // === CALCULAR TAXA ===
    const { data: platformSettings } = await supabaseAdmin
      .from('platform_settings')
      .select('platform_fee_percentage, platform_fee_fixed, fee_type')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let marketplaceFee = 0;
    if (platformSettings) {
      const { fee_type, platform_fee_percentage, platform_fee_fixed } = platformSettings;
      if (fee_type === 'percentage' || fee_type === 'both') {
        marketplaceFee += parsedAmount * ((platform_fee_percentage || 0) / 100);
      }
      if (fee_type === 'fixed' || fee_type === 'both') {
        marketplaceFee += platform_fee_fixed || 0;
      }
      marketplaceFee = Math.round(marketplaceFee * 100) / 100;
    }

    console.log('Taxa calculada:', { parsedAmount, marketplaceFee });

    // === BUSCAR PERFIL DO ALUNO ===
    const { data: studentUserProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', callerUserId)
      .single();

    // === BUSCAR NOME DO INSTRUTOR ===
    const { data: instructorProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', booking.instructor_id)
      .single();

    const appDomain = Deno.env.get('APP_URL') ?? 'https://conduzbrasil.com';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const correlationId = `cb_${booking_id}_${Date.now()}`;

    // === MONTAR PAYLOAD MARKETPLACE ===
    // Fluxo correto: preferência criada com token do VENDEDOR.
    // O MP identifica quem é o vendedor pelo token usado, não por collector_id.
    // marketplace_fee = comissão retida pela plataforma antes de repassar ao vendedor.
    const preferencePayload: any = {
      items: [{
        title: description || `Aula de direção — ${instructorProfile?.full_name || 'instrutor'}`,
        quantity: 1,
        unit_price: parsedAmount,
        currency_id: 'BRL',
      }],
      marketplace_fee: marketplaceFee,
      ...(creds.clientId ? { marketplace: creds.clientId } : {}),
      external_reference: booking_id,
      back_urls: {
        success: `${appDomain}/pagamento/sucesso?booking_id=${booking_id}`,
        failure: `${appDomain}/pagamento/erro?booking_id=${booking_id}`,
        pending: `${appDomain}/pagamento/pendente?booking_id=${booking_id}`,
      },
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    // Payer apenas em produção — sandbox rejeita emails reais
    if (!creds.isSandbox && studentUserProfile?.email) {
      preferencePayload.payer = {
        name: studentUserProfile.full_name || '',
        email: studentUserProfile.email,
      };
    }

    // === CRIAR PREFERÊNCIA COM TOKEN DO VENDEDOR ===
    const createPreference = async (payload: any, token: string) => {
      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      return { status: res.status, data: JSON.parse(text) };
    };

    console.log('PAYLOAD:', JSON.stringify(preferencePayload, null, 2));

    let mpData: any;
    let usedFallback = false;

    const firstAttempt = await createPreference(preferencePayload, sellerToken);
    console.log('Resposta MP status:', firstAttempt.status);
    if (!firstAttempt.status.toString().startsWith('2')) {
      console.log('Erro MP (primeira tentativa):', JSON.stringify(firstAttempt.data));
    }

    if (!firstAttempt.status.toString().startsWith('2') && (
      firstAttempt.data?.error === 'invalid_collector_id' ||
      firstAttempt.data?.error === 'invalid_marketplace_fee'
    )) {
      // Fallback: token do vendedor sem marketplace_fee (pagamento integral ao vendedor, sem comissão automática)
      console.warn('Erro de split — fallback sem marketplace_fee. Comissão deve ser gerenciada manualmente.');
      usedFallback = true;

      const fallbackPayload = { ...preferencePayload };
      delete fallbackPayload.marketplace_fee;

      const secondAttempt = await createPreference(fallbackPayload, sellerToken);
      console.log('Fallback MP status:', secondAttempt.status);

      if (!secondAttempt.status.toString().startsWith('2')) {
        console.error('Erro MP (fallback):', JSON.stringify(secondAttempt.data));
        return new Response(
          JSON.stringify({ error: 'payment_unavailable', message: 'Não foi possível processar o pagamento. Tente novamente mais tarde.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      mpData = secondAttempt.data;
    } else if (!firstAttempt.status.toString().startsWith('2')) {
      console.error('Erro MP:', JSON.stringify(firstAttempt.data));
      return new Response(
        JSON.stringify({ error: 'payment_unavailable', message: 'Não foi possível processar o pagamento. Tente novamente mais tarde.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } else {
      mpData = firstAttempt.data;
    }

    const checkoutUrl = creds.isSandbox
      ? (mpData.sandbox_init_point || mpData.init_point)
      : mpData.init_point;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: 'payment_unavailable', message: 'Não foi possível processar o pagamento. Tente novamente mais tarde.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (usedFallback) {
      // Notificar admin que um pagamento sem split ocorreu
      try {
        const supabaseAdm = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        const { data: admins } = await supabaseAdm
          .from('profiles')
          .select('id')
          .eq('user_type', 'admin');
        if (admins?.length) {
          await supabaseAdm.from('notifications').insert(
            admins.map((a: any) => ({
              user_id: a.id,
              type: 'payment_received',
              title: 'Pagamento sem split (ação necessária)',
              message: `Booking ${booking_id}: pagamento de R$ ${parsedAmount.toFixed(2)} processado sem split — requer repasse manual ao instrutor. Configure o app como Marketplace no MP Developer.`,
              action_url: '/system-admin',
              booking_id,
            }))
          );
        }
      } catch (notifErr) {
        console.error('Erro ao notificar admin sobre fallback:', notifErr);
      }
    }

    // === SALVAR CHARGE ===
    const valueCents = Math.round(parsedAmount * 100);
    const instructorAmount = Math.round((parsedAmount - marketplaceFee) * 100) / 100;

    const refundDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: charge, error: chargeError } = await supabaseAdmin
      .from('payment_charges')
      .insert({
        booking_id,
        student_id: booking.student_id,
        correlation_id: correlationId,
        value_cents: valueCents,
        status: 'awaiting_payment',
        mp_preference_id: mpData.id,
        checkout_url: checkoutUrl,
        collector_id: mpAccount.mp_user_id,
        refund_deadline: refundDeadline,
      })
      .select('id')
      .single();

    if (chargeError) {
      console.error('Erro ao inserir charge:', chargeError);
      return new Response(JSON.stringify({ error: 'Erro ao registrar cobrança', details: chargeError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabaseAdmin
      .from('bookings')
      .update({
        active_charge_id: charge.id,
        payment_status: 'awaiting_payment',
        platform_fee: marketplaceFee,
        instructor_amount: instructorAmount,
      })
      .eq('id', booking_id);

    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl, charge_id: charge.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('Erro em create-mp-checkout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
