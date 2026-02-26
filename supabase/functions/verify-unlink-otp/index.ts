import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data?.user) throw new Error('Não autorizado');

    const user = data.user;
    const { code } = await req.json();

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabaseClient
      .from('otp_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('purpose', 'unlink_school')
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: 'Código inválido ou expirado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark OTP as used
    await supabaseClient
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Unlink instructor from driving school
    const { error: unlinkError } = await supabaseClient
      .from('driving_school_instructors')
      .update({
        status: 'removed',
        is_account_linked: false,
        linked_user_id: null,
      })
      .eq('linked_user_id', user.id)
      .eq('status', 'active');

    if (unlinkError) throw unlinkError;

    // Send notification to the driving school
    try {
      const { data: dsi } = await supabaseClient
        .from('driving_school_instructors')
        .select('driving_school_id, name')
        .eq('linked_user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (dsi) {
        const { data: schoolProfile } = await supabaseClient
          .from('instructor_profiles')
          .select('user_id')
          .eq('id', dsi.driving_school_id)
          .single();

        if (schoolProfile) {
          await supabaseClient.from('notifications').insert({
            user_id: schoolProfile.user_id,
            type: 'instructor_unlinked',
            title: 'Instrutor desvinculado',
            message: `O instrutor ${dsi.name || 'Um instrutor'} se desvinculou da sua autoescola.`,
            action_url: '/admin/instrutores',
          });
        }
      }
    } catch (e) {
      console.error('Failed to notify school:', e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
