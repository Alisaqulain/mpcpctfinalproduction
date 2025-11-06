"use client";
import React from "react";
import Link from "next/link";

export default function PaymentFailedPage() {
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
            <p className="text-sm text-gray-600">
              The payment was cancelled or failed. Please try again or use a
              different payment method.
            </p>
          </div>

          <Link
            href="/payment"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center mb-4"
          >
            Try Again
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
  );
}

