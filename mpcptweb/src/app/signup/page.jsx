"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    states: "",
    city: "",
  });
  const [profileFile, setProfileFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // List of all Indian states
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
  ];

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          router.push("/profile");
          return;
        }
      } catch (err) {
        // ignore
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const redirectUrl = searchParams.get("redirect") || "/profile";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProfileFile(file);
  };

  const validateForm = () => {
    const errs = {};

    if (!formData.name) errs.name = "Full name is required.";
    if (!formData.email) errs.email = "Email is required.";
    if (!formData.phoneNumber) errs.phoneNumber = "Phone number is required.";
    if (!formData.states) errs.states = "State is required.";
    if (!formData.city) errs.city = "City is required.";
    if (!formData.password) errs.password = "Password is required.";
    if (!formData.confirmPassword)
      errs.confirmPassword = "Confirm password is required.";

    if (formData.password && formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      errs.phoneNumber = "Enter a valid 10-digit phone number.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errs.email = "Enter a valid email address.";
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Please fix the errors below.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("phoneNumber", formData.phoneNumber);
      body.append("email", formData.email);
      body.append("password", formData.password);
      body.append("rePassword", formData.confirmPassword);
      body.append("states", formData.states);
      body.append("city", formData.city);
      if (profileFile) {
        body.append("profile", profileFile);
      }

      const res = await fetch("/api/signup", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("email")) {
          setFieldErrors((prev) => ({ ...prev, email: data.error }));
        } else if (data.error?.toLowerCase().includes("phone")) {
          setFieldErrors((prev) => ({ ...prev, phoneNumber: data.error }));
        }
        setError(data.error || "Signup failed.");
        setIsLoading(false);
        return;
      }

      // Auto login
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        }),
      });

      if (!loginRes.ok) {
        setSuccess("Account created! Please login.");
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        }, 1200);
        setIsLoading(false);
        return;
      }

      setSuccess("Account created! Logging you in...");
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: { isAuthenticated: true } })
      );
      setTimeout(() => {
        router.push(redirectUrl);
      }, 800);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-600">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-[#290c52]">
            Create Account
          </h2>
          <p className="mt-2 text-gray-600 text-sm">Join MPCPCT today...</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          encType="multipart/form-data"
        >
          {/* Reusable Input */}
          {[
            { id: "name", label: "Full Name", type: "text" },
            { id: "email", label: "Email", type: "email" },
            { id: "phoneNumber", label: "Phone Number", type: "tel" },
            { id: "city", label: "City", type: "text" },
          ].map((field) => (
            <div key={field.id} className="relative">
              <input
                type={field.type}
                id={field.id}
                name={field.id}
                value={formData[field.id]}
                onChange={handleInputChange}
                className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                  fieldErrors[field.id]
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-transparent transition-all duration-300`}
                placeholder={field.label}
                required
              />
              <label
                htmlFor={field.id}
                className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all duration-300 
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                peer-focus:-top-2.5 peer-focus:text-blue-600"
              >
                {field.label}
              </label>
              {fieldErrors[field.id] && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors[field.id]}
                </p>
              )}
            </div>
          ))}

          {/* State Dropdown */}
          <div className="relative">
            <select
              id="states"
              name="states"
              value={formData.states}
              onChange={handleInputChange}
              className={`px-4 py-3 w-full bg-white border-2 ${
                fieldErrors.states ? "border-red-500" : "border-gray-600"
              } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 transition-all duration-300 appearance-none cursor-pointer ${
                !formData.states ? "text-gray-400" : "text-gray-900"
              }`}
              required
            >
              <option value="" disabled>
                
              </option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <label
              htmlFor="states"
              className={`absolute left-3 bg-white px-1 text-sm transition-all duration-300 pointer-events-none ${
                formData.states
                  ? "-top-2.5 text-blue-600"
                  : "top-3 text-base text-gray-600"
              }`}
            >
              State
            </label>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {fieldErrors.states && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.states}</p>
            )}
          </div>

          {/* Profile Upload */}
          <div className="relative">
            <input
              type="file"
              id="profile"
              name="profile"
              accept="image/*"
              onChange={handleFileChange}
              className="peer px-4 py-3 w-full bg-transparent border-2 border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 transition-all duration-300"
            />
            <label
              htmlFor="profile"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600"
            >
              Profile Photo (optional)
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                fieldErrors.password ? "border-red-500" : "border-gray-600"
              } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-transparent transition-all duration-300 pr-12`}
              placeholder="Password"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all duration-300 
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
              peer-focus:-top-2.5 peer-focus:text-blue-600"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-blue-500 transition-all duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="new-password"
              className={`peer px-4 py-3 w-full bg-transparent border-2 ${
                fieldErrors.confirmPassword ? "border-red-500" : "border-gray-600"
              } rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-transparent transition-all duration-300 pr-12`}
              placeholder="Confirm Password"
              required
            />
            <label
              htmlFor="confirmPassword"
              className="absolute left-3 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all duration-300 
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
              peer-focus:-top-2.5 peer-focus:text-blue-600"
            >
              Confirm Password
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-blue-500 transition-all duration-200"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Bottom Links */}
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href={`/login${
                  redirectUrl !== "/profile"
                    ? `?redirect=${encodeURIComponent(redirectUrl)}`
                    : ""
                }`}
                className="text-blue-600 hover:text-blue-400 hover:underline transition-all duration-200"
              >
                Login
              </a>
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#290c52] text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                    5.2A7.963 7.963 0 014 12H0c0 
                    3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {success && (
          <p className="mt-4 text-center text-sm text-green-600 animate-fade">
            {success}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
