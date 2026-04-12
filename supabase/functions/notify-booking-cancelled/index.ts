import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyCancelledRequest {
  bookingId: string;
  recipientEmail: string;
  recipientName: string;
  cancelledBy: "student" | "instructor";
  cancellerName: string;
  scheduledDate: string;
  startTime: string;
  reason: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-booking-cancelled function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      recipientEmail,
      recipientName,
      cancelledBy,
      cancellerName,
      scheduledDate,
      startTime,
      reason,
    }: NotifyCancelledRequest = await req.json();

    console.log("Processing cancellation notification for booking:", bookingId);
    console.log("Recipient email:", recipientEmail);

    const cancelledByLabel = cancelledBy === "student" ? "aluno" : "instrutor";
    const subjectPrefix = cancelledBy === "student" ? "O aluno cancelou" : "O instrutor cancelou";

    const emailResponse = await resend.emails.send({
      from: "Conduz Brasil <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `⚠️ ${subjectPrefix} a aula`,
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
                <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">⚠️</span>
                </div>
              </div>
              
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
                Olá, ${recipientName}!
              </h1>
              
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: bold;">
                  ⚠️ Sua aula foi cancelada pelo ${cancelledByLabel}
                </p>
              </div>
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
                Infelizmente <strong>${cancellerName}</strong> precisou cancelar a aula agendada.
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #71717a; font-size: 14px; margin: 0 0 12px 0; font-weight: bold;">📋 Detalhes da aula cancelada:</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">📅 <strong>Data:</strong> ${scheduledDate}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0;">🕐 <strong>Horário:</strong> ${startTime}</p>
              </div>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #991b1b; font-size: 14px; margin: 0 0 8px 0;"><strong>Motivo do cancelamento:</strong></p>
                <p style="color: #991b1b; font-size: 14px; margin: 0;">${reason}</p>
              </div>
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 24px 0 0 0;">
                ${cancelledBy === "instructor" 
                  ? "Você pode buscar outros instrutores disponíveis ou entrar em contato para reagendar."
                  : "Aguardamos seu retorno em uma próxima oportunidade!"
                }
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
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

    // Get booking to find recipient user_id
    const { data: booking } = await supabase
      .from("bookings")
      .select("student_id, instructor_id")
      .eq("id", bookingId)
      .single();

    if (booking) {
      let userId: string | null = null;

      if (cancelledBy === "student") {
        // Notify instructor
        const { data: instructorProfile } = await supabase
          .from("instructor_profiles")
          .select("user_id")
          .eq("id", booking.instructor_id)
          .single();
        userId = instructorProfile?.user_id || null;
      } else {
        // Notify student
        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("user_id")
          .eq("id", booking.student_id)
          .single();
        userId = studentProfile?.user_id || null;
      }

      if (userId) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "booking_cancelled",
          title: "Aula cancelada",
          message: `A aula de ${scheduledDate} às ${startTime} foi cancelada por ${cancellerName}. Motivo: ${reason}`,
          booking_id: bookingId,
          action_url: cancelledBy === "student" ? "/admin/agendamentos" : "/aluno/aulas",
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
    console.error("Error in notify-booking-cancelled function:", error);
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