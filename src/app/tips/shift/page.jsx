"use client";
import React from "react";

export default function FingerPositionScreen() {
  return (
    <div className="min-h-[80%] bg-white border border-gray-300 shadow-lg max-w-3xl mx-auto mt-4 md:mt-10 rounded-md overflow-hidden mb-4 md:mb-10">
      {/* Header */}
      <div className="bg-[#290c52] text-white text-center py-2 text-lg md:text-xl font-semibold px-4 flex justify-between items-center">
        <span className="flex-1 text-center md:mr-[-45]">Shift Finger Positions</span>
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
          The Shift row refers to keys you press using the <strong>Shift key</strong>, such as symbols or capital letters. These keys require coordination between both hands.
        </p>

        <div>
          <strong>Now learn how to use the Shift row:</strong>
          <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
            <li>Use your pinky finger to press and hold the Shift key</li>
            <li>Use another finger to press the desired key (e.g., Shift + 1 = !)</li>
            <li>Left Shift is used with right-hand keys, and Right Shift with left-hand keys</li>
            <li>Keep your hands steady to maintain balance while reaching for symbols</li>
          </ol>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 px-4 py-2 text-sm">
          <strong>Tip!</strong> Practice common combinations like <code>Shift + 2</code> for <code>@</code>, and <code>Shift + 5</code> for <code>%</code> to build fluency.
        </div>

        <div className="flex justify-center relative md:static">
          <img
            src="/homefinger.jpg"
            alt="Shift Row Finger Positions on Keyboard"
            className="w-[80%] max-w-[150px] md:max-w-[15%] md:absolute md:top-[75px] md:right-[75px]"
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