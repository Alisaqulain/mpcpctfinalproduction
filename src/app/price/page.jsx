"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "learning");
  const [selectedPlan, setSelectedPlan] = useState("oneMonth");
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch('/api/pricing');
        const data = await res.json();
        setPricing(data.pricing);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const getPlans = () => {
    if (!pricing || !pricing[selectedType]) {
      return {
        oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
        threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
        sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
      };
    }
    return pricing[selectedType].plans;
  };

  const plans = getPlans();
  const planNames = {
    oneMonth: "1 Month",
    threeMonths: "3 Months",
    sixMonths: "6 Months"
  };
  
  const features = {
    learning: {
      oneMonth: ["Access to all learning content", "30 days validity", "Email support"],
      threeMonths: ["All 1 Month features", "90 days validity", "Priority support", "Download certificates"],
      sixMonths: ["All 3 Months features", "180 days validity", "Premium support", "All future updates"]
    },
    skill: {
      oneMonth: ["Access to skill tests", "30 days validity", "Basic analytics"],
      threeMonths: ["All 1 Month features", "90 days validity", "Advanced analytics", "Progress tracking"],
      sixMonths: ["All 3 Months features", "180 days validity", "Unlimited skill tests", "All future updates"]
    },
    exam: {
      oneMonth: ["Access to exam mode", "30 days validity", "Basic results"],
      threeMonths: ["All 1 Month features", "90 days validity", "Detailed analytics", "Performance insights"],
      sixMonths: ["All 3 Months features", "180 days validity", "Unlimited exams", "All future updates"]
    }
  };

  const handleSubscribe = async () => {
    try {
      const selectedPlanData = plans[selectedPlan];
      router.push(`/payment-app?type=${selectedType}&plan=${selectedPlan}&amount=${selectedPlanData.price}&duration=${selectedPlanData.duration}`);
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock premium content and accelerate your learning journey
          </p>
        </div>

        {/* Content Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {["learning", "skill", "exam"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  selectedType === type
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {Object.entries(plans).map(([planKey, plan]) => (
              <div
                key={planKey}
                className={`bg-white rounded-2xl shadow-xl p-8 transition-all hover:scale-105 relative ${
                  selectedPlan === planKey
                    ? "ring-4 ring-purple-500 border-purple-500"
                    : "border border-gray-200"
                }`}
              >
                {plan.discount > 0 && (
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {plan.discount}% OFF
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {planNames[planKey]}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.originalPrice > plan.price && (
                      <span className="text-xl text-gray-400 line-through">
                        ₹{plan.originalPrice}
                      </span>
                    )}
                    <div className="text-4xl font-bold text-purple-600">
                      ₹{plan.price}
                    </div>
                  </div>
                  <div className="text-gray-500">
                    {plan.duration} days validity
                  </div>
                  {plan.discount > 0 && (
                    <div className="text-sm text-green-600 font-semibold mt-1">
                      Save ₹{plan.originalPrice - plan.price}
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {(features[selectedType]?.[planKey] || []).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedPlan(planKey)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    selectedPlan === planKey
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {selectedPlan === planKey ? "Selected" : "Select Plan"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Subscribe Button */}
        {!loading && (
          <div className="text-center">
            <button
              onClick={handleSubscribe}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-xl font-semibold shadow-lg transition-all hover:scale-105"
            >
              Subscribe Now - ₹{plans[selectedPlan]?.price || 0}
            </button>
          </div>
        )}

        {/* Free Trial Info */}
        <div className="text-center mt-8 text-gray-600">
          <p>
            <strong>Free Trial:</strong> Try one lesson/exam for free in each category!
          </p>
          <p className="text-sm mt-2">
            Already have access? <a href="/profile" className="text-purple-600 hover:underline">Check your subscription</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
