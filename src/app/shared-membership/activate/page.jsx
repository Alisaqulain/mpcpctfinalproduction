"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ActivateSharedMembershipContent() {
  const [token, setToken] = useState("");
  const [validation, setValidation] = useState(null);
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenParam = searchParams?.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setLoading(false);
      setError("No share token provided");
    }
  }, [searchParams]);

  const validateToken = async (shareToken) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/shared-membership/validate-token?token=${shareToken}`,
        { credentials: "include" }
      );
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setValidation(data);
      } else {
        setError(data.error || "Invalid or expired share token");
      }
    } catch (err) {
      console.error("Error validating token:", err);
      setError("Failed to validate share token");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!token) return;
    
    try {
      setActivating(true);
      setError(null);
      
      const response = await fetch("/api/shared-membership/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken: token }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          router.push("/profile");
        }, 3000);
      } else {
        setError(data.error || "Failed to activate shared membership");
      }
    } catch (err) {
      console.error("Error activating:", err);
      setError("Failed to activate shared membership");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating share link...</p>
        </div>
      </div>
    );
  }

  if (error && !validation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Activation Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-green-500 text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Activation Successful!</h1>
          <p className="text-gray-600 mb-4">
            You've successfully activated the shared membership!
          </p>
          <p className="text-green-600 font-semibold mb-6">
            🎁 +1 month has been added to your plan!
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Activate Shared Membership
          </h1>
          {validation && (
            <p className="text-green-600 font-semibold">
              {validation.message}
            </p>
          )}
        </div>

        {/* Info Box */}
        {validation && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Owner:</strong> {validation.subscription.ownerName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Plan Type:</strong> {validation.subscription.type === "all" ? "Complete Subscription" : validation.subscription.type}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Remaining Slots:</strong> {validation.remainingSlots}
              </p>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">What You Get:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✅ +1 month FREE added to your plan</li>
            <li>✅ Full access to all content</li>
            <li>✅ Immediate activation</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Activate Button */}
        {validation && validation.valid && (
          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {activating ? "Activating..." : "Activate Now"}
          </button>
        )}

        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="w-full mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ActivateSharedMembershipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ActivateSharedMembershipContent />
    </Suspense>
  );
}

