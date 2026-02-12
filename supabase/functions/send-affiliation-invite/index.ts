import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendInviteRequest {
  email: string;
  instructor_name: string;
  driving_school_name: string;
  invitation_token: string;
  email_exists: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, instructor_name, driving_school_name, invitation_token, email_exists }: SendInviteRequest = await req.json();

    if (!email || !invitation_token || !driving_school_name) {
      throw new Error("email, invitation_token and driving_school_name are required");
    }

    const appBaseUrl = "https://drive-flex-connect.lovable.app";

    let subject: string;
    let ctaUrl: string;
    let ctaText: string;
    let bodyText: string;

    if (email_exists) {
      subject = `Convite de filiação — ${driving_school_name}`;
      ctaUrl = `${appBaseUrl}/convite/${invitation_token}`;
      ctaText = "Aceitar Convite";
      bodyText = `
        <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">
          A autoescola <strong>${driving_school_name}</strong> quer convidá-lo como instrutor filiado na plataforma Conduz Brasil.
        </p>
        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
          Como instrutor filiado, suas aulas serão gerenciadas pela autoescola e você terá acesso a mais alunos na região.
        </p>
      `;
    } else {
      subject = `Crie sua conta na Conduz Brasil — Convite de ${driving_school_name}`;
      ctaUrl = `${appBaseUrl}/cadastro?invite=${invitation_token}&email=${encodeURIComponent(email)}`;
      ctaText = "Criar Conta e Aceitar";
      bodyText = `
        <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">
          A autoescola <strong>${driving_school_name}</strong> está convidando você para se juntar à plataforma Conduz Brasil como instrutor filiado.
        </p>
        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
          Crie sua conta gratuita para aceitar o convite e começar a dar aulas com o suporte da ${driving_school_name}.
        </p>
      `;
    }

    const htmlEmail = `
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
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                      Olá${instructor_name ? `, ${instructor_name}` : ""}!
                    </h2>
                    ${bodyText}
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
                        ${ctaText}
                      </a>
                    </div>
                    <p style="margin: 0; color: #71717a; font-size: 14px; text-align: center;">
                      ⏱️ Este convite expira em <strong>7 dias</strong>.
                    </p>
                    <p style="margin: 16px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                      Se você não reconhece este convite, pode ignorar este email.
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
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Conduz Brasil <atendimento@r3d3s.com.br>",
        to: [email],
        subject,
        html: htmlEmail,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend error:", resendError);
      throw new Error(`Resend API error [${resendResponse.status}]: ${resendError}`);
    }

    const resendData = await resendResponse.json();
    console.log("Affiliation invite sent successfully:", resendData);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-affiliation-invite:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
