"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FirebasePhoneAuth from "@/components/auth/FirebasePhoneAuth";

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/profile";

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleVerified = async (idToken) => {
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/firebase-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          purpose: "verify",
          redirectTo: returnTo,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Verification failed");
      router.replace(j.redirectTo || returnTo);
    } catch (e) {
      setError(e.message || "Verification failed");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100dvh-9rem)] flex items-start justify-center px-4 pt-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h1 className="text-xl font-bold text-[#290c52] text-center">Verify Phone Number</h1>
        <p className="text-sm text-gray-600 text-center mt-2">
          Phone verification is required for all accounts — Google sign-in and normal signup.
        </p>

        <div className="mt-6">
          <FirebasePhoneAuth
            phone={phone}
            onPhoneChange={setPhone}
            onVerified={handleVerified}
            purpose="verify"
            disabled={loading}
            submitLabel="Verify & Continue"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

        <p className="mt-6 text-center text-xs text-gray-500">
          OTP is sent via Firebase Phone Authentication.
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
