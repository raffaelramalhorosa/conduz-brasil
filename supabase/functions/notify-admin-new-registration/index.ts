import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "atendimento@r3d3s.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail, userType, userCity, userState } = await req.json();

    const isAutoescola = userType === 'driving_school';
    const typeLabel = isAutoescola ? 'Autoescola' : 'Instrutor';
    const adminUrl = "https://drive-flex-connect.lovable.app/system-admin/pendentes";

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0f0f23;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:30px;">
            <span style="font-size:24px;font-weight:bold;color:#FF8C00;">Conduz Brasil</span>
          </div>
          <div style="background-color:#1a1a2e;border-radius:12px;padding:40px;border:1px solid #2a2a4e;">
            <h1 style="color:#ffffff;font-size:20px;margin-bottom:16px;">
              🔔 Novo cadastro pendente
            </h1>
            <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin-bottom:24px;">
              Um novo ${typeLabel.toLowerCase()} se cadastrou e está aguardando aprovação.
            </p>
            <div style="background-color:#0f0f23;border-radius:8px;padding:16px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="color:#71717a;padding:6px 0;font-size:14px;">Tipo:</td><td style="color:#ffffff;padding:6px 0;font-size:14px;">${typeLabel}</td></tr>
                <tr><td style="color:#71717a;padding:6px 0;font-size:14px;">Nome:</td><td style="color:#ffffff;padding:6px 0;font-size:14px;">${userName || 'Não informado'}</td></tr>
                <tr><td style="color:#71717a;padding:6px 0;font-size:14px;">Email:</td><td style="color:#ffffff;padding:6px 0;font-size:14px;">${userEmail}</td></tr>
                <tr><td style="color:#71717a;padding:6px 0;font-size:14px;">Localização:</td><td style="color:#ffffff;padding:6px 0;font-size:14px;">${userCity || '?'}, ${userState || '?'}</td></tr>
              </table>
            </div>
            <div style="text-align:center;">
              <a href="${adminUrl}" style="display:inline-block;background-color:#FF8C00;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">
                Revisar cadastro →
              </a>
            </div>
          </div>
          <p style="color:#52525b;text-align:center;font-size:12px;margin-top:24px;">
            © 2026 Conduz Brasil — Painel Administrativo
          </p>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Conduz Brasil <atendimento@r3d3s.com.br>",
        to: [ADMIN_EMAIL],
        subject: `🔔 Novo ${typeLabel.toLowerCase()} pendente de aprovação — ${userName || userEmail}`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.ok ? 200 : 400,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
