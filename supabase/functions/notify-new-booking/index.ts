import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyNewBookingRequest {
  bookingId: string;
  instructorEmail: string;
  instructorName: string;
  studentName: string;
  scheduledDate: string;
  startTime: string;
  pickupAddress: string;
  packageType: string;
  lessonsCount: number;
  totalPrice: number;
  studentMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-new-booking function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      instructorEmail,
      instructorName,
      studentName,
      scheduledDate,
      startTime,
      pickupAddress,
      packageType,
      lessonsCount,
      totalPrice,
      studentMessage,
    }: NotifyNewBookingRequest = await req.json();

    console.log("Processing new booking notification for booking:", bookingId);
    console.log("Instructor email:", instructorEmail);

    const packageLabel = packageType === "single" ? "Aula Avulsa" : `Pacote de ${lessonsCount} Aulas`;
    const formattedPrice = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totalPrice);

    const emailResponse = await resend.emails.send({
      from: "Conduz Brasil <onboarding@resend.dev>",
      to: [instructorEmail],
      subject: `🚗 Nova solicitação de aula de ${studentName}!`,
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
                  <span style="font-size: 28px;">🚗</span>
                </div>
              </div>
              
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
                Olá, ${instructorName}!
              </h1>
              
              <div style="background: linear-gradient(135deg, #fff7ed, #fed7aa); border-left: 4px solid #f97316; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #9a3412; font-size: 16px; margin: 0; font-weight: bold;">
                  🎯 Você recebeu uma nova solicitação de aula!
                </p>
              </div>
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
                <strong>${studentName}</strong> gostaria de agendar uma aula com você.
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #71717a; font-size: 14px; margin: 0 0 12px 0; font-weight: bold;">📋 Detalhes da solicitação:</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">👤 <strong>Aluno:</strong> ${studentName}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">📅 <strong>Data:</strong> ${scheduledDate}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">🕐 <strong>Horário:</strong> ${startTime}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">📍 <strong>Local:</strong> ${pickupAddress}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">📦 <strong>Tipo:</strong> ${packageLabel}</p>
                <p style="color: #18181b; font-size: 14px; margin: 0;">💰 <strong>Valor:</strong> ${formattedPrice}</p>
              </div>
              
              ${studentMessage ? `
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0;"><strong>💬 Mensagem do aluno:</strong></p>
                <p style="color: #1e40af; font-size: 14px; margin: 0; font-style: italic;">"${studentMessage}"</p>
              </div>
              ` : ''}
              
              <div style="background-color: #fefce8; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
                <p style="color: #854d0e; font-size: 14px; margin: 0;">
                  <strong>⏰ Responda em até 24 horas</strong><br>
                  para manter sua taxa de aceitação alta!
                </p>
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
                <p style="color: #71717a; font-size: 14px; margin: 0 0 16px 0;">
                  Acesse o app para confirmar ou recusar esta solicitação.
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

    // Get instructor user_id
    const { data: booking } = await supabase
      .from("bookings")
      .select("instructor_id")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const { data: instructorProfile } = await supabase
        .from("instructor_profiles")
        .select("user_id")
        .eq("id", booking.instructor_id)
        .single();

      if (instructorProfile) {
        await supabase.from("notifications").insert({
          user_id: instructorProfile.user_id,
          type: "booking_request",
          title: "Nova solicitação de aula",
          message: `${studentName} solicitou uma aula para ${scheduledDate} às ${startTime}.`,
          booking_id: bookingId,
          action_url: "/admin/agendamentos",
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
    console.error("Error in notify-new-booking function:", error);
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