import bcrypt from "bcryptjs";
import Otp from "@/lib/models/Otp";
import { sendOtpEmail } from "@/lib/emailService";

const PURPOSES = new Set(["reset_email", "forgot_password"]);

const RESEND_COOLDOWN_MS = 30_000;
const MAX_PER_HOUR = 5;
const OTP_TTL_MS = 10 * 60_000;

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function rateLimitQuery({ email }) {
  const since = new Date(Date.now() - RESEND_COOLDOWN_MS);
  const recent = await Otp.findOne({ email, createdAt: { $gte: since } }).sort({ createdAt: -1 });
  if (recent) {
    const waitSec = Math.ceil(
      (recent.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000
    );
    return {
      ok: false,
      error: `Please wait ${Math.max(waitSec, 1)} seconds before requesting another OTP`,
      status: 429,
      retryAfter: Math.max(waitSec, 1),
    };
  }

  const hourCount = await Otp.countDocuments({
    email,
    createdAt: { $gte: new Date(Date.now() - 3600_000) },
  });
  if (hourCount >= MAX_PER_HOUR) {
    return { ok: false, error: "Too many OTP requests. Try again later.", status: 429 };
  }
  return { ok: true };
}

/** Email OTP only — phone OTP uses Firebase client + /api/auth/firebase-phone */
export async function createAndSendOtp({ email, purpose }) {
  const p = PURPOSES.has(purpose) ? purpose : "reset_email";
  const e = email ? normalizeEmail(email) : "";

  if (!e) {
    return { ok: false, error: "Email required", status: 400 };
  }

  const rl = await rateLimitQuery({ email: e });
  if (!rl.ok) return rl;

  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  let devCode;

  try {
    const code = randomOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const r = await sendOtpEmail(e, code);
    if (r.devCode) devCode = r.devCode;

    await Otp.create({
      email: e,
      codeHash,
      provider: "local",
      purpose: p,
      expiresAt,
      consumed: false,
      attempts: 0,
    });
  } catch (err) {
    return { ok: false, error: err.message || "Failed to send OTP", status: 503 };
  }

  return {
    ok: true,
    message: "OTP sent successfully",
    providers: ["email"],
    retryAfter: RESEND_COOLDOWN_MS / 1000,
    expiresIn: OTP_TTL_MS / 1000,
    ...(devCode ? { devCode } : {}),
  };
}

export async function verifyOtp({ email, code, purpose }) {
  const p = PURPOSES.has(purpose) ? purpose : "reset_email";
  const e = email ? normalizeEmail(email) : "";
  const raw = String(code || "").trim();

  if (!e) {
    return { ok: false, error: "Email required", status: 400 };
  }
  if (raw.length < 4) {
    return { ok: false, error: "OTP required", status: 400 };
  }

  const doc = await Otp.findOne({
    email: e,
    purpose: p,
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!doc) {
    return { ok: false, error: "Invalid or expired OTP", status: 400 };
  }

  if ((doc.attempts || 0) >= 5) {
    return { ok: false, error: "Too many attempts. Request a new OTP.", status: 429 };
  }

  const match = await bcrypt.compare(raw, doc.codeHash);
  if (!match) {
    doc.attempts = (doc.attempts || 0) + 1;
    await doc.save();
    return { ok: false, error: "Invalid OTP", status: 400 };
  }

  doc.consumed = true;
  await doc.save();
  return { ok: true, verified: true, purpose: p };
}
