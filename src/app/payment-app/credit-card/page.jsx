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
      <div className="container mx-auto max-w-7xl">
        {/* Timer Section */}
        <div className="border h-14 sm:h-17 bg-[#290c52] text-[#fff] text-center text-lg sm:text-2xl pt-3 sm:pt-4">
          Transaction times out in 4:53 Mins
        </div>

        <div className="border border-[#000] my-8 sm:my-14"></div>

        <h2 className="text-xl sm:text-[25px] font-semibold mb-6 mt-[-20px] sm:mt-[-20px]">
          Payment Information
        </h2>

        {/* Main Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Payment Methods */}
            <div className="space-y-4 col-span-1 flex flex-col items-center md:items-start">
            {paymentOptions.map((item, index) => (
              <Link
                href={item.path}
                key={index}
                className={`flex items-center gap-3 w-full sm:w-[60%] py-4 sm:py-6 rounded mb-4 sm:mb-10 px-4 font-medium transition ${
                  item.name === "Credit Card"
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
          <div className="col-span-1 md:col-span-2 border rounded px-4 sm:px-6 py-6 h-auto border-[#6B6B6B]">
            <div className="flex items-center gap-2 mb-4 text-sm font-medium mt-5">
              <span className="text-sm sm:text-[15px]">We Accept :</span>
              <img src="/inter.png" alt="Visa" className="h-6 sm:h-auto" />
            </div>

            <div className="mb-4 relative">
              <label className="font-medium mt-4 text-[#333333]">Card Number</label>
              <input
                type="text"
                className="w-full mt-1 border px-3 py-4 sm:py-5 border-[#6B6B6B] rounded-md"
                placeholder=""
              />
              <img
                src="/card2.png"
                alt=""
                className="w-8 sm:w-10 absolute bottom-3 sm:bottom-4 right-3 sm:right-4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="mt-6">
                <label className="block mb-1 font-medium text-[#333333]">Expiry Date</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 flex-nowrap">
                  <input
                    type="text"
                    placeholder="Month"
                    className="border py-4 sm:py-5 text-center rounded-md w-full sm:w-[150px] border-[#6B6B6B] placeholder-black"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    className="border py-4 sm:py-5 text-center rounded-md w-full sm:w-[150px] sm:ml-5 border-[#6B6B6B] placeholder-black"
                  />
                  <span className="relative">
                    <input
                      type="text"
                      placeholder="CVV"
                      className="border py-4 sm:py-5 pr-10 sm:pr-12 text-center rounded-md w-full sm:w-[170px] sm:ml-5 border-[#6B6B6B] placeholder-black"
                    />
                    {/* <img
                      src="/card.png"
                      alt=""
                      className="w-8 sm:w-10 absolute right-2 top-1 “/2 transform -translate-y-1/2"
                    /> */}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-base sm:text-[20px] text-[#333333] mb-4">
              I agree with the Privacy Policy by processing with this<br /> payment
            </p>

            <p className="text-xl sm:text-2xl font-bold text-[#290c52] mb-4">
              INR {rander[0].nri}.00{" "}
              <span className="text-base sm:text-lg mt-[-2px] font-normal text-[#666666]">
                (Total Amount Payable)
              </span>
            </p>

            <button
              className="w-full bg-[#290c52] text-white py-2 rounded text-lg sm:text-2xl font-medium mt-5 cursor-pointer"
              onClick={() => router.push("/payment-app/pay-sucess")}
            >
              Make Payment
            </button>

            <button
              className="w-full text-[#0e2b4d] mt-2 py-2 font-medium cursor-pointer"
              onClick={() => alert("Payment cancelled.")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;