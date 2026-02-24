"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10,15}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10-15 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.newPassword) newErrors.newPassword = "New password is required";
    else if (formData.newPassword.length < 8)
      newErrors.newPassword = "At least 8 characters";

    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        step: 1,
        email: formData.email,
        phone: formData.phone,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setStep(2);
      setMessage("");
    } else {
      setMessage(data.message || "Something went wrong");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        step: 2,
        email: formData.email,
        phone: formData.phone,
        newPassword: formData.newPassword,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setMessage("Password changed successfully!");
      setFormData({
        email: "",
        phone: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStep(1);
    } else {
      setMessage(data.message || "Error updating password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-[#290c52] mb-5 text-center">
          {step === 1 ? "Forgot Password" : "Create New Password"}
        </h2>

        {message && (
          <p className="text-sm text-center mb-4 text-red-500 font-medium">{message}</p>
        )}

        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleVerify}>
            <Input
              label="Email"
              name="email"
              value={formData.email}
              error={errors.email}
              onChange={handleChange}
              type="email"
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              error={errors.phone}
              onChange={handleChange}
              type="tel"
            />
            <Button label="Verify" />
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleChangePassword}>
            <PasswordInput
              label="New Password"
              name="newPassword"
              value={formData.newPassword}
              error={errors.newPassword}
              onChange={handleChange}
              show={showNewPassword}
              toggle={() => setShowNewPassword((prev) => !prev)}
            />
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              error={errors.confirmPassword}
              onChange={handleChange}
              show={showConfirmPassword}
              toggle={() => setShowConfirmPassword((prev) => !prev)}
            />
            <Button label="Change Password" />
          </form>
        )}
      </div>
    </div>
  );
}

function Input({ label, name, value, error, onChange, type = "text" }) {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`peer w-full border-2 rounded-lg py-3 px-4 text-gray-900 placeholder-transparent bg-transparent focus:outline-none focus:border-indigo-500 transition-all duration-300 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholder={label}
      />
      <label className="absolute left-4 -top-2.5 text-sm bg-transparent px-1 text-gray-600 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600">
        {label}
      </label>
      {error && <p className="text-sm mt-1 text-red-500">{error}</p>}
    </div>
  );
}

function PasswordInput({ label, name, value, error, onChange, show, toggle }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className={`peer w-full border-2 rounded-lg py-3 px-4 pr-12 text-gray-900 placeholder-transparent bg-transparent focus:outline-none focus:border-indigo-500 transition-all duration-300 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholder={label}
      />
      <label className="absolute left-4 -top-2.5 text-sm bg-transparent px-1 text-gray-600 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600">
        {label}
      </label>
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 inset-y-0 flex items-center text-gray-500 hover:text-indigo-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
      {error && <p className="text-sm mt-1 text-red-500">{error}</p>}
    </div>
  );
}

function Button({ label }) {
  return (
    <button
      type="submit"
      className="w-full bg-[#290c52] text-white rounded-lg py-3 text-sm font-semibold hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-indigo-200"
    >
      {label}
    </button>
  );
}
