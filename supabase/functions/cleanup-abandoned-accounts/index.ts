import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting cleanup of abandoned accounts...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find instructor profiles older than 24 hours with incomplete onboarding
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: abandonedProfiles, error: fetchError } = await supabaseAdmin
      .from('instructor_profiles')
      .select('user_id')
      .eq('onboarding_completed', false)
      .lt('created_at', cutoffTime);

    if (fetchError) {
      console.error('Error fetching abandoned profiles:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${abandonedProfiles?.length || 0} abandoned accounts to clean up`);

    let deletedCount = 0;
    const errors: string[] = [];

    if (abandonedProfiles && abandonedProfiles.length > 0) {
      for (const profile of abandonedProfiles) {
        try {
          // Delete the user from auth.users (this will cascade delete related data)
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            profile.user_id
          );

          if (deleteError) {
            console.error(`Error deleting user ${profile.user_id}:`, deleteError);
            errors.push(`Failed to delete user ${profile.user_id}: ${deleteError.message}`);
          } else {
            deletedCount++;
            console.log(`Successfully deleted abandoned user: ${profile.user_id}`);
          }
        } catch (err) {
          console.error(`Exception deleting user ${profile.user_id}:`, err);
          errors.push(`Exception deleting user ${profile.user_id}: ${String(err)}`);
        }
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} accounts.`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount,
        found_count: abandonedProfiles?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cleanup-abandoned-accounts:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
