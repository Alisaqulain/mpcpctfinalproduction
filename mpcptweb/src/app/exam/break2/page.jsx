"use client";
import React, { useState, useEffect } from "react";

export default function BreakScreen() {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center mt-[-110]">
      <div className="w-full bg-[#290c52] text-yellow-400 text-left px-4 py-2 font-bold text-lg">
        MPCPCTMASTER 2025
      </div>

      <div className="flex flex-col items-center py-10 space-y-2 w-full">
        <img
          src="/lo.jpg"
          alt="avatar"
          className="w-20 h-20 rounded-full"
        />
        <p className="text-xl font-semibold">anas</p>
        <p className="text-sm font-semibold">
          Break End - <span className="italic text-gray-600">({`00:${seconds < 10 ? `0${seconds}` : seconds}`})</span>
        </p>

        <div className="mt-6 text-center space-y-2">
          <p className="text-base">
            1 मिनट का ब्रेक शुरू हो गया है। अगले सेक्शन पर तुरंत जाने के लिए{" "}
            <span className="font-bold">'Start Next Section'</span> बटन पर क्लिक करें।
          </p>
          <p className="text-sm italic text-pink-500">
            ब्रेक खत्म होते ही आप अपने आप अगले सेक्शन में चले जाएँगे।
          </p>
        </div>

        <button className="mt-6 bg-[#290c52] cursor-pointer hover:bg-blue-700 text-white px-5 py-2 rounded">
         <a href="/exam/hindi-ty"> Start Next Section </a>
        </button>
      </div>
    </div>
  );
}
