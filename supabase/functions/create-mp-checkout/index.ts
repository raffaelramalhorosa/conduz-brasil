import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getMpSettings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseAdmin.from("mp_settings").select("key, value");
  if (error) console.log("Erro da query mp_settings:", JSON.stringify(error));
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  return map;
}

function getCredentials(map: Record<string, string>) {
  const env = map["mp_environment"] || "sandbox";
  const prefix = env === "production" ? "mp_prod" : "mp_sandbox";
  return {
    environment: env,
    accessToken: map[`${prefix}_access_token`] || null,
    publicKey: map[`${prefix}_public_key`] || null,
    clientId: map[`${prefix}_client_id`] || null,
    clientSecret: map[`${prefix}_client_secret`] || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { booking_id, student_id, amount, description } = await req.json();

    if (!booking_id || !student_id || !amount || !description) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: booking_id, student_id, amount, description" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new Response(JSON.stringify({ error: "O valor (amount) deve ser um número positivo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // === VERIFICAR BOOKING ===
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, student_id, total_price, status, instructor_id")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.student_id !== student_id) {
      return new Response(JSON.stringify({ error: "Este booking não pertence ao aluno informado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === VALIDAR STATUS DO BOOKING ===
    const validStatuses = ["confirmed", "accepted", "pending_payment", "awaiting_payment"];
    if (!validStatuses.includes(booking.status)) {
      console.log("BLOQUEIO: Status inválido para pagamento", { status: booking.status });
      return new Response(
        JSON.stringify({
          error: "invalid_booking_status",
          message: `Booking com status '${booking.status}' não pode ser pago`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === PROTEÇÃO CONTRA PAGAMENTO DUPLICADO ===
    const { data: existingCharges } = await supabaseAdmin
      .from("payment_charges")
      .select("id, status")
      .eq("booking_id", booking_id)
      .in("status", ["approved", "in_process"]);

    if (existingCharges && existingCharges.length > 0) {
      console.log("Pagamento duplicado bloqueado para booking:", booking_id);
      return new Response(
        JSON.stringify({ error: "already_paid", message: "Esta aula já possui um pagamento em andamento ou aprovado" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === BUSCAR CONTA MP DO INSTRUTOR ===
    const { data: mpAccount } = await supabaseAdmin
      .from("mp_connected_accounts")
      .select("id, mp_user_id, mp_access_token")
      .eq("instructor_id", booking.instructor_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!mpAccount || !mpAccount.mp_access_token) {
      console.log("Instrutor sem MP conectado:", booking.instructor_id);
      return new Response(
        JSON.stringify({
          error: "instructor_mp_not_connected",
          message: "O instrutor ainda não configurou o recebimento via Mercado Pago",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === BUSCAR DADOS DO ALUNO ===
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", student_id)
      .single();

    console.log("Dados do aluno:", studentProfile?.full_name, studentProfile?.email);

    // === BUSCAR CONFIGURAÇÕES MP ===
    const settingsMap = await getMpSettings(supabaseAdmin);
    const creds = getCredentials(settingsMap);
    const isSandbox = creds.environment !== "production";

    console.log("Ambiente MP:", creds.environment);

    if (!creds.accessToken) {
      return new Response(JSON.stringify({ error: "Token do Mercado Pago não configurado no servidor" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CALCULAR TAXA DA PLATAFORMA ===
    const { data: platformSettings } = await supabaseAdmin
      .from("platform_settings")
      .select("platform_fee_percentage, platform_fee_fixed, fee_type")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let marketplaceFee = 0;
    if (platformSettings) {
      const { fee_type, platform_fee_percentage, platform_fee_fixed } = platformSettings;
      if (fee_type === "percentage" || fee_type === "both") {
        marketplaceFee += parsedAmount * ((platform_fee_percentage || 0) / 100);
      }
      if (fee_type === "fixed" || fee_type === "both") {
        marketplaceFee += platform_fee_fixed || 0;
      }
      marketplaceFee = Math.round(marketplaceFee * 100) / 100;
    }

    console.log("Taxa calculada:", { parsedAmount, marketplaceFee });

    const appDomain = Deno.env.get("APP_URL") ?? "https://conduzbrasil.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const correlationId = `cb_${booking_id}_${Date.now()}`;

    // === MONTAR PAYLOAD ===
    const preferencePayload: any = {
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: parsedAmount,
          currency_id: "BRL",
        },
      ],
      external_reference: booking_id,
      back_urls: {
        success: `${appDomain}/pagamento/sucesso?booking_id=${booking_id}`,
        failure: `${appDomain}/pagamento/erro?booking_id=${booking_id}`,
        pending: `${appDomain}/pagamento/pendente?booking_id=${booking_id}`,
      },
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      marketplace: "conduzbrasil",
      marketplace_fee: parseFloat(marketplaceFee.toFixed(2)),
    };

    // Payer apenas em produção — sandbox rejeita emails de contas reais
    if (!isSandbox && studentProfile?.email) {
      preferencePayload.payer = {
        name: studentProfile.full_name || "",
        email: studentProfile.email,
      };
    }

    console.log("PAYLOAD COMPLETO:", JSON.stringify(preferencePayload, null, 2));
    console.log("Usando token do instrutor:", mpAccount.mp_user_id);

    // === CRIAR PREFERÊNCIA NO MP ===
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccount.mp_access_token}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    const responseText = await mpResponse.text();
    console.log("Resposta MP status:", mpResponse.status);
    console.log("RESPOSTA MP:", responseText);

    const mpData = JSON.parse(responseText);

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar checkout no Mercado Pago", details: mpData.message || mpData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const checkoutUrl = isSandbox ? mpData.sandbox_init_point || mpData.init_point : mpData.init_point;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: "Mercado Pago não retornou URL de checkout" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SALVAR CHARGE NO BANCO ===
    const valueCents = Math.round(parsedAmount * 100);
    const instructorAmount = Math.round((parsedAmount - marketplaceFee) * 100) / 100;

    const { data: charge, error: chargeError } = await supabaseAdmin
      .from("payment_charges")
      .insert({
        booking_id,
        student_id,
        correlation_id: correlationId,
        value_cents: valueCents,
        status: "awaiting_payment",
        mp_preference_id: mpData.id,
        checkout_url: checkoutUrl,
      })
      .select("id")
      .single();

    if (chargeError) {
      console.error("Erro ao inserir payment_charge:", chargeError);
      return new Response(
        JSON.stringify({ error: "Erro ao registrar cobrança no banco", details: chargeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabaseAdmin
      .from("bookings")
      .update({
        active_charge_id: charge.id,
        payment_status: "awaiting_payment",
        platform_fee: marketplaceFee,
        instructor_amount: instructorAmount,
      })
      .eq("id", booking_id);

    return new Response(JSON.stringify({ checkout_url: checkoutUrl, charge_id: charge.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro em create-mp-checkout:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
