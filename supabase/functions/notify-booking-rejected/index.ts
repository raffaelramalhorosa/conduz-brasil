import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyRejectedRequest {
  bookingId: string;
  studentEmail: string;
  studentName: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  reason: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-booking-rejected function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      studentEmail,
      studentName,
      instructorName,
      scheduledDate,
      startTime,
      reason,
      message,
    }: NotifyRejectedRequest = await req.json();

    console.log("Processing rejection notification for booking:", bookingId);
    console.log("Student email:", studentEmail);

    const reasonLabels: Record<string, string> = {
      schedule_conflict: "Conflito de horário",
      unavailable: "Instrutor não disponível",
      vehicle_issue: "Problema com veículo",
      location_far: "Local muito distante",
      other: "Outro motivo",
    };

    const reasonText = reasonLabels[reason] || reason;

    const emailResponse = await resend.emails.send({
      from: "DriveFlex <onboarding@resend.dev>",
      to: [studentEmail],
      subject: "Sua solicitação de aula foi recusada",
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
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0;">
                Olá, ${studentName}!
              </h1>
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
                Infelizmente sua solicitação de aula foi recusada pelo instrutor.
              </p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #991b1b; font-size: 14px; margin: 0;">
                  <strong>Motivo:</strong> ${reasonText}
                </p>
              </div>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;"><strong>Detalhes da aula:</strong></p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 4px 0;">📅 Data: ${scheduledDate}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 4px 0;">🕐 Horário: ${startTime}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0;">👨‍🏫 Instrutor: ${instructorName}</p>
              </div>
              
              ${message ? `
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0;"><strong>Mensagem do instrutor:</strong></p>
                <p style="color: #1e40af; font-size: 14px; margin: 0;">"${message}"</p>
              </div>
              ` : ''}
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 24px 0 0 0;">
                Não desanime! Você pode buscar outros instrutores disponíveis na plataforma ou entrar em contato com este instrutor para reagendar.
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                  Este é um email automático, por favor não responda.
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
          type: "booking_rejected",
          title: "Aula recusada",
          message: `Sua solicitação de aula com ${instructorName} para ${scheduledDate} às ${startTime} foi recusada. Motivo: ${reasonText}`,
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
    console.error("Error in notify-booking-rejected function:", error);
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
