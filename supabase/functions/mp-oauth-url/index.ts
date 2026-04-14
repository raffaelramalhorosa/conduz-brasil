import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Generate PKCE code_verifier (43-128 chars, URL-safe)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate code_challenge from code_verifier (SHA-256, base64url)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    console.log('[mp-oauth-url] Recebido user_id:', user_id);

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
      .from('mp_settings')
      .select('key, value');
    const map: Record<string, string> = {};
    (credRows || []).forEach((row: any) => (map[row.key] = row.value));
    const env = map['mp_environment'] || 'sandbox';
    const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
    const clientId = map[`${prefix}_client_id`];

    console.log(`[mp-oauth-url] ambiente=${env}, prefix=${prefix}, client_id encontrado=${!!clientId}`);

    if (!clientId) {
      console.error('[mp-oauth-url] Client ID não encontrado para prefix:', prefix);
      return new Response(JSON.stringify({ error: 'Client ID não configurado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate PKCE pair
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    console.log('[mp-oauth-url] PKCE gerado. code_verifier length:', codeVerifier.length, 'code_challenge length:', codeChallenge.length);

    // Store code_verifier in DB for the callback to retrieve
    const { error: storeErr } = await supabaseAdmin
      .from('mp_oauth_states')
      .insert({ user_id, code_verifier: codeVerifier });

    if (storeErr) {
      console.error('[mp-oauth-url] Erro ao salvar code_verifier:', storeErr);
      return new Response(JSON.stringify({ error: 'Erro interno ao preparar autenticação' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/mp-oauth-callback`;

    const oauthUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${user_id}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    console.log('[mp-oauth-url] OAuth URL gerada. redirect_uri:', redirectUri);
    console.log('[mp-oauth-url] URL completa (sem secrets):', oauthUrl.replace(clientId, 'REDACTED'));

    return new Response(JSON.stringify({ oauth_url: oauthUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[mp-oauth-url] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
