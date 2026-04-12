import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyConfirmedRequest {
  bookingId: string;
  studentEmail: string;
  studentName: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  pickupAddress: string;
  vehicleInfo?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-booking-confirmed function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      studentEmail,
      studentName,
      instructorName,
      scheduledDate,
      startTime,
      pickupAddress,
      vehicleInfo,
      message,
    }: NotifyConfirmedRequest = await req.json();

    console.log("Processing confirmation notification for booking:", bookingId);
    console.log("Student email:", studentEmail);

    const emailResponse = await resend.emails.send({
      from: "Conduz Brasil <onboarding@resend.dev>",
      to: [studentEmail],
      subject: "🎉 Sua aula foi confirmada!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">✅</span>
                </div>
              </div>
              
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
                Olá, ${studentName}!
              </h1>
              
              <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #166534; font-size: 16px; margin: 0; font-weight: bold;">
                  🎉 Sua aula foi confirmada!
                </p>
              </div>
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
                O instrutor <strong>${instructorName}</strong> confirmou sua aula. Prepare-se para uma ótima experiência!
              </p>
              
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #fed7aa;">
                <p style="color: #9a3412; font-size: 14px; margin: 0 0 12px 0; font-weight: bold;">📋 Detalhes da aula:</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">📅 <strong>Data:</strong> ${scheduledDate}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">🕐 <strong>Horário:</strong> ${startTime}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">👨‍🏫 <strong>Instrutor:</strong> ${instructorName}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">📍 <strong>Local:</strong> ${pickupAddress}</p>
                ${vehicleInfo ? `<p style="color: #18181b; font-size: 14px; margin: 0;">🚗 <strong>Veículo:</strong> ${vehicleInfo}</p>` : ''}
              </div>
              
              ${message ? `
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0;"><strong>💬 Mensagem do instrutor:</strong></p>
                <p style="color: #1e40af; font-size: 14px; margin: 0; font-style: italic;">"${message}"</p>
              </div>
              ` : ''}
              
              <div style="background-color: #fefce8; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #854d0e; font-size: 14px; margin: 0;">
                  <strong>⚠️ Dicas importantes:</strong><br>
                  • Chegue ao local 5 minutos antes do horário marcado<br>
                  • Traga sua CNH ou documento de habilitação provisória<br>
                  • Use roupas e calçados confortáveis
                </p>
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
                <p style="color: #71717a; font-size: 14px; margin: 0 0 16px 0;">
                  Precisa de ajuda? Entre em contato pelo chat do app.
                </p>
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                  Este é um email automático da Conduz Brasil.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Also create an in-app notification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get student user_id from student_profiles via booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("student_id")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("user_id")
        .eq("id", booking.student_id)
        .single();

      if (studentProfile) {
        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: studentProfile.user_id,
          type: "booking_confirmed",
          title: "Aula confirmada!",
          message: `Sua aula com ${instructorName} para ${scheduledDate} às ${startTime} foi confirmada.`,
          booking_id: bookingId,
          action_url: "/aluno/aulas",
        });

        console.log("In-app notification created");
      }
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-booking-confirmed function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);