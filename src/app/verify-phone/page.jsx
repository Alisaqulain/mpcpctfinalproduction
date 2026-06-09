"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/profile";

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.phoneNumber && !String(data.user.phoneNumber).startsWith("g")) {
          setPhone(data.user.phoneNumber);
        }
        if (data.user?.isPhoneVerified || data.user?.isMobileVerified) {
          router.replace(returnTo);
        }
      })
      .catch(() => {});
  }, [router, returnTo]);

  const sendOtp = async () => {
    setError("");
    setMessage("");
    const m = phone.replace(/\D/g, "");
    if (m.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: m, purpose: "verify_mobile" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to send OTP");
      setStep(2);
      setMessage(j.message || "OTP sent");
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mobile: phone.replace(/\D/g, ""),
          code: otp,
          purpose: "verify_mobile",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Invalid OTP");
      router.replace(returnTo);
    } catch (e) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100dvh-9rem)] flex items-start justify-center px-4 pt-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h1 className="text-xl font-bold text-[#290c52] text-center">Verify Phone Number</h1>
        <p className="text-sm text-gray-600 text-center mt-2">
          Phone OTP is required for all accounts — Google sign-in and normal signup. Enter your mobile number to continue.
        </p>

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <input
              type="tel"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              maxLength={10}
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-[#290c52] text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-center tracking-widest"
              maxLength={6}
            />
            <button
              type="button"
              onClick={verify}
              disabled={loading}
              className="w-full bg-[#290c52] text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-[#290c52] underline"
            >
              Resend OTP
            </button>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-green-600 text-center">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

        <p className="mt-6 text-center text-xs text-gray-500">
          OTP verification is mandatory before using exams, courses, and your profile.
        </p>
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <VerifyPhoneContent />
    </Suspense>
  );
}
