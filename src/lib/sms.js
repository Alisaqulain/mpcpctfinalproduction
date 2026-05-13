/**
 * Optional SMS: Twilio (global) or Fast2SMS (India).
 * If neither is configured, logs in development only.
 */

function normalizeMobile(mobile) {
  const d = String(mobile).replace(/\D/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.startsWith("91") && d.length === 12) return `+${d}`;
  if (d.startsWith("+")) return d;
  return `+${d}`;
}

export async function sendOtpSms(mobile, code) {
  const to = normalizeMobile(mobile);
  const body = `Your MPCPCT verification code is ${code}. Valid for 10 minutes.`;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && from) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const form = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Twilio error: ${res.status} ${t}`);
    }
    return { provider: "twilio" };
  }

  const f2k = process.env.FAST2SMS_API_KEY;
  if (f2k) {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: f2k,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: body,
        numbers: to.replace(/^\+91/, ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.return === false) {
      throw new Error(data.message || "Fast2SMS failed");
    }
    return { provider: "fast2sms" };
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[sms] No TWILIO_* or FAST2SMS_API_KEY — OTP (dev only):", mobile, code);
    return { provider: "none", devCode: code };
  }

  throw new Error("SMS not configured: set TWILIO_* or FAST2SMS_API_KEY");
}
