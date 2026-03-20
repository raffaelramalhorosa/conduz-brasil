import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_OWNER_ID = '00000000-0000-0000-0000-000000000001';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, mp_payment_id, transaction_amount } = await req.json();

    if (!booking_id || !mp_payment_id || !transaction_amount) {
      return new Response(
        JSON.stringify({ error: 'booking_id, mp_payment_id e transaction_amount são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // --- Idempotency check ---
    const idempKeyInstructor = `dist_instructor_${booking_id}`;
    const { data: existing } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('idempotency_key', idempKeyInstructor)
      .maybeSingle();

    if (existing) {
      console.log('Distribution already processed for booking:', booking_id);
      return new Response(
        JSON.stringify({ success: true, already_processed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 1. Fetch booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('instructor_id, driving_school_id, is_affiliated_booking, school_fee_rate, school_fee_type, total_price, instructor_amount')
      .eq('id', booking_id)
      .single();

    if (bookingErr || !booking) {
      console.error('Booking not found:', booking_id, bookingErr);
      return new Response(
        JSON.stringify({ error: 'Booking não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Fetch platform fee settings
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('platform_fee_percentage, fee_type')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const platformFeePercent = platformSettings?.platform_fee_percentage ?? 7;

    // 3. Calculate distribution in CENTS
    const gross_cents = Math.round(transaction_amount * 100);
    const platform_fee_cents = Math.floor(gross_cents * platformFeePercent / 100);

    const schoolFeeRate = booking.school_fee_rate ?? 0;
    const school_commission_cents = booking.is_affiliated_booking
      ? Math.floor(gross_cents * schoolFeeRate / 100)
      : 0;

    const instructor_cents = gross_cents - platform_fee_cents - school_commission_cents;

    console.log('Distribution:', {
      booking_id,
      gross_cents,
      platform_fee_cents,
      school_commission_cents,
      instructor_cents,
      is_affiliated: booking.is_affiliated_booking,
    });

    // Invariant check
    if (platform_fee_cents + school_commission_cents + instructor_cents !== gross_cents) {
      console.error('INVARIANT VIOLATED: sum != gross', {
        platform_fee_cents,
        school_commission_cents,
        instructor_cents,
        gross_cents,
      });
      return new Response(
        JSON.stringify({ error: 'Erro de cálculo na distribuição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Upsert wallet_balances and create transactions

    // --- INSTRUCTOR ---
    const instructorWallet = await upsertWallet(supabase, booking.instructor_id, 'instructor', instructor_cents, 'pending');
    await supabase.from('wallet_transactions').insert({
      wallet_id: instructorWallet.id,
      type: 'booking_credit',
      amount_cents: instructor_cents,
      available_balance_after: instructorWallet.available_balance,
      pending_balance_after: instructorWallet.pending_balance,
      reference_type: 'booking',
      reference_id: booking_id,
      description: `Crédito aula — pagamento ${mp_payment_id}`,
      idempotency_key: idempKeyInstructor,
      metadata: { mp_payment_id, gross_cents },
    });

    // Fund release for instructor (30 days)
    const { data: instrTx } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('idempotency_key', idempKeyInstructor)
      .single();

    if (instrTx) {
      await supabase.from('fund_releases').insert({
        wallet_id: instructorWallet.id,
        booking_id,
        source_transaction_id: instrTx.id,
        amount_cents: instructor_cents,
        release_date: getReleaseDateSQL(),
        status: 'scheduled',
      });
    }

    // --- SCHOOL (if affiliated) ---
    if (booking.is_affiliated_booking && booking.driving_school_id && school_commission_cents > 0) {
      const idempKeySchool = `dist_school_${booking_id}`;
      const schoolWallet = await upsertWallet(supabase, booking.driving_school_id, 'school', school_commission_cents, 'pending');

      await supabase.from('wallet_transactions').insert({
        wallet_id: schoolWallet.id,
        type: 'school_commission',
        amount_cents: school_commission_cents,
        available_balance_after: schoolWallet.available_balance,
        pending_balance_after: schoolWallet.pending_balance,
        reference_type: 'booking',
        reference_id: booking_id,
        description: `Comissão autoescola — pagamento ${mp_payment_id}`,
        idempotency_key: idempKeySchool,
        metadata: { mp_payment_id, gross_cents },
      });

      const { data: schoolTx } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('idempotency_key', idempKeySchool)
        .single();

      if (schoolTx) {
        await supabase.from('fund_releases').insert({
          wallet_id: schoolWallet.id,
          booking_id,
          source_transaction_id: schoolTx.id,
          amount_cents: school_commission_cents,
          release_date: getReleaseDateSQL(),
          status: 'scheduled',
        });
      }
    }

    // --- PLATFORM ---
    const idempKeyPlatform = `dist_platform_${booking_id}`;
    const platformWallet = await upsertWallet(supabase, PLATFORM_OWNER_ID, 'platform', platform_fee_cents, 'available');

    await supabase.from('wallet_transactions').insert({
      wallet_id: platformWallet.id,
      type: 'platform_fee',
      amount_cents: platform_fee_cents,
      available_balance_after: platformWallet.available_balance,
      pending_balance_after: platformWallet.pending_balance,
      reference_type: 'booking',
      reference_id: booking_id,
      description: `Taxa plataforma — pagamento ${mp_payment_id}`,
      idempotency_key: idempKeyPlatform,
      metadata: { mp_payment_id, gross_cents },
    });

    console.log('Distribution complete for booking:', booking_id);

    return new Response(
      JSON.stringify({
        success: true,
        gross_cents,
        platform_fee_cents,
        school_commission_cents,
        instructor_cents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in distribute-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

/**
 * Upsert wallet_balances and return the updated row.
 * balanceType: 'pending' adds to pending_balance, 'available' adds to available_balance.
 */
async function upsertWallet(
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
  ownerType: string,
  amountCents: number,
  balanceType: 'pending' | 'available',
) {
  // Try to get existing wallet
  const { data: existing } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('owner_type', ownerType)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = {
      total_earned: existing.total_earned + amountCents,
      version: existing.version + 1,
      updated_at: new Date().toISOString(),
    };

    if (balanceType === 'pending') {
      updates.pending_balance = existing.pending_balance + amountCents;
    } else {
      updates.available_balance = existing.available_balance + amountCents;
    }

    const { data: updated, error } = await supabase
      .from('wallet_balances')
      .update(updates)
      .eq('id', existing.id)
      .eq('version', existing.version) // optimistic lock
      .select('*')
      .single();

    if (error) {
      console.error('Error updating wallet:', error);
      throw new Error(`Failed to update wallet for ${ownerType}:${ownerId}`);
    }

    return updated;
  }

  // Insert new wallet
  const insertData: Record<string, unknown> = {
    owner_id: ownerId,
    owner_type: ownerType,
    available_balance: balanceType === 'available' ? amountCents : 0,
    pending_balance: balanceType === 'pending' ? amountCents : 0,
    total_earned: amountCents,
    total_withdrawn: 0,
    version: 1,
  };

  const { data: created, error } = await supabase
    .from('wallet_balances')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating wallet:', error);
    throw new Error(`Failed to create wallet for ${ownerType}:${ownerId}`);
  }

  return created;
}

function getReleaseDateSQL(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
