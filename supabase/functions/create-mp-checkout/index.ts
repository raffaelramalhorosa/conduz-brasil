import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getMpSettings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseAdmin
    .from('mp_settings')
    .select('key, value');

  if (error) console.log('Erro da query mp_settings:', JSON.stringify(error));

  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  return map;
}

function getCredentials(map: Record<string, string>) {
  const env = map['mp_environment'] || 'sandbox';
  const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
  const tokenKey = `${prefix}_access_token`;
  const accessToken = map[tokenKey] || null;
  const platformUserIdKey = env === 'production' ? 'mp_platform_user_id_prod' : 'mp_platform_user_id_sandbox';

  return {
    environment: env,
    accessToken,
    publicKey: map[`${prefix}_public_key`] || null,
    clientId: map[`${prefix}_client_id`] || null,
    clientSecret: map[`${prefix}_client_secret`] || null,
    platformUserId: map[platformUserIdKey] || null,
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
      .select('id, student_id, total_price, status, instructor_id')
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

    // === DUPLICATE PAYMENT PROTECTION ===
    const { data: existingCharges } = await supabaseAdmin
      .from('payment_charges')
      .select('id, status')
      .eq('booking_id', booking_id)
      .in('status', ['approved', 'in_process', 'pending', 'awaiting_payment']);

    if (existingCharges && existingCharges.length > 0) {
      console.log('Duplicate payment blocked for booking:', booking_id);
      return new Response(
        JSON.stringify({ error: 'already_paid', message: 'Esta aula já possui um pagamento em andamento ou aprovado' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // === INSTRUCTOR MP CONNECTION CHECK ===
    const { data: instructorProfile } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id, is_driving_school')
      .eq('id', booking.instructor_id)
      .single();

    let instructorMpUserId: string | null = null;

    if (instructorProfile) {
      const mpField = instructorProfile.is_driving_school ? 'driving_school_id' : 'instructor_id';
      const { data: mpAccount } = await supabaseAdmin
        .from('mp_connected_accounts')
        .select('id, mp_user_id')
        .eq(mpField, instructorProfile.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!mpAccount) {
        console.log('Instructor MP not connected for booking:', booking_id);
        return new Response(
          JSON.stringify({
            error: 'instructor_mp_not_connected',
            message: 'O instrutor ainda não configurou o recebimento via Mercado Pago',
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      instructorMpUserId = mpAccount.mp_user_id;
    }

    // Get MP settings
    const settingsMap = await getMpSettings(supabaseAdmin);
    const creds = getCredentials(settingsMap);

    if (!creds.accessToken) {
      console.error('MP access token not configured for environment:', creds.environment);
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado no servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // === PLATFORM USER ID CHECK ===
    if (!creds.platformUserId) {
      console.error('Platform MP User ID not configured for environment:', creds.environment);
      return new Response(
        JSON.stringify({ error: 'platform_mp_account_not_configured', message: 'User ID da plataforma não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // === GET PLATFORM FEE PERCENTAGE ===
    const { data: platformSettings } = await supabaseAdmin
      .from('platform_settings')
      .select('platform_fee_percentage, platform_fee_fixed, fee_type')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let marketplaceFee = 0;
    if (platformSettings) {
      const { fee_type, platform_fee_percentage, platform_fee_fixed } = platformSettings;
      if (fee_type === 'percentage' || fee_type === 'both') {
        marketplaceFee += amount * (platform_fee_percentage / 100);
      }
      if (fee_type === 'fixed' || fee_type === 'both') {
        marketplaceFee += platform_fee_fixed;
      }
      marketplaceFee = Math.round(marketplaceFee * 100) / 100;
    }

    const correlationId = `cb_${booking_id}_${Date.now()}`;
    const appDomain = Deno.env.get('APP_URL') ?? 'https://conduzbrasil.com';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const preferencePayload: any = {
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
      marketplace_fee: marketplaceFee,
    };

    // Add collector (instructor's MP user ID) for split payment
    if (instructorMpUserId) {
      preferencePayload.collector_id = Number(instructorMpUserId);
    }

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
    const instructorAmount = Math.round((amount - marketplaceFee) * 100) / 100;

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
        platform_fee: marketplaceFee,
        instructor_amount: instructorAmount,
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
