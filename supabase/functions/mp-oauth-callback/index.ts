import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // instructor user_id
    const error = url.searchParams.get('error');

    const appDomain = 'https://drive-flex-connect.lovable.app';

    if (error || !code || !state) {
      console.error('OAuth error or missing params:', { error, code: !!code, state: !!state });
      return Response.redirect(`${appDomain}/admin?mp_error=true`, 302);
    }

    // Exchange code for tokens
    const clientId = Deno.env.get('MP_CLIENT_ID');
    const clientSecret = Deno.env.get('MP_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('MP_CLIENT_ID or MP_CLIENT_SECRET not configured');
      return Response.redirect(`${appDomain}/admin?mp_error=true`, 302);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/mp-oauth-callback`;

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', JSON.stringify(tokenData));
      return Response.redirect(`${appDomain}/admin?mp_error=true`, 302);
    }

    // Get user_id from state (this is the auth.users id)
    const userId = state;

    // Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Get instructor_profile id from user_id
    const { data: instructorProfile, error: profileError } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id, is_driving_school')
      .eq('user_id', userId)
      .single();

    if (profileError || !instructorProfile) {
      console.error('Instructor profile not found:', profileError);
      return Response.redirect(`${appDomain}/admin?mp_error=true`, 302);
    }

    // Calculate token expiration
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Upsert into mp_connected_accounts
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

    // Check if record exists
    const idField = instructorProfile.is_driving_school ? 'driving_school_id' : 'instructor_id';
    const { data: existing } = await supabaseAdmin
      .from('mp_connected_accounts')
      .select('id')
      .eq(idField, instructorProfile.id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('mp_connected_accounts')
        .update(upsertData)
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('mp_connected_accounts')
        .insert(upsertData);
    }

    console.log('MP OAuth connected for', idField, instructorProfile.id);
    return Response.redirect(`${appDomain}/admin?mp_connected=true`, 302);
  } catch (err) {
    console.error('mp-oauth-callback error:', err);
    return Response.redirect('https://drive-flex-connect.lovable.app/admin?mp_error=true', 302);
  }
});
