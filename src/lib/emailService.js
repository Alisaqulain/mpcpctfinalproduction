import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendOtpEmail(email, code) {
  const transport = getTransport();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const subject = "MPCPCT — Verification Code";
  const text = `Your MPCPCT verification code is ${code}. Valid for 10 minutes. Do not share this code.`;
  const html = `<p>Your MPCPCT verification code is <strong>${code}</strong>.</p><p>Valid for 10 minutes. Do not share this code.</p>`;

  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[email] SMTP not configured — OTP (dev only):", email);
      return { provider: "none", devCode: code };
    }
    throw new Error("Email not configured: set SMTP_* and MAIL_FROM");
  }

  await transport.sendMail({ from, to: email, subject, text, html });
  return { provider: "smtp" };
}

export async function sendPasswordResetEmail(email, code) {
  return sendOtpEmail(email, code);
}
