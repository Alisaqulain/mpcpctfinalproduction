import bcrypt from "bcryptjs";
import Otp from "@/lib/models/Otp";
import { sendOtpSms } from "@/lib/sms";
import { sendOtpEmail } from "@/lib/emailService";

const PURPOSES = new Set([
  "verify_mobile",
  "forgot_password",
  "signup",
  "reset_email",
  "reset_phone",
]);

const COOLDOWN_MS = 60_000;
const OTP_TTL_MS = 10 * 60_000;
const MAX_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeMobile(mobile) {
  return String(mobile || "").replace(/\D/g, "").slice(-10);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function rateLimitQuery({ mobile, email }) {
  const since = new Date(Date.now() - COOLDOWN_MS);
  const q = { createdAt: { $gte: since }, consumed: false };
  if (mobile) q.mobile = mobile;
  if (email) q.email = email;
  const recent = await Otp.findOne(q).sort({ createdAt: -1 });
  if (recent) {
    return { ok: false, error: "Please wait before requesting another OTP", status: 429 };
  }

  const hourAgo = new Date(Date.now() - 3600_000);
  const hourQ = { createdAt: { $gte: hourAgo } };
  if (mobile) hourQ.mobile = mobile;
  else if (email) hourQ.email = email;

  const hourCount = await Otp.countDocuments(hourQ);
  if (hourCount >= MAX_PER_HOUR) {
    return { ok: false, error: "Too many OTP requests. Try again later.", status: 429 };
  }
  return { ok: true };
}

/**
 * Create hashed OTP and send via SMS and/or email.
 */
export async function createAndSendOtp({ mobile, email, purpose }) {
  const p = PURPOSES.has(purpose) ? purpose : "verify_mobile";
  const m = mobile ? normalizeMobile(mobile) : "";
  const e = email ? normalizeEmail(email) : "";

  if (!m && !e) {
    return { ok: false, error: "Mobile or email required", status: 400 };
  }
  if (m && m.length < 10) {
    return { ok: false, error: "Valid mobile required", status: 400 };
  }

  const rl = await rateLimitQuery({ mobile: m || undefined, email: e || undefined });
  if (!rl.ok) return rl;

  const code = randomOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.create({
    mobile: m || undefined,
    email: e || undefined,
    codeHash,
    purpose: p,
    expiresAt,
    attempts: 0,
    consumed: false,
  });

  const sent = { providers: [] };
  let devCode;

  try {
    if (m) {
      const r = await sendOtpSms(m, code);
      sent.providers.push(r.provider);
      if (r.devCode) devCode = r.devCode;
    }
    if (e) {
      const r = await sendOtpEmail(e, code);
      sent.providers.push(r.provider);
      if (r.devCode) devCode = r.devCode;
    }
  } catch (err) {
    await Otp.deleteMany({ mobile: m || null, email: e || null, codeHash, consumed: false });
    return { ok: false, error: err.message || "Failed to send OTP", status: 503 };
  }

  return {
    ok: true,
    message: "OTP sent",
    providers: sent.providers,
    ...(devCode ? { devCode } : {}),
  };
}

/**
 * Verify OTP (hashed). Increments attempts on failure.
 */
export async function verifyOtp({ mobile, email, code, purpose }) {
  const p = PURPOSES.has(purpose) ? purpose : "verify_mobile";
  const m = mobile ? normalizeMobile(mobile) : "";
  const e = email ? normalizeEmail(email) : "";
  const raw = String(code || "").trim();

  if (raw.length < 4) {
    return { ok: false, error: "OTP required", status: 400 };
  }

  const q = {
    purpose: p,
    consumed: false,
    expiresAt: { $gt: new Date() },
  };
  if (m) q.mobile = m;
  if (e) q.email = e;

  const doc = await Otp.findOne(q).sort({ createdAt: -1 });
  if (!doc) {
    return { ok: false, error: "Invalid or expired OTP", status: 400 };
  }

  if (doc.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new OTP.", status: 429 };
  }

  let match = false;
  if (doc.codeHash) {
    match = await bcrypt.compare(raw, doc.codeHash);
  } else if (doc.code) {
    match = doc.code === raw;
  }

  if (!match) {
    doc.attempts = (doc.attempts || 0) + 1;
    await doc.save();
    return { ok: false, error: "Invalid OTP", status: 400 };
  }

  doc.consumed = true;
  await doc.save();
  return { ok: true, verified: true, purpose: p };
}
