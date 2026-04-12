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

    const { booking_id, student_id, amount, description } = await req.json();

    if (!booking_id || !student_id || !amount || !description) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: booking_id, student_id, amount, description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'O valor (amount) deve ser um número positivo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

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

    if (booking.student_id !== student_id) {
      return new Response(JSON.stringify({ error: 'Este booking não pertence ao aluno informado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    // === BUSCAR MP_USER_ID DO COLLECTOR (instrutor ou escola) ===
    const mpAccountQuery = supabaseAdmin
      .from('mp_connected_accounts')
      .select('mp_user_id')
      .eq('is_active', true);

    if (booking.is_affiliated_booking && booking.driving_school_id) {
      mpAccountQuery.eq('driving_school_id', booking.driving_school_id);
    } else {
      mpAccountQuery.eq('instructor_id', booking.instructor_id);
    }

    const { data: mpAccount } = await mpAccountQuery.maybeSingle();

    if (!mpAccount?.mp_user_id) {
      const entity = booking.is_affiliated_booking ? 'autoescola' : 'instrutor';
      console.log(`${entity} sem MP conectado:`, booking.instructor_id, booking.driving_school_id);
      return new Response(JSON.stringify({ error: 'instructor_mp_not_connected', message: `O ${entity} não configurou o recebimento via Mercado Pago` }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // collector_id deve ser número inteiro — MP rejeita string silenciosamente
    const collectorId = parseInt((mpAccount.mp_user_id || '').trim(), 10);
    if (isNaN(collectorId)) {
      console.error('mp_user_id inválido (não é número):', mpAccount.mp_user_id);
      return new Response(JSON.stringify({ error: 'mp_user_id_invalid', message: 'ID do Mercado Pago do instrutor é inválido. Reconecte a conta.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === BUSCAR TOKEN DA PLATAFORMA ===
    const creds = await getMpSettings(supabaseAdmin);
    if (!creds.accessToken) {
      return new Response(JSON.stringify({ error: 'Token da plataforma não configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Ambiente:', creds.environment);
    console.log('marketplace app client_id:', creds.clientId);
    console.log('collector_id (instrutor):', collectorId, '(raw string:', mpAccount.mp_user_id, ')');

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
    const { data: studentProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', student_id)
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

    // === MONTAR PAYLOAD MARKETPLACE: split entre plataforma e collector ===
    const preferencePayload: any = {
      items: [{
        title: description || `Aula de direção — ${instructorProfile?.full_name || 'instrutor'}`,
        quantity: 1,
        unit_price: parsedAmount,
        currency_id: 'BRL',
      }],
      marketplace_fee: marketplaceFee,      // Taxa da plataforma (R3D3)
      collector_id: collectorId,            // Instrutor ou escola recebe o restante (inteiro obrigatório)
      ...(creds.clientId ? { marketplace: creds.clientId } : {}), // App ID — vincula ao marketplace checkoutPRO
      external_reference: booking_id,
      back_urls: {
        success: `${appDomain}/pagamento/sucesso?booking_id=${booking_id}`,
        failure: `${appDomain}/pagamento/erro?booking_id=${booking_id}`,
        pending: `${appDomain}/pagamento/pendente?booking_id=${booking_id}`,
      },
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    // Payer apenas em produção — sandbox rejeita emails reais
    if (!creds.isSandbox && studentProfile?.email) {
      preferencePayload.payer = {
        name: studentProfile.full_name || '',
        email: studentProfile.email,
      };
    }

    // === CRIAR PREFERÊNCIA (tenta com split, fallback sem split) ===
    const createPreference = async (payload: any) => {
      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creds.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      return { status: res.status, data: JSON.parse(text) };
    };

    console.log('PAYLOAD:', JSON.stringify(preferencePayload, null, 2));
    console.log('Criando preferência com token da PLATAFORMA (primeiros 20 chars):', creds.accessToken?.slice(0, 20));

    let mpData: any;
    let usedFallback = false;

    const firstAttempt = await createPreference(preferencePayload);
    console.log('Resposta MP status:', firstAttempt.status);
    if (!firstAttempt.status.toString().startsWith('2')) {
      console.log('Erro MP (primeira tentativa):', JSON.stringify(firstAttempt.data));
    }

    if (!firstAttempt.status.toString().startsWith('2') && firstAttempt.data?.error === 'invalid_collector_id') {
      // Marketplace não configurado — fallback: pagamento integral para R3D3
      console.warn('invalid_collector_id — fallback sem split. Instrutor deve ser pago manualmente.');
      usedFallback = true;

      const fallbackPayload = { ...preferencePayload };
      delete fallbackPayload.collector_id;
      delete fallbackPayload.marketplace_fee;

      const secondAttempt = await createPreference(fallbackPayload);
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
        student_id,
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
