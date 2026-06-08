import { access, constants } from "fs/promises";
import { existsSync } from "fs";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/db";

const ENV_KEYS = [
  "JWT_SECRET",
  "MONGODB_URI",
  "SEED_TOKEN",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PHONE",
  "ADMIN_PASSWORD",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "FAST2SMS_API_KEY",
  "VIDEO_STORAGE_PATH",
  "SOLUTION_VIDEO_STORAGE_PATH",
  "VIDEO_MAX_BYTES",
  "SOCKET_IO_ALLOWED_ORIGINS",
];

const PLACEHOLDER_SECRETS = new Set([
  "please_change_me",
  "please_change_me_same_as_jwt_or_separate",
  "dev-seed-token-please-change",
  "your-webhook-secret",
  "your-app-password",
  "xxxxxxxxxxxxxxxxx",
]);

function isSet(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlaceholder(value) {
  return PLACEHOLDER_SECRETS.has(String(value).trim().toLowerCase());
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isPhone10(value) {
  return /^\d{10}$/.test(String(value).trim());
}

function isUrl(value) {
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isMongoUri(value) {
  const v = String(value).trim();
  return v.startsWith("mongodb://") || v.startsWith("mongodb+srv://");
}

function isRazorpayKeyId(value) {
  return /^rzp_(test|live)_[a-zA-Z0-9]+$/.test(String(value).trim());
}

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function isSmtpPort(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

/** @returns {"configured"|"missing"|"invalid format"} */
function checkVariable(name) {
  const raw = process.env[name];
  if (!isSet(raw)) return "missing";

  switch (name) {
    case "JWT_SECRET":
      if (isPlaceholder(raw) || String(raw).length < 16) return "invalid format";
      break;
    case "MONGODB_URI":
      if (!isMongoUri(raw)) return "invalid format";
      break;
    case "SEED_TOKEN":
      if (isPlaceholder(raw)) return "invalid format";
      break;
    case "RAZORPAY_KEY_ID":
      if (!isRazorpayKeyId(raw)) return "invalid format";
      break;
    case "RAZORPAY_KEY_SECRET":
    case "RAZORPAY_WEBHOOK_SECRET":
      if (isPlaceholder(raw) || String(raw).length < 8) return "invalid format";
      break;
    case "ADMIN_EMAIL":
      if (!isEmail(raw)) return "invalid format";
      break;
    case "ADMIN_PHONE":
      if (!isPhone10(raw)) return "invalid format";
      break;
    case "ADMIN_PASSWORD":
      if (isPlaceholder(raw) || String(raw).length < 6) return "invalid format";
      break;
    case "NEXT_PUBLIC_SITE_URL":
    case "NEXT_PUBLIC_BASE_URL":
      if (!isUrl(raw)) return "invalid format";
      break;
    case "SMTP_PORT":
      if (!isSmtpPort(raw)) return "invalid format";
      break;
    case "MAIL_FROM":
      if (!isEmail(raw)) return "invalid format";
      break;
    case "TWILIO_PHONE_NUMBER":
      if (isSet(raw) && !/^\+?\d{10,15}$/.test(String(raw).replace(/\s/g, ""))) {
        return "invalid format";
      }
      break;
    case "VIDEO_MAX_BYTES":
      if (!isPositiveInt(raw)) return "invalid format";
      break;
    case "SOCKET_IO_ALLOWED_ORIGINS":
      if (
        String(raw)
          .split(",")
          .some((o) => o.trim() && !isUrl(o.trim()))
      ) {
        return "invalid format";
      }
      break;
    default:
      break;
  }

  return "configured";
}

function buildVariableReport() {
  const variables = {};
  for (const key of ENV_KEYS) {
    variables[key] = checkVariable(key);
  }
  return variables;
}

async function testMongoDb() {
  const configured = checkVariable("MONGODB_URI") === "configured";
  if (!configured) {
    return {
      configured: false,
      connected: false,
      message: "MONGODB_URI missing or invalid",
    };
  }
  try {
    await dbConnect();
    const state = mongoose.connection.readyState;
    const connected = state === 1;
    return {
      configured: true,
      connected,
      message: connected ? "Connected" : `Not connected (readyState=${state})`,
    };
  } catch (e) {
    return {
      configured: true,
      connected: false,
      message: e?.message || "Connection failed",
    };
  }
}

async function testCloudinary() {
  const cloud =
    checkVariable("CLOUDINARY_CLOUD_NAME") === "configured" &&
    checkVariable("CLOUDINARY_API_KEY") === "configured" &&
    checkVariable("CLOUDINARY_API_SECRET") === "configured";

  if (!cloud) {
    return { configured: false, connected: false, message: "Cloudinary env incomplete" };
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    await cloudinary.api.ping();
    return { configured: true, connected: true, message: "Ping OK" };
  } catch (e) {
    return {
      configured: true,
      connected: false,
      message: e?.message || "Ping failed",
    };
  }
}

async function testRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const idStatus = checkVariable("RAZORPAY_KEY_ID");
  const secretStatus = checkVariable("RAZORPAY_KEY_SECRET");
  const configured = idStatus === "configured" && secretStatus === "configured";
  const validFormat = idStatus !== "invalid format" && secretStatus !== "invalid format";

  if (!configured) {
    return {
      configured: false,
      validFormat,
      connected: false,
      message: "Razorpay keys missing or invalid format",
    };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        configured: true,
        validFormat: true,
        connected: false,
        message: "Authentication failed — check key id/secret",
      };
    }

    if (!res.ok) {
      return {
        configured: true,
        validFormat: true,
        connected: false,
        message: `API returned HTTP ${res.status}`,
      };
    }

    return {
      configured: true,
      validFormat: true,
      connected: true,
      message: "Credentials accepted",
    };
  } catch (e) {
    return {
      configured: true,
      validFormat: true,
      connected: false,
      message: e?.message || "Razorpay check failed",
    };
  }
}

async function testSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const configured =
    checkVariable("SMTP_HOST") === "configured" &&
    checkVariable("SMTP_USER") === "configured" &&
    checkVariable("SMTP_PASS") === "configured";

  if (!configured) {
    return { configured: false, connected: false, message: "SMTP env incomplete" };
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
    await transport.verify();
    transport.close();
    return { configured: true, connected: true, message: "SMTP verify OK" };
  } catch (e) {
    return {
      configured: true,
      connected: false,
      message: e?.message || "SMTP verify failed",
    };
  }
}

