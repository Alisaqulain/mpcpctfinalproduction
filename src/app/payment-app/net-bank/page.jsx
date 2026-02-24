"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
   const paymentOptions = [
    { name: "UPI", path: "/payment-app/upi", icon: "/upi.png" },
    { name: "Redeem Code", path: "/payment-app/net-bank", icon: "/redeemr.png" },
    { name: "Debit Card", path: "/payment-app/debit-card", icon: "/cardr.png" },
    { name: "Credit Card", path: "/payment-app/credit-card", icon: "/cardr.png" },
  ];

  const banks = ["Axis Bank", "Yes Bank", "IDBI Bank", "DBS Bank", "Indian Bank"];
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const dropdownRef = useRef(null);
  const rander = [{ inr: "1999" }];
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Make Payment Click
  const handleMakePayment = () => {
    alert("Proceeding with payment...");
    router.push("/pay-sucess");
  };

  // Handle Redeem Click
  const handleRedeem = () => {
    alert(`You entered: ${couponCode}`);
  };

  // Handle Cancel Click
  const handleCancel = () => {
    alert("Payment canceled.");
  };

  return (
    <div className="min-h-screen bg-white font-sans p-4 sm:p-6 mb-10 sm:mb-20">
      <div className="container mx-auto max-w-7xl">
        {/* Timer */}
        <div className="border h-14 sm:h-17 bg-[#290c52] text-[#fff] text-center text-lg sm:text-2xl pt-3 sm:pt-4 rounded-md shadow-md">
          Transaction times out in 4:53 Mins
        </div>

        <div className="border border-[#000] my-8 sm:my-14"></div>
        <h2 className="text-xl sm:text-[25px] font-semibold mb-4 sm:mb-6 mt-[-20px] text-[#290c52]">
          Payment Information
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Payment Methods */}
            {/* Left Payment Buttons */}
          <div className="space-y-4 col-span-1 flex flex-col items-center md:items-start">
            {paymentOptions.map((item, index) => (
              <Link
                href={item.path}
                key={index}
                className={`flex items-center gap-3 w-full sm:w-[60%] py-4 sm:py-6 rounded mb-4 sm:mb-10 px-4 font-medium transition ${
                  item.name === "Redeem Code"
                    ? "bg-[#290c52] text-white hover:bg-[#153e6d]"
                    : "bg-[#F8F8F8] text-gray-800 hover:bg-gray-200"
                }`}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="h-5 w-5 sm:h-7 sm:w-12 object-contain"
                />
<span
  className={`flex-1 text-left ${
    item.name === "Redeem Code" ? "text-md sm:text-[13px]" : "text-base sm:text-sm"
  }`}
>
  {item.name}
</span>
              </Link>
            ))}
          </div>


          {/* Redeem Coupon Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full lg:w-[220%] text-center border hover:border-2 border-[#290c52]">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-2">
              🎁 Redeem Your Coupon
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Enter your coupon code below to claim your offer!
            </p>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter your coupon code"
              className="border border-gray-300 rounded-md p-2 sm:p-3 w-full text-center text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4 sm:mb-4 mt-4 sm:mt-8"
            />
            <button
              onClick={handleRedeem}
              className="bg-[#290c52] hover:bg-indigo-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-md w-full transition duration-300 mt-2"
            >
              Redeventy Now
            </button>
            <p className="mt-4 sm:mt-8 text-xs sm:text-sm text-gray-500">
              Limited time offer. Hurry up!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}