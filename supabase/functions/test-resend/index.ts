import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("test-resend function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY configured:", apiKey ? "Yes (starts with: " + apiKey.substring(0, 8) + "...)" : "No");

    // Test sending an email
    const emailResponse = await resend.emails.send({
      from: "AutoConnect <onboarding@resend.dev>",
      to: ["delivered@resend.dev"], // Resend's test email address
      subject: "Teste de API Resend - AutoConnect",
      html: `
        <h1>Teste de API Resend</h1>
        <p>Este é um email de teste para verificar se a integração com o Resend está funcionando corretamente.</p>
        <p>Data/Hora: ${new Date().toISOString()}</p>
      `,
    });

    console.log("Email response:", JSON.stringify(emailResponse));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de teste enviado com sucesso!",
        emailResponse,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in test-resend function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        errorDetails: error,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
