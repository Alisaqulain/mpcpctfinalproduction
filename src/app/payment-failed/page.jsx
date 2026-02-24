"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const paymentId = searchParams.get("paymentId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600">
              Your payment could not be processed
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              What went wrong?
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              {error || "The payment was cancelled or failed. Please try again or use a different payment method."}
            </p>
            
            {paymentId && (
              <div className="mt-4 p-3 bg-white rounded border border-red-200">
                <p className="text-xs text-gray-500 mb-1">Payment ID:</p>
                <p className="text-sm font-mono text-gray-900 break-all">{paymentId}</p>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ If money was deducted, please contact support with this Payment ID for a refund.
                </p>
              </div>
            )}

            {!paymentId && (
              <p className="text-xs text-gray-500 mt-3">
                No money was deducted. You can safely try again.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href="/payment-app"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center"
            >
              Try Again
            </Link>

            <Link
              href="/contact"
              className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              Contact Support {paymentId && "(Refund Request)"}
            </Link>

            <Link
              href="/"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}

