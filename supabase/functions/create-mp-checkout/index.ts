import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function iniciada')

    // Cliente autenticado com JWT do usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Cliente admin (ignora RLS) — apenas para leituras internas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { booking_id } = await req.json()
    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'booking_id obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.log('BLOQUEIO: Booking não encontrado', { booking_id })
      return new Response(JSON.stringify({ error: 'Booking não encontrado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar status do booking
    if (booking.status !== 'accepted') {
      console.log('BLOQUEIO: Booking não está aceito', { status: booking.status })
      return new Response(JSON.stringify({ error: 'Booking não está aceito pelo instrutor' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar pagamento duplicado
    const { data: existingCharge } = await supabaseAdmin
      .from('payment_charges')
      .select('id, status')
      .eq('booking_id', booking_id)
      .in('status', ['approved', 'in_process'])
      .maybeSingle()

    if (existingCharge) {
      console.log('BLOQUEIO: Pagamento já existe', { status: existingCharge.status })
      return new Response(JSON.stringify({ error: 'Pagamento já existe para este booking' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar conta MP do instrutor
    const { data: mpAccount } = await supabaseAdmin
      .from('mp_connected_accounts')
      .select('mp_access_token, mp_user_id')
      .eq('user_id', booking.instructor_id)
      .maybeSingle()

    if (!mpAccount?.mp_access_token) {
      console.log('BLOQUEIO: Instrutor sem MP conectado', { instructor_id: booking.instructor_id })
      return new Response(JSON.stringify({ error: 'instructor_mp_not_connected' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar ambiente MP (sandbox ou produção)
    const { data: envSetting } = await supabaseAdmin
      .from('mp_settings')
      .select('value')
      .eq('key', 'mp_environment')
      .single()

    const isSandbox = envSetting?.value === 'sandbox'
    console.log('Ambiente MP:', isSandbox ? 'sandbox' : 'produção')

    // Buscar taxa da plataforma
    const { data: feeSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_fee_percentage')
      .maybeSingle()

    const platformFeePercent = parseFloat(feeSetting?.value || '7')
    const bookingPrice = booking.price || (booking.value_cents / 100)
    const marketplaceFee = Math.round(bookingPrice * (platformFeePercent / 100) * 100) / 100

    console.log('Taxa calculada:', { bookingPrice, platformFeePercent, marketplaceFee })

    // Buscar perfil do aluno (com admin para ignorar RLS)
    const { data: studentProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.student_id)
      .single()

    console.log('Payer email:', studentProfile?.email)

    // Buscar nome do instrutor
    const { data: instructorProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', booking.instructor_id)
      .single()

    // Montar payload
    const payload: Record<string, unknown> = {
      items: [{
        title: `Aula de direção — ${instructorProfile?.full_name?.toLowerCase() || 'instrutor'}`,
        quantity: 1,
        unit_price: bookingPrice,
        currency_id: 'BRL',
      }],
      external_reference: booking_id,
      back_urls: {
        success: `https://conduzbrasil.com/pagamento/sucesso?booking_id=${booking_id}`,
        failure: `https://conduzbrasil.com/pagamento/erro?booking_id=${booking_id}`,
        pending: `https://conduzbrasil.com/pagamento/pendente?booking_id=${booking_id}`,
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      marketplace: 'conduzbrasil',
      marketplace_fee: marketplaceFee,
    }

    // Payer apenas em produção (sandbox rejeita emails reais)
    if (!isSandbox && studentProfile?.email) {
      payload.payer = {
        name: studentProfile.full_name || '',
        email: studentProfile.email,
      }
    }

    console.log('PAYLOAD COMPLETO:', JSON.stringify(payload, null, 2))
    console.log('Usando token do instrutor para criar preferência')

    // Criar preferência no MP usando token do instrutor
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccount.mp_access_token}`,
      },
      body: JSON.stringify(payload),
    })

    const mpData = await mpResponse.json()
    console.log('Resposta MP status:', mpResponse.status)
    console.log('RESPOSTA MP:', JSON.stringify(mpData))

    if (!mpResponse.ok) {
      console.log('Erro MP:', JSON.stringify(mpData))
      return new Response(JSON.stringify({ error: 'Erro ao criar preferência MP', details: mpData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // URL correta para sandbox vs produção
    const checkoutUrl = isSandbox ? mpData.sandbox_init_point : mpData.init_point

    // Salvar/atualizar charge no banco
    const chargeValue = Math.round(bookingPrice * 100)
    const instructorAmount = chargeValue - Math.round(marketplaceFee * 100)

    await supabaseAdmin
      .from('payment_charges')
      .upsert({
        booking_id,
        student_id: booking.student_id,
        instructor_id: booking.instructor_id,
        value_cents: chargeValue,
        platform_fee_cents: Math.round(marketplaceFee * 100),
        instructor_amount_cents: instructorAmount,
        status: 'pending',
        checkout_url: checkoutUrl,
        mp_preference_id: mpData.id,
      }, { onConflict: 'booking_id' })

    return new Response(JSON.stringify({ checkout_url: checkoutUrl, preference_id: mpData.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.log('Erro em create-mp-checkout:', error.message, error.stack)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})