import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendVerificationRequest {
  email: string;
  userId: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, userName }: SendVerificationRequest = await req.json();
    
    if (!email || !userId) {
      throw new Error("Email and userId are required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any previous codes for this email
    await supabase
      .from("email_verification_codes")
      .update({ verified: true })
      .eq("email", email)
      .eq("verified", false);

    // Save new code (expires in 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        user_id: userId,
        email,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      throw insertError;
    }

    console.log(`Sending verification email to ${email} with code ${code}`);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Conduz Brasil <atendimento@r3d3s.com.br>",
        to: [email],
        subject: `${code} — Confirme seu email | Conduz Brasil`,
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Conduz Brasil</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 32px;">
                        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">Olá, ${userName || "Usuário"}!</h2>
                        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">Use o código abaixo para confirmar seu email:</p>
                        
                        <!-- Code Box -->
                        <div style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 2px solid #FB923C; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <p style="margin: 0 0 8px; color: #9A3412; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Código de verificação</p>
                          <p style="margin: 0; color: #EA580C; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                        </div>
                        
                        <p style="margin: 0; color: #71717a; font-size: 14px; text-align: center;">
                          ⏱️ Este código expira em <strong>30 minutos</strong>.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #18181b; padding: 24px 32px; text-align: center;">
                        <p style="margin: 0; color: #a1a1aa; font-size: 13px;">
                          © 2025 Conduz Brasil — Tire sua CNH com o instrutor ideal
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend error:", resendError);
      throw new Error(`Resend error: ${resendError}`);
    }

    const resendData = await resendResponse.json();
    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email:", error);
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
