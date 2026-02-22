import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, userType, dashboardUrl } = await req.json();

    const isAutoescola = userType === 'driving_school';
    const greeting = userName ? userName.split(' ')[0] : 'Usuário';
    const typeLabel = isAutoescola ? 'autoescola' : 'instrutor';

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
            <div style="text-align:center;margin-bottom:24px;">
              <div style="width:64px;height:64px;border-radius:50%;background-color:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">✅</span>
              </div>
            </div>
            <h1 style="color:#ffffff;text-align:center;font-size:24px;margin-bottom:16px;">
              Conta aprovada!
            </h1>
            <p style="color:#a1a1aa;text-align:center;font-size:16px;line-height:1.6;margin-bottom:32px;">
              Olá, ${greeting}! Sua conta de ${typeLabel} no Conduz Brasil 
              foi aprovada com sucesso. Você já pode acessar seu dashboard e começar a usar a plataforma.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${dashboardUrl}" style="display:inline-block;background-color:#FF8C00;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">
                Acessar meu dashboard →
              </a>
            </div>
            <p style="color:#71717a;text-align:center;font-size:12px;">
              Se o botão não funcionar, copie e cole este link: ${dashboardUrl}
            </p>
          </div>
          <p style="color:#52525b;text-align:center;font-size:12px;margin-top:24px;">
            © 2026 Conduz Brasil — Tire sua CNH com o instrutor ideal
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
        to: [email],
        subject: `✅ Sua conta de ${typeLabel} foi aprovada — Conduz Brasil`,
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
