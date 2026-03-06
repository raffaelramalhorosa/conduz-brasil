import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getMpCredentials(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data } = await supabaseAdmin
    .from('mp_settings')
    .select('key, value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  const env = map['mp_environment'] || 'sandbox';
  const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
  return {
    environment: env,
    accessToken: map[`${prefix}_access_token`] || null,
    publicKey: map[`${prefix}_public_key`] || null,
    clientId: map[`${prefix}_client_id`] || null,
    clientSecret: map[`${prefix}_client_secret`] || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { booking_id, student_id, amount, description } = await req.json();

    if (!booking_id || !student_id || !amount || !description) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: booking_id, student_id, amount, description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
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

    // Verify booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, total_price, status')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (booking.student_id !== student_id) {
      return new Response(
        JSON.stringify({ error: 'Este booking não pertence ao aluno informado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const correlationId = `cb_${booking_id}_${Date.now()}`;

    // Get MP credentials from DB
    const creds = await getMpCredentials(supabaseAdmin);
    if (!creds.accessToken) {
      console.error('MP access token not configured in mp_credentials for environment:', creds.environment);
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado no servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const appDomain = 'https://drive-flex-connect.lovable.app';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const preferencePayload = {
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
        },
      ],
      external_reference: booking_id,
      back_urls: {
        success: `${appDomain}/pagamento/sucesso?booking_id=${booking_id}`,
        failure: `${appDomain}/pagamento/erro?booking_id=${booking_id}`,
        pending: `${appDomain}/pagamento/pendente?booking_id=${booking_id}`,
      },
      auto_return: 'approved',
      notification_url: webhookUrl,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro ao criar preferência no MP:', JSON.stringify(mpData));
      return new Response(
        JSON.stringify({
          error: 'Erro ao criar checkout no Mercado Pago',
          details: mpData.message || mpData,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const checkoutUrl = creds.environment === 'production'
      ? mpData.init_point
      : (mpData.sandbox_init_point || mpData.init_point);
    const mpPreferenceId = mpData.id;

    if (!checkoutUrl) {
      console.error('MP não retornou init_point:', JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não retornou URL de checkout' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const valueCents = Math.round(amount * 100);

    const { data: charge, error: chargeError } = await supabaseAdmin
      .from('payment_charges')
      .insert({
        booking_id,
        student_id,
        correlation_id: correlationId,
        value_cents: valueCents,
        status: 'awaiting_payment',
        mp_preference_id: mpPreferenceId,
        checkout_url: checkoutUrl,
      })
      .select('id')
      .single();

    if (chargeError) {
      console.error('Erro ao inserir payment_charge:', chargeError);
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar cobrança no banco de dados', details: chargeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    await supabaseAdmin
      .from('bookings')
      .update({
        active_charge_id: charge.id,
        payment_status: 'awaiting_payment',
      })
      .eq('id', booking_id);

    return new Response(
      JSON.stringify({
        checkout_url: checkoutUrl,
        charge_id: charge.id,
      }),
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
