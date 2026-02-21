"use client";
import React from "react";

export default function FingerPositionScreen() {
  return (
    <div className="min-h-[80%] bg-white border border-gray-300 shadow-lg max-w-3xl mx-auto mt-4 md:mt-10 rounded-md overflow-hidden mb-4 md:mb-10">
      <div className="bg-[#290c52] text-white text-center py-2 text-lg md:text-xl font-semibold px-4 flex justify-between items-center">
        <span className="flex-1 text-center md:mr-[-65]">Upper Finger Positions</span>
        {/* Language Dropdown */}
        <select className="bg-white text-blue-600 px-2 py-1 rounded text-sm">
         <option>View In</option>
          <option>English</option>
          <option>Hindi</option>
        </select>
      </div>

      {/* Body */}
      <div className="p-4 md:p-6 text-gray-800 space-y-4 text-[14px] md:text-[16px] leading-relaxed relative">
        <p>
          In the upper row position, your fingers move from the home row to reach the keys on the top row of the keyboard – also called the "upper row". Practicing the upper row helps improve finger reach and typing fluency.
        </p>

        <div>
          <strong>Now place your fingers on the upper row:</strong>
          <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
            <li>Move your left hand fingers to keys Q W E R</li>
            <li>Move your right hand fingers to keys U I O P</li>
            <li>Let the thumbs rest lightly on the space bar</li>
            <li>Keep your wrists straight and fingers lightly curved upward</li>
          </ol>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 px-4 py-2 text-sm">
          <strong>Tip!</strong> The upper row is slightly higher, so lift your fingers gently from the home row to reach it accurately without straining.
        </div>

        <div className="flex justify-center relative md:static">
          <img
            src="/homefinger.jpg"
            alt="Upper Row Finger Positions on Keyboard"
            className="w-[80%] max-w-[150px] md:max-w-[15%] md:absolute md:top-[115px] md:right-[110px]"
          />
        </div>
      </div>

      {/* Footer navigation */}
       <div className="flex justify-between items-center bg-gray-100 p-4 border-t">
        <button className="bg-white border border-gray-300 px-4 py-1 rounded hover:bg-gray-200">
         <a href="/learning">Cancel</a>
        </button>
        <button className="bg-blue-600 text-white px-6 py-1 rounded hover:bg-blue-700">
          <a href="/keyboard">Next</a>
        </button>
      </div>
    </div>
  );
}