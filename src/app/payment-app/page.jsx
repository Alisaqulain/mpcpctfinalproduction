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
  
  const type = "all"; // Unified subscription for all content types
  const amount = searchParams.get("amount");
  const duration = searchParams.get("duration");

  useEffect(() => {
    fetchUser();
    fetchPricing();
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
    oneMonth: { price: 499, originalPrice: 999, discount: 50, duration: 30 },
    threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
    sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
  };

  const planData = plans[selectedPlan] || plans.oneMonth;

  return (
    <div className="min-h-screen bg-[#fff] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-[#F7FFEF] text-[#333333] text-center py-8 px-2 rounded-md font-medium text-2xl">
          Complete Subscription
          <br />
          <span className="text-sm text-[#13800D]">
            Access to Learning, Exam & Skill Test - Choose your plan
          </span>
        </div>

        {/* Plan Selection */}
        <div className="border border-blue-200 rounded-md p-4">
          <h3 className="text-center text-lg font-semibold mb-4 text-[#484848]">Select Plan Duration</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'oneMonth', label: '1 Month', plan: plans.oneMonth },
              { key: 'threeMonths', label: '3 Months', plan: plans.threeMonths },
              { key: 'sixMonths', label: '6 Months', plan: plans.sixMonths }
            ].map(({ key, label, plan }) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPlan === key
                    ? 'border-[#290c52] bg-[#290c52] text-white'
                    : 'border-gray-300 hover:border-[#290c52]'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-sm mt-1">
                  <RupeeIcon className="w-3 h-3 inline-block" />
                  {plan.price}
                </div>
                {plan.originalPrice > plan.price && (
                  <div className="text-xs line-through opacity-75 mt-1">
                    <RupeeIcon className="w-3 h-3 inline-block" />
                    {plan.originalPrice}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-blue-200 rounded-bl-md rounded-br-md">
          <div className="bg-white rounded-md p-6 space-y-6">
            <h2 className="text-center text-lg text-[#484848]">
              Pay <RupeeIcon className="w-4 h-4 inline-block" />{planData.price} only
            </h2>

            {planData.originalPrice > planData.price && (
              <div className="bg-gray-100 p-4 rounded-md text-center space-y-1 text-[#484848] w-[70%] mx-auto">
                <div className="py-2">
                  <p className="font-medium">Special Offer!</p>
                  <p className="text-sm">
                    Original Price: <span className="line-through"><RupeeIcon className="w-4 h-4 inline-block" />{planData.originalPrice}</span>
                    <br />
                    You Save: <span className="text-green-600 font-semibold"><RupeeIcon className="w-4 h-4 inline-block" />{planData.originalPrice - planData.price}</span>
                    <br />
                    Validity: {planData.duration} days
                  </p>
                </div>
              </div>
            )}

            {/* Referral Code Section */}
            <div className="space-y-2">
              <div className="flex justify-center gap-2">
                <input
                  type="text"
                  placeholder="Enter referral code (optional)"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value.toUpperCase());
                    setReferralValid(null);
                  }}
                  className="border border-gray-300 rounded-md p-2 w-[70%] text-center focus:outline-none focus:ring-2 focus:ring-[#290c52] uppercase"
                />
                <button
                  onClick={validateReferral}
                  disabled={validatingReferral || !referralCode.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium"
                >
                  {validatingReferral ? 'Checking...' : 'Verify'}
                </button>
              </div>
              {referralValid === true && (
                <p className="text-center text-sm text-green-600 font-semibold">
                  ✓ Referral code valid! You'll get 1 month free after payment!
                </p>
              )}
              {referralValid === false && (
                <p className="text-center text-sm text-red-600">
                  Invalid referral code
                </p>
              )}
              <p className="text-xs text-center text-gray-500">
                Using a referral code gives you 1 month free! If the referrer has a paid course and gets 3 referrals, they'll also get 1 month free.
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-[60%] mx-auto bg-[#290c52] text-white py-2 rounded-sm font-medium flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  Pay <RupeeIcon className="w-4 h-4 inline-block" /> {planData.price}
                </>
              )}
            </button>

            <p className="text-xs text-center text-[#666666]">
              Secure payment powered by Razorpay
            </p>
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
