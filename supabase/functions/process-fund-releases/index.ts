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

    let totalReleases = 0;
    let totalCents = 0;
    const BATCH_SIZE = 500;

    while (true) {
      const { data, error } = await supabase.rpc('process_fund_releases', { p_batch_size: BATCH_SIZE });

      if (error) {
        console.error('Error calling process_fund_releases:', error);
        throw error;
      }

      const result = data as { released_count: number; total_amount_cents: number } | null;
      const releasedCount = result?.released_count ?? 0;
      const amountCents = result?.total_amount_cents ?? 0;

      totalReleases += releasedCount;
      totalCents += amountCents;

      console.log(`Batch processed: ${releasedCount} releases, ${amountCents} cents`);

      if (releasedCount < BATCH_SIZE) break;
    }

    const totalBrl = totalCents / 100;
    console.log(`Fund releases complete: ${totalReleases} releases, R$ ${totalBrl.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        total_releases: totalReleases,
        total_brl: totalBrl,
        processed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in process-fund-releases:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
