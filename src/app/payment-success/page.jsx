"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Your payment has been processed successfully
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Details
            </h2>
            <div className="space-y-3">
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium text-gray-900">
                    {paymentId}
                  </span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">
                    ₹{parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Success</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium text-gray-900">order_DEMO123</span>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

