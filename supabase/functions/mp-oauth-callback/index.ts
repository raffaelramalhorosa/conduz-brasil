import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('[mp-oauth-callback] Params recebidos:', { code: !!code, state: !!state, error });

    const appDomain = Deno.env.get('APP_URL') ?? 'https://conduzbrasil.com';

    if (error || !code || !state) {
      console.error('[mp-oauth-callback] OAuth error ou params faltando:', { error, code: !!code, state: !!state });
      return Response.redirect(`${appDomain}/admin?mp_error=oauth_denied`, 302);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Retrieve code_verifier from DB
    const userId = state;
    const { data: oauthState, error: stateErr } = await supabaseAdmin
      .from('mp_oauth_states')
      .select('id, code_verifier')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[mp-oauth-callback] OAuth state encontrado:', !!oauthState, 'erro:', stateErr?.message);

    if (!oauthState?.code_verifier) {
      console.error('[mp-oauth-callback] code_verifier não encontrado para user_id:', userId);
      return Response.redirect(`${appDomain}/admin?mp_error=missing_code_verifier`, 302);
    }

    // Mark as used
    await supabaseAdmin
      .from('mp_oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id);

    // Get MP credentials from DB
    const creds = await getMpCredentials(supabaseAdmin);
    console.log('[mp-oauth-callback] Credenciais:', {
      env: creds.environment,
      hasClientId: !!creds.clientId,
      hasClientSecret: !!creds.clientSecret,
      clientIdFirst6: creds.clientId?.slice(0, 6),
    });

    if (!creds.clientId || !creds.clientSecret) {
      console.error('[mp-oauth-callback] MP client_id ou client_secret não configurados');
      return Response.redirect(`${appDomain}/admin?mp_error=missing_credentials`, 302);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/mp-oauth-callback`;

    console.log('[mp-oauth-callback] Trocando code por token...');
    console.log('[mp-oauth-callback] redirect_uri:', redirectUri);
    console.log('[mp-oauth-callback] code_verifier length:', oauthState.code_verifier.length);

    const tokenBody = {
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: oauthState.code_verifier,
    };

    console.log('[mp-oauth-callback] Token request body keys:', Object.keys(tokenBody));

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenBody),
    });

    const responseText = await tokenResponse.text();
    console.log('[mp-oauth-callback] OAuth response status:', tokenResponse.status);
    console.log('[mp-oauth-callback] OAuth response:', responseText);
    const tokenData = JSON.parse(responseText);

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[mp-oauth-callback] Token exchange failed:', responseText);
      const mpErrCode = tokenData?.error || 'token_exchange_failed';
      return Response.redirect(`${appDomain}/admin?mp_error=${encodeURIComponent(mpErrCode)}`, 302);
    }

    if (!tokenData.user_id) {
      console.error('[mp-oauth-callback] MP user_id ausente na resposta');
      return Response.redirect(`${appDomain}/admin?mp_error=missing_user_id`, 302);
    }

    console.log('[mp-oauth-callback] Token obtido com sucesso! MP user_id:', tokenData.user_id);

    const { data: instructorProfile, error: profileError } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id, is_driving_school')
      .eq('user_id', userId)
      .single();

    if (profileError || !instructorProfile) {
      console.error('[mp-oauth-callback] Perfil não encontrado para user_id:', userId, profileError);
      return Response.redirect(`${appDomain}/admin?mp_error=profile_not_found`, 302);
    }

    console.log('[mp-oauth-callback] Perfil encontrado:', {
      id: instructorProfile.id,
      is_driving_school: instructorProfile.is_driving_school,
    });

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const upsertData: Record<string, any> = {
      mp_user_id: String(tokenData.user_id),
      mp_access_token: tokenData.access_token,
      mp_refresh_token: tokenData.refresh_token || null,
      mp_public_key: tokenData.public_key || null,
      mp_email: tokenData.email || null,
      is_active: true,
      connected_at: new Date().toISOString(),
      disconnected_at: null,
      token_expires_at: expiresAt,
      last_refreshed_at: new Date().toISOString(),
    };

    if (instructorProfile.is_driving_school) {
      upsertData.driving_school_id = instructorProfile.id;
    } else {
      upsertData.instructor_id = instructorProfile.id;
    }

    const idField = instructorProfile.is_driving_school ? 'driving_school_id' : 'instructor_id';
    const { data: existing } = await supabaseAdmin
      .from('mp_connected_accounts')
      .select('id')
      .eq(idField, instructorProfile.id)
      .maybeSingle();

    if (existing) {
      console.log('[mp-oauth-callback] Atualizando conta existente:', existing.id);
      await supabaseAdmin.from('mp_connected_accounts').update(upsertData).eq('id', existing.id);
    } else {
      console.log('[mp-oauth-callback] Inserindo nova conta MP');
      await supabaseAdmin.from('mp_connected_accounts').insert(upsertData);
    }

    console.log('[mp-oauth-callback] ✅ Conexão MP salva com sucesso para', idField, instructorProfile.id);
    return Response.redirect(`${appDomain}/admin?mp_connected=true`, 302);
  } catch (err) {
    console.error('[mp-oauth-callback] Erro inesperado:', err);
    const appDomain = Deno.env.get('APP_URL') ?? 'https://conduzbrasil.com';
    return Response.redirect(`${appDomain}/admin?mp_error=internal_error`, 302);
  }
});
