import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Fetch MP client credentials from mp_settings
    const { data: settings } = await supabase.from('mp_settings').select('key, value');
    const map: Record<string, string> = {};
    (settings || []).forEach((row: any) => (map[row.key] = row.value));

    const env = map['mp_environment'] || 'sandbox';
    const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
    const clientId = map[`${prefix}_client_id`];
    const clientSecret = map[`${prefix}_client_secret`];

    if (!clientId || !clientSecret) {
      console.error('MP client_id or client_secret not configured for env:', env);
      return new Response(
        JSON.stringify({ error: 'Credenciais MP (client_id/client_secret) não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch accounts expiring within 15 days
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    const { data: accounts, error: fetchErr } = await supabase
      .from('mp_connected_accounts')
      .select('id, mp_refresh_token, mp_user_id, token_expires_at')
      .eq('is_active', true)
      .lt('token_expires_at', fifteenDaysFromNow.toISOString());

    if (fetchErr) {
      console.error('Error fetching accounts:', fetchErr);
      throw fetchErr;
    }

    const totalChecked = accounts?.length ?? 0;
    let totalRenewed = 0;
    let totalFailed = 0;

    console.log(`Found ${totalChecked} accounts to refresh`);

    for (const account of accounts || []) {
      try {
        if (!account.mp_refresh_token) {
          console.warn(`Account ${account.id} has no refresh_token, skipping`);
          totalFailed++;
          continue;
        }

        const mpRes = await fetch('https://api.mercadopago.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: account.mp_refresh_token,
          }),
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
          console.error(`Failed to refresh account ${account.id} (mp_user_id: ${account.mp_user_id}):`, JSON.stringify(mpData));
          totalFailed++;
          continue;
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 180);

        await supabase
          .from('mp_connected_accounts')
          .update({
            mp_access_token: mpData.access_token,
            mp_refresh_token: mpData.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            last_refreshed_at: new Date().toISOString(),
          })
          .eq('id', account.id);

        console.log(`Renewed account ${account.id} (mp_user_id: ${account.mp_user_id})`);
        totalRenewed++;
      } catch (err) {
        console.error(`Error refreshing account ${account.id}:`, err);
        totalFailed++;
      }
    }

    console.log(`Refresh complete: ${totalRenewed} renewed, ${totalFailed} failed out of ${totalChecked}`);

    return new Response(
      JSON.stringify({
        success: true,
        total_checked: totalChecked,
        total_renewed: totalRenewed,
        total_failed: totalFailed,
        processed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in refresh-oauth-tokens:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
