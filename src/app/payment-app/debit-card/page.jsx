"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PaymentPage = () => {
  const router = useRouter();
  const paymentOptions = [
    { name: "UPI", path: "/payment-app/upi", icon: "/upi.png" },
    { name: "Redeem Code", path: "/payment-app/net-bank", icon: "/redeemr.png" },
    { name: "Debit Card", path: "/payment-app/debit-card", icon: "/cardr.png" },
    { name: "Credit Card", path: "/payment-app/credit-card", icon: "/cardr.png" },
  ];
  const rander = [{ nri: "1999" }];

  return (
    <div className="min-h-screen bg-white font-sans p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Timer Section */}
        <div className="border bg-[#290c52] text-white text-center text-xl sm:text-2xl py-3">
          Transaction times out in 4:53 Mins
        </div>

        <div className="border border-black my-10 sm:my-14"></div>

        <h2 className="text-xl sm:text-[25px] font-semibold mb-6 -mt-4 sm:mt-0">
          Payment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Payment Methods */}
        <div className="space-y-4 col-span-1 flex flex-col items-center md:items-start">
            {paymentOptions.map((item, index) => (
              <Link
                href={item.path}
                key={index}
                className={`flex items-center gap-3 w-full sm:w-[60%] py-4 sm:py-6 rounded mb-4 sm:mb-10 px-4 font-medium transition ${
                  item.name === "Debit Card"
                    ? "bg-[#290c52] text-white hover:bg-[#153e6d]"
                    : "bg-[#F8F8F8] text-gray-800 hover:bg-gray-200"
                }`}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="h-5 w-5 sm:h-7 sm:w-12 object-contain"
                />
<span
  className={`flex-1 text-left ${
    item.name === "Redeem Code" ? "text-md sm:text-[13px]" : "text-base sm:text-sm"
  }`}
>
  {item.name}
</span>
              </Link>
            ))}
          </div>

          {/* Card Form */}
          <div className="col-span-1 md:col-span-2 border rounded px-4 sm:px-6 py-6 border-[#6B6B6B]">
            <div className="flex items-center gap-2 mb-4 text-sm font-medium mt-3">
              <span className="text-[15px]">We Accept :</span>
              <img src="/inter.png" alt="Visa" className="h-5 sm:h-6" />
            </div>

            <div className="mb-4 relative">
              <label className="font-medium text-[#333333]">Card Number</label>
              <input
                type="text"
                className="w-full mt-1 border px-3 py-4 border-[#6B6B6B] rounded-md"
                placeholder=""
              />
              <img
                src="/card2.png"
                alt="Card Icon"
                className="w-10 absolute bottom-3 right-4"
              />
            </div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
  <div className="mt-6 w-full">
    <label className="block mb-1 font-medium text-[#333333]">Expiry Date</label>
    <div className="flex flex-wrap sm:flex-nowrap gap-2">
      {/* Month */}
      <input
        type="text"
        placeholder="Month"
        className="border py-5 text-center rounded-md w-full sm:w-[150px] border-[#6B6B6B] placeholder-black"
      />

      {/* Year */}
      <input
        type="text"
        placeholder="Year"
        className="border py-5 text-center rounded-md w-full sm:w-[150px] sm:ml-5 border-[#6B6B6B] placeholder-black"
      />

      {/* CVV */}
    <span className="relative">
                    <input
                      type="text"
                      placeholder="CVV"
                      className="border py-5 pr-12 text-center rounded-md w-full sm:w-[170] sm:ml-5 border-[#6B6B6B] placeholder-black"
                    />
                    {/* <img
                      src="/card.png"
                      alt=""
                      className="w-10 absolute right-2 top-1/2 transform -translate-y-1/2"
                    /> */}
                  </span>
    </div>
  </div>
</div>


            <p className="text-base sm:text-[20px] text-[#333333] mb-4">
              I agree with the Privacy Policy by processing with this
              <br className="hidden sm:block" />
              payment
            </p>

            <p className="text-xl sm:text-2xl font-bold text-[#290c52] mb-4">
              INR {rander[0].nri}.00{" "}
              <span className="text-base font-normal text-[#666666]">
                (Total Amount Payable)
              </span>
            </p>

            <button
              className="w-full bg-[#290c52] text-white py-3 rounded text-xl font-medium mt-4"
              onClick={() => router.push("/payment-app/pay-sucess")}
            >
              Make Payment
            </button>

            <button
              className="w-full text-[#0e2b4d] mt-2 py-3 font-medium"
              onClick={() => alert("Payment cancelled.")}
            >
              Cancel
            </button>
          </div>

          {/* Right column reserved (if needed) */}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
