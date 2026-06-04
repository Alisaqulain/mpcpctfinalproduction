"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IndianRupee as RupeeIcon } from "lucide-react";

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

function PaymentAppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get("plan") || "oneMonth");
  const [features, setFeatures] = useState([]);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [planModalKey, setPlanModalKey] = useState(null);
  
  const type = "all"; // Unified subscription for all content types
  const amount = searchParams.get("amount");
  const duration = searchParams.get("duration");

  const fetchFeatures = async () => {
    try {
      const res = await fetch('/api/features');
      if (res.ok) {
        const data = await res.json();
        setFeatures(data.features || []);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPricing();
    fetchFeatures();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      // Fetch pricing for learning type (we'll use it for all types)
      const res = await fetch(`/api/pricing?type=learning`);
      if (res.ok) {
        const data = await res.json();
        // If single pricing object, wrap it in an object with type as key
        if (data.pricing && !data.pricing.learning && data.pricing.plans) {
          const pricingMap = {};
          pricingMap.learning = data.pricing;
          setPricing(pricingMap);
        } else {
          setPricing(data.pricing);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const validateReferral = async () => {
    if (!referralCode.trim()) {
      alert('Please enter a referral code');
      return;
    }

    setValidatingReferral(true);
    try {
      const res = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
        credentials: 'include'
      });
      const data = await res.json();
      setReferralValid(data.valid);
      if (data.valid) {
        alert(data.message);
      } else {
        alert(data.error || 'Invalid referral code');
      }
    } catch (error) {
      console.error('Referral validation error:', error);
      alert('Failed to validate referral code');
    } finally {
      setValidatingReferral(false);
    }
  };

  const handlePayment = async () => {
    const planData = pricing?.learning?.plans?.[selectedPlan] || {
      price: 499,
      originalPrice: 999,
      discount: 50,
      duration: 30
    };

    if (!planData.price || !planData.duration) {
      alert('Invalid payment details');
      return;
    }

    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay. Please try again.");
        setLoading(false);
        return;
      }

      // Create order
      const orderRes = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(planData.price),
          currency: 'INR',
          receipt: `sub_all_${Date.now()}`
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        order_id: orderData.order.id,
        name: "MPCPCT Subscription",
        description: `Complete Subscription - ${selectedPlan} (All Content Types)`,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phoneNumber || "",
        },
        theme: {
          color: "#290c52",
        },
        handler: async function (response) {
          // First verify payment with Razorpay before creating subscription
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.verified) {
              console.error('Payment verification failed:', verifyData);
              router.push(`/payment-failed?error=${verifyData.error || 'Payment verification failed'}`);
              return;
            }

            // Payment verified successfully - create subscription BEFORE redirecting
            try {
              const subRes = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: "all",
                  plan: selectedPlan,
                  amount: parseFloat(planData.price),
                  duration: parseInt(planData.duration),
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id
                }),
                credentials: 'include'
              });

              const subData = await subRes.json();
              
              if (subRes.ok && subData.subscription) {
                console.log('Subscription created successfully:', subData.subscription._id);
                
                // Apply referral if valid
                if (referralValid && referralCode.trim()) {
                  try {
                    await fetch('/api/referral/apply', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        referralCode: referralCode.trim(),
                        subscriptionId: subData.subscription._id || subData.subscription.id
                      }),
                      credentials: 'include'
                    });
                  } catch (refError) {
                    console.error('Referral apply error:', refError);
                  }
                }
                
                // Redirect to success page after subscription is created
                router.push(`/payment-success?payment_id=${response.razorpay_payment_id}&amount=${planData.price}&orderId=${response.razorpay_order_id}&plan=${selectedPlan}&duration=${planData.duration}&referralCode=${encodeURIComponent(referralCode.trim())}`);
              } else {
                console.error('Subscription creation failed:', subData.error || subData);
                // Still redirect but show warning
                router.push(`/payment-success?payment_id=${response.razorpay_payment_id}&amount=${planData.price}&orderId=${response.razorpay_order_id}&plan=${selectedPlan}&duration=${planData.duration}&error=${encodeURIComponent(subData.error || 'Subscription creation failed')}`);
              }
            } catch (subError) {
              console.error('Subscription creation error:', subError);
              // Still redirect but show error
              router.push(`/payment-success?payment_id=${response.razorpay_payment_id}&amount=${planData.price}&orderId=${response.razorpay_order_id}&plan=${selectedPlan}&duration=${planData.duration}&error=${encodeURIComponent('Failed to create subscription. Please contact support.')}`);
            }
          } catch (error) {
            console.error('Payment processing error:', error);
            router.push(`/payment-failed?error=Payment processing failed. Please contact support if amount was deducted.&paymentId=${response.razorpay_payment_id}`);
          }
        },
        modal: {
          ondismiss: function () {
            router.push("/payment-failed");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
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

  const plans = pricing?.learning?.plans || {
    oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
    threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
    sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
  };

  const planData = plans[selectedPlan] || plans.oneMonth;

  const handlePlanClick = (key) => {
    setSelectedPlan(key);
    setPlanModalKey(key);
  };

  return (
    <div className="bg-white max-md:h-[calc(100dvh-10rem)] max-md:overflow-hidden md:min-h-screen flex items-center justify-center px-2 py-2 md:p-4">
      <div className="w-full max-w-2xl max-md:max-h-full max-md:overflow-hidden flex flex-col space-y-2 md:space-y-6">
        <div className="hidden md:block bg-[#F7FFEF] text-[#333333] text-center py-8 px-2 rounded-md font-medium text-2xl">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Choose Your Plan</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowFeaturesModal(true)}
            className="bg-[#290c52] text-white px-6 py-3 rounded-md text-base font-medium hover:bg-[#3a1a6b] transition-colors shadow-lg"
          >
            📋 View All Features
          </button>
        </div>

        <div className="border border-blue-200 rounded-md p-2.5 sm:p-4 shrink-0">
          <h3 className="text-center text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-[#484848]">
            Select Plan Duration
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { key: "oneMonth", label: "1 Month", plan: plans.oneMonth },
              { key: "threeMonths", label: "3 Months", plan: plans.threeMonths },
              { key: "sixMonths", label: "6 Months", plan: plans.sixMonths },
            ].map(({ key, label, plan }) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePlanClick(key)}
                className={`p-2 sm:p-4 border-2 rounded-lg transition-all text-left ${
                  selectedPlan === key
                    ? "border-[#290c52] bg-[#290c52] text-white"
                    : "border-gray-300 hover:border-[#290c52] bg-white text-gray-900"
                }`}
              >
                <div className="font-semibold text-xs sm:text-base">{label}</div>
                <div className="text-xs sm:text-sm mt-0.5 sm:mt-1">
                  <RupeeIcon className="w-3 h-3 inline-block" />
                  {plan.price}
                </div>
                {plan.originalPrice > plan.price && (
                  <div
                    className={`text-[10px] sm:text-xs line-through mt-0.5 sm:mt-1 font-medium ${
                      selectedPlan === key ? "text-red-200" : "text-red-600"
                    }`}
                  >
                    <RupeeIcon className="w-3 h-3 inline-block" />
                    {plan.originalPrice}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-blue-200 rounded-md flex-1 min-h-0 max-md:overflow-hidden">
          <div className="bg-white rounded-md p-3 sm:p-6 space-y-2.5 sm:space-y-4 max-md:overflow-hidden">
            <h2 className="text-center text-base sm:text-lg text-[#484848] font-medium">
              Pay{" "}
              <span className="text-green-600 font-bold inline-flex items-center">
                <RupeeIcon className="w-4 h-4" />
                {planData.price}
              </span>{" "}
              only
            </h2>

            {planData.originalPrice > planData.price && (
              <div className="bg-gray-100 p-2 sm:p-4 rounded-md text-center text-[#484848] w-full sm:w-[70%] mx-auto text-xs sm:text-sm">
                <p className="font-medium">Special Offer!</p>
                <p>
                  Original Price:{" "}
                  <span className="line-through text-red-600">
                    <RupeeIcon className="w-3 h-3 inline-block" />
                    {planData.originalPrice}
                  </span>
                  <br />
                  You Save:{" "}
                  <span className="text-green-600 font-semibold">
                    <RupeeIcon className="w-3 h-3 inline-block" />
                    {planData.originalPrice - planData.price}
                  </span>
                  <br />
                  Validity: {planData.duration} days
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  placeholder="ENTER REFERRAL CODE (OPT)"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value.toUpperCase());
                    setReferralValid(null);
                  }}
                  className="border border-gray-300 rounded-md p-1.5 sm:p-2 flex-1 max-w-[65%] text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#290c52] uppercase"
                />
                <button
                  type="button"
                  onClick={validateReferral}
                  disabled={validatingReferral || !referralCode.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium shrink-0"
                >
                  {validatingReferral ? "..." : "Verify"}
                </button>
              </div>
              {referralValid === true && (
                <p className="text-center text-[10px] sm:text-sm text-green-600 font-semibold">
                  ✓ Referral valid — 1 month free after payment!
                </p>
              )}
              {referralValid === false && (
                <p className="text-center text-[10px] sm:text-sm text-red-600">Invalid referral code</p>
              )}
              <p className="hidden sm:block text-xs text-center text-gray-500">
                Using a referral code gives you 1 month free! If the referrer has a paid course and gets 3
                referrals, they&apos;ll also get 1 month free.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="w-full sm:w-[60%] mx-auto bg-[#290c52] text-white py-2.5 sm:py-2 rounded-sm font-medium flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  Pay{" "}
                  <span className="text-green-400 font-bold inline-flex items-center">
                    <RupeeIcon className="w-4 h-4" />
                    {planData.price}
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] sm:text-xs text-center text-[#666666]">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>

      {planModalKey && (
        <PlanFeaturesModal
          planKey={planModalKey}
          plan={plans[planModalKey]}
          features={features}
          onClose={() => setPlanModalKey(null)}
        />
      )}

      {showFeaturesModal && (
        <FeaturesModal features={features} onClose={() => setShowFeaturesModal(false)} />
      )}
    </div>
  );
}

const PLAN_FEATURE_DETAILS = {
  oneMonth: {
    title: "1 Month Plan — सुविधाएँ",
    validity: "30 days validity",
    highlights: [
      "Full access to Learning (Typing सीखें)",
      "Unlimited Skill Test & Typing Practice",
      "Exam Mode — CPCT / CCC / RSCIT mock tests",
      "Topic-wise MCQ practice",
      "PDF Notes & Syllabus download",
      "Video notes access",
    ],
  },
  threeMonths: {
    title: "3 Months Plan — सुविधाएँ",
    validity: "90 days validity — best for regular practice",
    highlights: [
      "Everything in 1 Month plan",
      "3 months uninterrupted access — no renewal hassle",
      "Save ₹1000 vs monthly pricing",
      "Priority content updates for 90 days",
      "All exam & typing sections unlocked",
      "Referral reward eligible (1 month free on valid code)",
    ],
  },
  sixMonths: {
    title: "6 Months Plan — सुविधाएँ",
    validity: "180 days validity — maximum savings",
    highlights: [
      "Everything in 3 Months plan",
      "6 months full platform access",
      "Biggest discount — save ₹1500 vs original price",
      "Best for long CPCT / CCC preparation",
      "All learning, exam, notes & typing unlocked",
      "Ideal for daily practice till exam date",
    ],
  },
};

function PlanFeaturesModal({ planKey, plan, features, onClose }) {
  const detail = PLAN_FEATURE_DETAILS[planKey] || PLAN_FEATURE_DETAILS.oneMonth;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-[#290c52] text-white px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-bold pr-2">{detail.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white text-2xl leading-none hover:opacity-80"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <p className="text-center text-sm text-gray-600 mb-1">{detail.validity}</p>
          <p className="text-center text-lg font-bold text-[#290c52] mb-3">
            <RupeeIcon className="w-4 h-4 inline-block" />
            {plan?.price}{" "}
            <span className="text-red-600 line-through text-sm font-normal ml-1">
              <RupeeIcon className="w-3 h-3 inline-block" />
              {plan?.originalPrice}
            </span>
          </p>
          <ul className="space-y-2 text-sm text-gray-800">
            {detail.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {features.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2">Also included:</p>
              <ul className="space-y-1 text-xs text-gray-700">
                {features.slice(0, 4).map((f, i) => (
                  <li key={f._id || i}>• {f.title}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full bg-[#290c52] text-white py-2.5 rounded-md font-medium hover:bg-[#3a1a6b]"
          >
            OK, Select This Plan
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturesModal({ features, onClose }) {
  // Default features if none exist
  const displayFeatures = features.length > 0 ? features : [
    {
      title: "Unlimited Learning",
      description: "1 month free unlimited access to all learning materials (Learning, Skill Test, Exam)",
      icon: "📚"
    },
    {
      title: "Skill Test",
      description: "Practice with skill tests to improve your performance",
      icon: "🎯"
    },
    {
      title: "Exam Mode",
      description: "Take full-length exams in exam mode",
      icon: "📝"
    },
    {
      title: "Free PDF",
      description: "Download free PDF materials and notes",
      icon: "📄"
    },
    {
      title: "Syllabus PDF",
      description: "Access complete syllabus in PDF format",
      icon: "📋"
    },
    {
      title: "Video Notes",
      description: "Watch video notes for better understanding",
      icon: "📹"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#290c52] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold">✨ Subscription Features</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 text-center">
            <p className="text-lg text-gray-700 font-medium">
              With your subscription, you get access to all these amazing features:
            </p>
          </div>
          <div className="space-y-4">
            {displayFeatures.map((feature, index) => (
              <div key={feature._id || index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-4xl flex-shrink-0">{feature.icon || '✓'}</div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-800 mb-1">{feature.title}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">{feature.description}</div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center">
                  {feature.showWrong ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 text-2xl font-bold">✗</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-2xl font-bold">✓</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-center text-green-800 font-semibold">
                🎉 All features are included with your subscription!
              </p>
              <p className="text-center text-sm text-green-700 mt-2">
                One subscription unlocks access to Learning, Skill Test, and Exam sections
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="bg-[#290c52] text-white px-8 py-3 rounded-md font-medium hover:bg-[#3a1a6b] transition-colors shadow-lg"
            >
              Got it! Let's Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentApp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <PaymentAppContent />
    </Suspense>
  );
}
