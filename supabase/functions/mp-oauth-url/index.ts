import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Get MP credentials from DB
    const { data: credRows } = await supabaseAdmin
      .from('mp_credentials')
      .select('key, value');
    const map: Record<string, string> = {};
    (credRows || []).forEach((row: any) => (map[row.key] = row.value));
    const env = map['mp_environment'] || 'sandbox';
    const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
    const clientId = map[`${prefix}_client_id`];

    console.log(`mp-oauth-url: ambiente=${env}, client_id encontrado=${!!clientId}`);

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Client ID não configurado. Configure nas Configurações de Pagamento no painel admin.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/mp-oauth-callback`;

    const oauthUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${user_id}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new Response(JSON.stringify({ oauth_url: oauthUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('mp-oauth-url error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
