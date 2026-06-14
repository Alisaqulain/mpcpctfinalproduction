"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const redirectUrl = searchParams.get("redirect") || "/profile";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const returnTo = searchParams.get("redirect") || "/profile";
          if (!data.user?.isPhoneVerified) {
            router.push(`/verify-phone?returnTo=${encodeURIComponent(returnTo)}`);
          } else {
            router.push(returnTo);
          }
          return;
        }
      } catch {
        // not logged in
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router, searchParams]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!phone || !password) {
      setError("Phone number and password are required.");
      setIsLoading(false);
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setIsLoading(false);
        return;
      }

      setSuccess("Login successful!");
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: { isAuthenticated: true } })
      );
      if (data.redirectTo === "/verify-phone") {
        router.push(`/verify-phone?returnTo=${encodeURIComponent(redirectUrl)}`);
      } else {
        router.push(data.redirectTo || redirectUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 max-md:h-[calc(100dvh-9rem)] max-md:overflow-hidden md:min-h-screen flex max-md:justify-start max-md:items-stretch md:items-center justify-center px-4 max-md:pt-2 max-md:pb-2 md:py-12">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 max-md:mx-auto">
        <div className="text-center mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
            <span className="text-yellow-400">Welcome to</span>
            <span className="block mt-0.5 text-yellow-400 font-bold">MPCPCT</span>
          </h2>
          <p className="mt-2 text-gray-600 text-sm">Login with your phone number and password</p>
        </div>

        <GoogleAuthButton returnTo={redirectUrl} label="Continue with Google" className="mb-4" />

        <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-6">
            <div className="relative">
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                  error && !phone ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-transparent`}
                placeholder="Phone Number"
                required
                pattern="[0-9]{10}"
                maxLength={10}
              />
              <label
                htmlFor="phone"
                className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-blue-600"
              >
                Phone Number
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                  error && !password ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-transparent pr-12`}
                placeholder="Password"
                required
              />
              <label
                htmlFor="password"
                className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-blue-600"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-blue-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-2">
                <p className="text-gray-600">No account?</p>
                <a
                  href={`/signup${redirectUrl !== "/profile" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                  className="text-blue-600 hover:text-blue-400 hover:underline"
                >
                  Sign Up
                </a>
              </div>
              <a href="/forget" className="text-blue-600 hover:text-blue-400 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#290c52] text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
            >
              {isLoading ? "Logging in…" : "Login"}
            </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-center text-sm text-green-600">{success}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