async function pathAccess(dir) {
  if (!isSet(dir)) {
    return { configured: false, exists: false, writable: false };
  }
  const exists = existsSync(dir);
  if (!exists) {
    return { configured: true, exists: false, writable: false };
  }
  try {
    await access(dir, constants.W_OK);
    return { configured: true, exists: true, writable: true };
  } catch {
    try {
      await access(dir, constants.R_OK);
      return { configured: true, exists: true, writable: false };
    } catch {
      return { configured: true, exists: true, writable: false };
    }
  }
}

async function testStorage() {
  const videoPath = process.env.VIDEO_STORAGE_PATH || "/var/www/videos";
  const solutionPath =
    process.env.SOLUTION_VIDEO_STORAGE_PATH || `${videoPath}/solutions`;

  const primary = await pathAccess(videoPath);
  const solution = await pathAccess(solutionPath);

  return {
    videoPathExists: primary.exists,
    writable: primary.writable,
    solutionPathExists: solution.exists,
    solutionWritable: solution.writable,
    message: primary.exists
      ? primary.writable
        ? "Video storage path exists and is writable"
        : "Video storage path exists but is not writable"
      : "Video storage path does not exist",
  };
}

/** Mask public URLs for response (host only). */
export function maskPublicUrl(value) {
  if (!isSet(value)) return null;
  try {
    const u = new URL(String(value).trim());
    return `${u.protocol}//${u.hostname}${u.pathname !== "/" ? "/***" : ""}`;
  } catch {
    return "invalid";
  }
}

export async function runEnvHealthCheck() {
  const variables = buildVariableReport();

  const [mongodb, cloudinaryResult, razorpay, smtp, storage] = await Promise.all([
    testMongoDb().catch((e) => ({
      configured: checkVariable("MONGODB_URI") === "configured",
      connected: false,
      message: e?.message || "MongoDB check error",
    })),
    testCloudinary().catch((e) => ({
      configured: false,
      connected: false,
      message: e?.message || "Cloudinary check error",
    })),
    testRazorpay().catch((e) => ({
      configured: false,
      validFormat: false,
      connected: false,
      message: e?.message || "Razorpay check error",
    })),
    testSmtp().catch((e) => ({
      configured: false,
      connected: false,
      message: e?.message || "SMTP check error",
    })),
    testStorage().catch((e) => ({
      videoPathExists: false,
      writable: false,
      message: e?.message || "Storage check error",
    })),
  ]);

  return {
    success: true,
    environment: process.env.NODE_ENV || "development",
    publicHints: {
      NEXT_PUBLIC_SITE_URL: maskPublicUrl(process.env.NEXT_PUBLIC_SITE_URL),
      NEXT_PUBLIC_BASE_URL: maskPublicUrl(process.env.NEXT_PUBLIC_BASE_URL),
    },
    checks: {
      mongodb,
      cloudinary: cloudinaryResult,
      razorpay,
      smtp,
      storage,
      variables,
    },
  };
}

export function isCheckEnvAuthorized(request) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) return true;

  const expected = process.env.CHECK_ENV_TOKEN;
  if (!expected || !String(expected).trim()) return false;

  const token = new URL(request.url).searchParams.get("token");
  return token === expected;
}
