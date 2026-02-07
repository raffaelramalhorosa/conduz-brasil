import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();
    
    if (!email || !code) {
      throw new Error("Email and code are required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Verifying code for email: ${email}`);

    // Find the most recent valid code
    const { data: record, error: fetchError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !record) {
      console.log("No valid code found:", fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Código expirado ou não encontrado. Solicite um novo código." 
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Check attempts limit
    if (record.attempts >= 5) {
      console.log("Too many attempts");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Tentativas esgotadas. Solicite um novo código." 
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Verify code
    if (record.code !== code) {
      console.log("Invalid code provided");
      // Increment attempts
      await supabase
        .from("email_verification_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);

      const remainingAttempts = 4 - record.attempts;
      return new Response(
        JSON.stringify({
          success: false,
          error: "Código inválido.",
          remaining_attempts: remainingAttempts > 0 ? remainingAttempts : 0,
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log("Code verified successfully");

    // Code is correct - mark as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified: true })
      .eq("id", record.id);

    // Confirm email in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      record.user_id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Error confirming user email:", updateError);
      throw updateError;
    }

    console.log("User email confirmed in auth system");

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in verify-email-code:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
