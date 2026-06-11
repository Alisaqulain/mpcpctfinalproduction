"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirebaseAuth, isFirebaseClientConfigured, toFirebaseE164 } from "@/lib/firebaseClient";

const RESEND_COOLDOWN_SEC = 30;

/**
 * Firebase Phone OTP — sends SMS via Firebase, then calls onVerified(idToken).
 */
export default function FirebasePhoneAuth({
  phone,
  onPhoneChange,
  onVerified,
  purpose = "login",
  disabled = false,
  submitLabel = "Verify & Continue",
  showPhoneInput = true,
  hint,
}) {
  const recaptchaId = useId().replace(/:/g, "");
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          /* ignore */
        }
        recaptchaRef.current = null;
      }
    };
  }, []);

  const getRecaptchaVerifier = () => {
    const auth = getFirebaseAuth();
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        /* ignore */
      }
    }
    recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaId, {
      size: "invisible",
    });
    return recaptchaRef.current;
  };

  const sendOtp = async () => {
    setError("");
    setMessage("");

    if (!isFirebaseClientConfigured()) {
      setError("Firebase is not configured on the client");
      return;
    }

    const e164 = toFirebaseE164(phone);
    if (!e164) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
      confirmationRef.current = confirmation;
      setStep(2);
      setResendSeconds(RESEND_COOLDOWN_SEC);
      setMessage("OTP sent to your phone");
    } catch (err) {
      console.error("[FirebasePhoneAuth] send", err);
      setError(err?.message || "Failed to send OTP");
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          /* ignore */
        }
        recaptchaRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Enter the OTP you received");
      return;
    }
    if (!confirmationRef.current) {
      setError("Send OTP first");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(otp.trim());
      const idToken = await result.user.getIdToken(true);
      await onVerified(idToken, { purpose, phone: phone.replace(/\D/g, "").slice(-10) });
    } catch (err) {
      console.error("[FirebasePhoneAuth] verify", err);
      const code = err?.code || "";
      if (code.includes("invalid-verification-code")) {
        setError("Invalid OTP");
      } else if (code.includes("code-expired")) {
        setError("OTP expired. Request a new code.");
      } else {
        setError(err?.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseClientConfigured()) {
    return (
      <p className="text-sm text-red-600 text-center">
        Firebase Phone Auth is not configured. Set NEXT_PUBLIC_FIREBASE_* variables.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div id={recaptchaId} />

      {step === 1 ? (
        <>
          {showPhoneInput && (
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange?.(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="10-digit mobile number"
              maxLength={10}
              disabled={disabled || loading}
            />
          )}
          {hint && <p className="text-xs text-gray-500 text-center">{hint}</p>}
          <button
            type="button"
            onClick={sendOtp}
            disabled={disabled || loading}
            className="w-full py-3 px-4 bg-[#290c52] text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            OTP sent to <strong>{phone}</strong>
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full border-2 border-gray-600 rounded-lg px-4 py-3 text-center tracking-widest text-lg"
            placeholder="Enter OTP"
            maxLength={6}
            autoFocus
            disabled={disabled || loading}
          />
          <button
            type="submit"
            disabled={disabled || loading}
            className="w-full py-3 px-4 bg-[#290c52] text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? "Verifying…" : submitLabel}
          </button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
              }}
              className="text-[#290c52] underline"
              disabled={loading}
            >
              Change number
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={resendSeconds > 0 || loading}
              className="text-[#290c52] underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      )}

      {message && <p className="text-sm text-green-600 text-center">{message}</p>}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
