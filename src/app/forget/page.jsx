"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPassword() {
  const [channel, setChannel] = useState("phone");
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validateIdentifier = () => {
    const newErrors = {};
    if (channel === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) newErrors.email = "Email is required";
      else if (!emailRegex.test(email.trim())) newErrors.email = "Invalid email";
    } else {
      const p = phone.replace(/\D/g, "");
      if (!p) newErrors.phone = "Phone number is required";
      else if (p.length !== 10) newErrors.phone = "Enter a valid 10-digit number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReset = () => {
    const newErrors = {};
    if (!otp.trim()) newErrors.otp = "OTP is required";
    else if (!/^\d{4,8}$/.test(otp.trim())) newErrors.otp = "Enter the OTP you received";

    if (!newPassword) newErrors.newPassword = "New password is required";
    else if (newPassword.length < 8) newErrors.newPassword = "At least 8 characters";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!validateIdentifier()) return;

    setLoading(true);
    setMessage("");
    setErrors({});

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "send",
          channel,
          email: channel === "email" ? email.trim() : undefined,
          phone: channel === "phone" ? phone.replace(/\D/g, "") : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.message || "Failed to send OTP");
        return;
      }
      setStep(2);
      setMessage(
        channel === "email"
          ? "OTP sent to your email. Check inbox and spam folder."
          : "OTP sent to your phone."
      );
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!validateReset()) return;

    setLoading(true);
    setMessage("");
    setErrors({});

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "reset",
          channel,
          email: channel === "email" ? email.trim() : undefined,
          phone: channel === "phone" ? phone.replace(/\D/g, "") : undefined,
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.message || "Failed to reset password");
        return;
      }
      setDone(true);
      setMessage("Password changed successfully! You can login now.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchChannel = (next) => {
    setChannel(next);
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setMessage("");
    setDone(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-[#290c52] mb-2 text-center">
          {done ? "Password Updated" : step === 1 ? "Forgot Password" : "Reset Password"}
        </h2>
        <p className="text-sm text-gray-600 text-center mb-5">
          {step === 1
            ? "Choose how you want to receive your OTP"
            : "Enter OTP and your new password"}
        </p>

        {!done && step === 1 && (
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => switchChannel("phone")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                channel === "phone"
                  ? "bg-[#290c52] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Phone OTP
            </button>
            <button
              type="button"
              onClick={() => switchChannel("email")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                channel === "email"
                  ? "bg-[#290c52] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Email OTP
            </button>
          </div>
        )}

        {message && (
          <p
            className={`text-sm text-center mb-4 font-medium ${
              done ? "text-green-700" : message.includes("sent") ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        {done ? (
          <div className="space-y-4 text-center">
            <Link
              href="/login"
              className="inline-block w-full bg-[#290c52] text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90"
            >
              Go to Login
            </Link>
          </div>
        ) : step === 1 ? (
          <form className="space-y-5" onSubmit={sendOtp}>
            {channel === "email" ? (
              <Field
                label="Registered email"
                name="email"
                type="email"
                value={email}
                error={errors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="you@example.com"
              />
            ) : (
              <Field
                label="Registered phone number"
                name="phone"
                type="tel"
                value={phone}
                error={errors.phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setErrors((p) => ({ ...p, phone: "" }));
                }}
                placeholder="10-digit mobile"
                maxLength={10}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#290c52] text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={resetPassword}>
            <p className="text-xs text-gray-500 text-center">
              OTP sent to{" "}
              <span className="font-medium text-gray-800">
                {channel === "email" ? email : phone}
              </span>
            </p>

            <Field
              label="OTP"
              name="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              error={errors.otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 8));
                setErrors((p) => ({ ...p, otp: "" }));
              }}
              placeholder="Enter OTP"
              maxLength={8}
            />

            <PasswordField
              label="New password"
              name="newPassword"
              value={newPassword}
              error={errors.newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((p) => ({ ...p, newPassword: "" }));
              }}
              show={showNewPassword}
              toggle={() => setShowNewPassword((p) => !p)}
            />

            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              value={confirmPassword}
              error={errors.confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              show={showConfirmPassword}
              toggle={() => setShowConfirmPassword((p) => !p)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#290c52] text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Updating…" : "Reset Password"}
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                className="text-[#290c52] underline"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMessage("");
                }}
              >
                Change {channel === "email" ? "email" : "phone"}
              </button>
              <button
                type="button"
                className="text-[#290c52] underline disabled:opacity-50"
                disabled={loading}
                onClick={sendOtp}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {!done && (
          <p className="text-center text-sm text-gray-600 mt-6">
            <Link href="/login" className="text-[#290c52] font-medium underline">
              Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, className = "", ...props }) {
  return (
    <div className="relative">
      <input
        {...props}
        className={`peer w-full border-2 rounded-lg py-3 px-4 text-gray-900 placeholder-transparent bg-white focus:outline-none focus:border-[#290c52] transition-all ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        placeholder={label}
      />
      <label className="absolute left-4 -top-2.5 text-sm bg-white px-1 text-gray-600 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-[#290c52]">
        {label}
      </label>
      {error && <p className="text-sm mt-1 text-red-500">{error}</p>}
    </div>
  );
}

function PasswordField({ label, error, show, toggle, ...props }) {
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`peer w-full border-2 rounded-lg py-3 px-4 pr-12 text-gray-900 placeholder-transparent bg-white focus:outline-none focus:border-[#290c52] transition-all ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholder={label}
      />
      <label className="absolute left-4 -top-2.5 text-sm bg-white px-1 text-gray-600 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-[#290c52]">
        {label}
      </label>
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 inset-y-0 flex items-center text-gray-500 hover:text-[#290c52]"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
      {error && <p className="text-sm mt-1 text-red-500">{error}</p>}
    </div>
  );
}
