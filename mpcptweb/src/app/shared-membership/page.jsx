"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SharedMembershipPage() {
  const [subscription, setSubscription] = useState(null);
  const [shareLink, setShareLink] = useState("");
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile", {
        credentials: "include",
      });
      const data = await response.json();
      
      if (response.ok && data.subscription) {
        setSubscription(data.subscription);
        // Fetch progress if subscription exists
        const subscriptionId = data.subscription._id || data.subscription.id;
        if (subscriptionId) {
          fetchProgress(subscriptionId);
        }
      } else {
        setError("No active subscription found");
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (subscriptionId) => {
    try {
      const response = await fetch(
        `/api/shared-membership/progress?subscriptionId=${subscriptionId}`,
        { credentials: "include" }
      );
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProgress(data);
        // If shareToken exists, generate link automatically
        if (data.subscription.shareToken) {
          generateShareLinkFromToken(data.subscription.shareToken);
        }
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
    }
  };

  const generateShareLinkFromToken = (token) => {
    // Always use production domain for share links (mpcpct.com)
    // This ensures links work even when generated from localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mpcpct.com';
    const link = `${baseUrl}/shared-membership/activate?token=${token}`;
    setShareLink(link);
  };

  const handleGenerateLink = async () => {
    if (!subscription) {
      setError("No subscription found. Please ensure you have an active subscription.");
      return;
    }
    
    // Get subscription ID (support both _id and id)
    const subscriptionId = subscription._id || subscription.id;
    if (!subscriptionId) {
      setError("Subscription ID not found. Please refresh the page.");
      return;
    }
    
    try {
      setGenerating(true);
      setError(null); // Clear any previous errors
      const response = await fetch("/api/shared-membership/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscriptionId }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShareLink(data.shareLink);
        // Refresh progress to get updated token
        fetchProgress(subscriptionId);
      } else {
        setError(data.error || "Failed to generate share link");
      }
    } catch (err) {
      console.error("Error generating link:", err);
      setError("Failed to generate share link. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert("Share link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/price")}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Purchase Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#290c52] text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">Shared Membership</h1>
          <p className="text-yellow-400 mt-2">Share your membership with up to 3 users</p>
        </div>

        {/* Share Link Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Share Your Membership</h2>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {!shareLink ? (
            <div className="space-y-4">
              <button
                onClick={handleGenerateLink}
                disabled={generating || !subscription}
                className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {generating ? "Generating..." : "Generate Share Link"}
              </button>
              <p className="text-sm text-gray-500 text-center">
                Click the button above to generate your unique share link
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Share Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-white px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-semibold whitespace-nowrap"
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateLink}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm font-semibold"
                >
                  {generating ? "Regenerating..." : "🔄 Regenerate Link"}
                </button>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>💡 Tip:</strong> Share this link with up to 3 friends. Each friend will get <strong>+1 month FREE</strong> when they activate!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {progress && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Share Progress</h2>
            
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Shared usage:</span>
                <span className={`text-lg font-bold ${
                  progress.progress.activated === progress.progress.limit 
                    ? 'text-green-600' 
                    : 'text-purple-600'
                }`}>
                  {progress.progress.usage}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${
                    progress.progress.activated === progress.progress.limit
                      ? 'bg-green-500'
                      : 'bg-purple-500'
                  }`}
                  style={{
                    width: `${(progress.progress.activated / progress.progress.limit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Reward Status */}
            <div className={`p-4 rounded-lg border-2 ${
              progress.rewardStatus.granted
                ? 'bg-green-50 border-green-500'
                : 'bg-yellow-50 border-yellow-500'
            }`}>
              <p className={`font-semibold ${
                progress.rewardStatus.granted
                  ? 'text-green-800'
                  : 'text-yellow-800'
              }`}>
                {progress.rewardStatus.message}
              </p>
            </div>

            {/* Activations List */}
            {progress.activations && progress.activations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Activated Users</h3>
                <div className="space-y-2">
                  {progress.activations.map((activation, idx) => (
                    <div
                      key={activation._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {activation.sharedUser.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activation.sharedUser.email}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(activation.activatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subscription Info */}
        {subscription && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan Type</p>
                <p className="font-semibold text-gray-800">
                  {subscription.type === "all" ? "Complete Subscription" : subscription.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

