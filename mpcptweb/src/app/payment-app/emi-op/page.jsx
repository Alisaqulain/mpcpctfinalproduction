"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function PaymentPage() {
  const paymentOptions = [
  { name: "Debit Card", path: "/payment-app/debit-card" },
    { name: "Credit Card", path: "/payment-app/credit-card" },
    { name: "Net Banking", path: "/payment-app/net-bank" },
    { name: "Wallet", path: "/payment-app/wallet" },
    { name: "UPI", path: "/payment-app/upi" },
    { name: "EMI Options", path: "/payment-app/emi-op" },
  ];

  const banks = [
    "Axis Bank",
    "Yes Bank",
    "IDBI Bank",
    "DBS Bank",
    "Indian Bank",
    
  ];

   const rander = [{
    nri : "1999",
  }]

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const dropdownRef = useRef(null);

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

  const handleMakePayment = () => {
    alert("Proceeding with payment...");
  };

  const handleCancel = () => {
    alert("Payment canceled.");
  };

  return (
    <div className="min-h-screen bg-white font-sans p-6 mb-10">
      <div className="container mx-auto">
       

        <div className="border h-17 bg-[#290c52] text-[#fff] text-center text-2xl pt-3">
          Transaction times out in 4:53 Mins
        </div>

        <div className="border border-[#000] my-14" />
        <h2 className="text-[25px] font-semibold mb-6 mt-[-20]">
          Payment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Payment Methods */}
          <div className="space-y-4 col-span-1">
            {paymentOptions.map((item, index) => (
              <Link
                href={item.path}
                key={index}
                className={`block w-[60%] py-6 rounded text-center mb-10 px-4 font-medium ${
                  item.name === "EMI Options"
                    ? "bg-[#290c52] text-white hover:bg-[#153e6d]"
                    : "bg-[#F8F8F8] text-gray-800 hover:bg-gray-200"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Wallet/Card Form */}
          <div className="col-span-2 border rounded px-6 ml-[-120] py-6 h-170">
            <div className="relative mt-12" ref={dropdownRef}>
              <label className="pb-2 font-semibold">Pay by</label>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="border px-4 py-4 rounded mt-2 hover:bg-gray-200 text-left w-full text-[#333] font-medium flex items-center justify-between"
              >
                <span>{selectedBank || "Select your Bank"}</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute top-full mt-2 left-0 w-full border rounded bg-white shadow-lg z-10 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold">Select Bank</span>
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="text-xl font-bold text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {banks.map((bank, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setSelectedBank(bank);
                          setShowDropdown(false);
                        }}
                        className="text-lg hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                      >
                        {bank}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mb-4 mt-6 relative">
              <label className="font-medium mt-4 text-[#333333]">
                Card Number
              </label>
              <input
                type="text"
                className="w-full mt-1 border px-3 py-5 border-[#6B6B6B] rounded-md"
              />
              <img
                src="/card2.png"
                alt="Card Icon"
                className="w-10 absolute right-3 bottom-3"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="mt-6 col-span-3">
                <label className="block mb-1 font-medium text-[#333333]">
                  Expiry Date & CVV
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="MM"
                    className="border py-5 text-center rounded-md w-full border-[#6B6B6B] placeholder-black"
                  />
                  <input
                    type="text"
                    placeholder="YY"
                    className="border py-5 text-center rounded-md w-full border-[#6B6B6B] placeholder-black"
                  />
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="CVV"
                      className="border py-5 pr-12 text-center rounded-md w-full border-[#6B6B6B] placeholder-black"
                    />
                    <img
                      src="/card.png"
                      alt="CVV Icon"
                      className="w-10 absolute right-2 top-1/2 transform -translate-y-1/2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[20px] text-[#333333] mb-4">
              I agree with the Privacy Policy by processing with this payment
            </p>

            <p className="text-2xl font-bold text-[#290c52] mb-4">
              INR  {rander[0].nri}.00{" "}
              <span className="text-lg font-normal text-[#666666]">
                (Total Amount Payable)
              </span>
            </p>

            <button
              onClick={handleMakePayment}
              className="w-full bg-[#290c52] text-white py-2 rounded text-2xl font-medium mt-5 cursor-pointer"
            >
              Make Payment
            </button>

            <button
              onClick={handleCancel}
              className="w-full text-[#0e2b4d] mt-2 py-2 font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
