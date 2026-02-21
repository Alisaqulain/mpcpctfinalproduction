import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Boolean(process.env.SMTP_SECURE === "true"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) return { skipped: true };
  const from = process.env.MAIL_FROM || "no-reply@example.com";
  await transporter.sendMail({ from, to, subject, html });
  return { success: true };
}
