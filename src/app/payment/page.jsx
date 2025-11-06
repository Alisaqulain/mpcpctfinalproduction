"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Helper function to load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        alert("Failed to load Razorpay. Please try again.");
        setLoading(false);
        return;
      }

      // Create Razorpay options
      const options = {
        key: "rzp_test_1234567890", // Test key
        amount: amountValue * 100, // Amount in paise
        currency: "INR",
        name: "MPCPCT Demo",
        description: "Demo Payment",
        order_id: "order_DEMO123", // Fake order ID
        handler: function (response) {
          // On success, redirect to payment-success page
          router.push(
            `/payment-success?payment_id=${response.razorpay_payment_id}&amount=${amountValue}`
          );
        },
        prefill: {
          name: "Demo User",
          email: "demo@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            // On modal close, redirect to payment-failed
            router.push("/payment-failed");
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        // On payment failure, redirect to payment-failed
        router.push("/payment-failed");
      });
      
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      router.push("/payment-failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Demo
            </h1>
            <p className="text-gray-600">
              Enter amount to proceed with payment
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={loading || !amount}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              "Pay Now"
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This is a demo payment. No real transaction will be processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
