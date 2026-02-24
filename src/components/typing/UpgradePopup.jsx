"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function UpgradePopup({ onClose, lessonTitle }) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/payment-app");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#290c52] text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-xl font-bold">Premium Lesson</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            <strong>"{lessonTitle}"</strong> is a premium lesson.
          </p>
          <p className="text-gray-600 mb-6">
            Upgrade to Premium to access all lessons and unlock unlimited practice!
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-[#290c52] hover:bg-[#3a1a6b] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






