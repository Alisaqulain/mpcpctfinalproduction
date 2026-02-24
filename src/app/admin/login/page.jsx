"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if admin is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === "admin") {
            // Admin is logged in, redirect to admin panel
            router.push("/admin");
            return;
          }
        }
      } catch (err) {
        // Ignore errors, admin is not logged in
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setIsLoading(false);
      } else {
        // Redirect to admin panel
        router.push("/admin");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-100 via-white to-blue-100">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-300">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-[#290c52]">
            Admin Login
          </h2>
          <p className="mt-2 text-gray-600 text-sm">
            Access the MPCPCT Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Input */}
          <div className="relative">
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                error && !phone ? "border-red-500" : "border-gray-600"
              } rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 placeholder-transparent transition-all duration-300`}
              placeholder="Phone Number"
              required
              pattern="[0-9]{10}"
              aria-describedby="phone-error"
            />
            <label
              htmlFor="phone"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-purple-600"
            >
              Phone Number
            </label>
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                error && !password ? "border-red-500" : "border-gray-600"
              } rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 placeholder-transparent transition-all duration-300 pr-12`}
              placeholder="Password"
              required
              aria-describedby="password-error"
            />
            <label
              htmlFor="password"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-purple-600"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-500 transition-all duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#290c52] text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300"
            aria-label={isLoading ? "Logging in..." : "Login"}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-50"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.2A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Feedback messages */}
        {error && (
          <p
            className="mt-4 text-center text-sm text-red-600 animate-fade"
            id="phone-error password-error"
          >
            {error}
          </p>
        )}

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-purple-600 hover:underline transition-all duration-200"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

