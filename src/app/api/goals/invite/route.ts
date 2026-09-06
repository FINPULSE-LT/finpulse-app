import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      creatorName = "Un usuario de FinPulse",
      recipientEmail,
      goalTitle,
      targetAmount,
      inviteCode,
      goalId,
    } = body;

    if (!recipientEmail || !goalTitle || !inviteCode) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (recipientEmail, goalTitle, inviteCode)" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "ganttswecrossbpo@gmail.com",
        pass: "ubdefvppavevyjjt",
      },
    });

    const joinUrl = `https://finpulse-app-theta.vercel.app/?unirseMeta=${goalId || inviteCode}&codigo=${inviteCode}`;
    const formattedTarget = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(targetAmount || 0);

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #06110D; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #A855F7; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00F5A0; font-size: 26px; margin: 0; font-weight: 900; letter-spacing: -0.5px;">FinPulse PRO</h1>
          <p style="color: #c084fc; font-size: 13px; margin-top: 4px; font-weight: 700;">🤝 INVITACIÓN A META COMPARTIDA DE AHORRO</p>
        </div>

        <div style="background: rgba(18, 14, 30, 0.85); border-radius: 16px; border: 1px solid rgba(168, 85, 247, 0.3); padding: 24px; margin-bottom: 24px;">
          <p style="font-size: 16px; margin-top: 0;">¡Hola! 👋,</p>
          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6;">
            <strong>${creatorName}</strong> te ha invitado a ahorrar en equipo y cumplir una meta juntos en <strong>FinPulse</strong>:
          </p>
          
          <div style="background-color: #0c0818; border-radius: 14px; border: 1px solid #A855F7; padding: 20px; margin: 18px 0; text-align: center;">
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-family: monospace;">Nombre del Objetivo:</span>
            <h2 style="color: #ffffff; font-size: 22px; margin: 6px 0 10px 0; font-weight: 900;">${goalTitle}</h2>
            <div style="display: inline-block; padding: 6px 14px; background: rgba(168,85,247,0.15); border-radius: 20px; border: 1px solid #A855F7; color: #e9d5ff; font-weight: bold; font-size: 13px;">
              Monto Objetivo: <strong style="color: #00F5A0;">${formattedTarget}</strong>
            </div>
            
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1);">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-family: monospace;">Código de Invitación Directo:</span><br/>
              <strong style="color: #00F5A0; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${inviteCode}</strong>
            </div>
          </div>

          <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
            Al unirte, podrás registrar tus aportes, ver el progreso acumulado en tiempo real y colaborar para alcanzar el objetivo más rápido.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${joinUrl}" style="background: linear-gradient(135deg, #A855F7 0%, #00F5A0 100%); color: #06110D; text-decoration: none; font-weight: 900; font-size: 15px; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);">
            ✨ Unirme a la Meta en FinPulse
          </a>
        </div>

        <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b;">
          FinPulse PRO v1.0 • Gestión Financiera Colaborativa • <a href="https://finpulse-app-theta.vercel.app" style="color: #00F5A0; text-decoration: none;">finpulse-app-theta.vercel.app</a>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"FinPulse Metas" <ganttswecrossbpo@gmail.com>`,
      to: recipientEmail,
      subject: `🤝 ¡${creatorName} te invitó a compartir la meta "${goalTitle}" en FinPulse!`,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("Error al enviar invitación de meta:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar el correo de invitación" },
      { status: 500 }
    );
  }
}
