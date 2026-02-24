"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");
  const error = searchParams.get("error");
  const [subscriptionStatus, setSubscriptionStatus] = useState("processing");
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!paymentId) return;
    
    const checkSubscriptionStatus = async () => {
      try {
        const res = await fetch(`/api/subscriptions/check?paymentId=${paymentId}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            setSubscriptionStatus("active");
            setCheckingSubscription(false);
            return true;
          } else {
            setSubscriptionStatus("pending");
            setCheckingSubscription(false);
            return false;
          }
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
        setSubscriptionStatus("pending");
        setCheckingSubscription(false);
        return false;
      }
    };
    
    // Check immediately
    checkSubscriptionStatus();
    
    // Also poll every 2 seconds for a few times in case of any delay
    let pollCount = 0;
    const maxPolls = 5; // 10 seconds total
    const pollInterval = setInterval(async () => {
      pollCount++;
      const isActive = await checkSubscriptionStatus();
      if (pollCount >= maxPolls || isActive) {
        clearInterval(pollInterval);
      }
    }, 2000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [paymentId]);

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
              Payment Successful! 🎉
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
                  <span className="font-medium text-gray-900 font-mono text-sm">
                    {paymentId}
                  </span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-gray-900 font-mono text-sm">
                    {orderId}
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
                <span className="text-gray-600">Payment Status:</span>
                <span className="font-medium text-green-600">✓ Success</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subscription:</span>
                {checkingSubscription ? (
                  <span className="text-sm text-gray-500">Processing...</span>
                ) : subscriptionStatus === "active" ? (
                  <span className="font-medium text-green-600">✓ Active</span>
                ) : (
                  <span className="text-sm text-yellow-600">
                    ⏳ Activating (may take a few moments)
                  </span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Notice:</strong> {decodeURIComponent(error)}
                <br />
                <span className="text-xs mt-1 block">Your payment was successful. If subscription is not active, please contact support with your Payment ID.</span>
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Thank you for your purchase!</strong> {subscriptionStatus === "active" 
                ? "Your subscription is now active and you have full access to all content." 
                : "Your subscription is being activated. If you don't see access within a few minutes, please contact support with your Payment ID."}
            </p>
          </div>

          <div className="space-y-3">
            {subscriptionStatus === "active" && (
              <Link
                href="/profile"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center"
              >
                View Membership Details
              </Link>
            )}
            <Link
              href="/"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center"
            >
              Go Back Home
            </Link>
            <Link
              href="/contact"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              Contact Support
            </Link>
          </div>
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

