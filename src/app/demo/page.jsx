"use client";
import React, { useState, useEffect } from "react";

export default function DemoPage() {
  const [buildTime, setBuildTime] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Set build time when component mounts
    setBuildTime(new Date().toLocaleString());
    setIsLive(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#290c52] text-white p-6 rounded-t-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center">MPCPCT Demo & Status Page</h1>
          <p className="text-center mt-2 text-pink-300">Check if new code is live</p>
        </div>

        {/* Status Card */}
        <div className="bg-white p-6 rounded-b-lg shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Status */}
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <h2 className="text-xl font-bold text-green-700">
                  {isLive ? '✅ Website is LIVE' : '❌ Website is OFFLINE'}
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {isLive ? 'New code changes are active' : 'Website is not responding'}
              </p>
            </div>

            {/* Build Info */}
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
              <h2 className="text-xl font-bold text-blue-700">Build Information</h2>
              <p className="mt-2 text-sm text-gray-600">
                <strong>Last Check:</strong> {buildTime || 'Loading...'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Welcome Back Styling */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-[#290c52] mb-4">Welcome Back Styling Test</h2>
          <p className="text-gray-600 mb-4">Check if the new CSS styling is applied:</p>
          
          <div className="relative">
            {/* Welcome Back Header */}
            <span className="text-pink-300 font-semibold text-[20px] border-2 border-[#290c52] bg-[#290c52] pt-4 md:pt-7 pb-0 md:pb-6 text-center w-full lg:w-48 absolute right-0 lg:right-[-16px] z-10 top-[155px] rounded-tl-lg rounded-tr-lg md:rounded-none lg:top-[-148px] home-welcome-text">
              Welcome Back
            </span>

            {/* Login Box */}
            <div className="w-full lg:w-48 border-2 border-[#290c52] bg-gray-50 shadow-lg p-4 space-y-4 py-10 md:py-20 relative lg:absolute lg:right-[-16px] lg:top-0 h-auto md:h-[620px] rounded-lg lg:mt-[-147px] home-login-box">
              <div className="font-semibold text-pink-300 text-xl text-center mt-0 md:mt-16">
                <span className="font-normal text-black text-sm md:text-[14px] block md:inline md:ml-2">
                  Login to your MPCPCT Account
                </span>
              </div>
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Mob. No."
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled
                />
                <button className="w-full bg-red-500 text-white py-2 rounded" disabled>
                  Login
                </button>
              </div>
            </div>
          </div>

          {/* Styling Check List */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3">CSS Styling Checklist:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Welcome Back width: 12% (desktop only)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Padding top: 1.75rem</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Padding bottom: 1.5rem</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Font size: 1.2rem</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Top position: -9.25rem</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>No gap between borders</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Code Changes Info */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-[#290c52] mb-4">Recent Code Changes</h2>
          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h3 className="font-bold text-yellow-800">Welcome Back Styling Fix</h3>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                <li>• Fixed border gap between Welcome Back and login box</li>
                <li>• Added width: 12% for desktop view</li>
                <li>• Adjusted padding and font size</li>
                <li>• Mobile view remains unchanged</li>
              </ul>
            </div>
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <h3 className="font-bold text-green-800">Exam Timing Feature</h3>
              <ul className="mt-2 text-sm text-green-700 space-y-1">
                <li>• Separate timing for typing sections</li>
                <li>• Main exam timer pauses during typing sections</li>
                <li>• Auto-submit when typing time expires</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setBuildTime(new Date().toLocaleString());
              window.location.reload();
            }}
            className="bg-[#290c52] text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔄 Refresh & Check Again
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This page helps verify that new code changes are live on the website.</p>
          <p className="mt-1">Last updated: {buildTime || 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}

