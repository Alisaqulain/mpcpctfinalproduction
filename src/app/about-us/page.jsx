import React from "react";
import { Quote } from "lucide-react"; 

export default function FounderIntro() {
  return (
<div
  className="max-w-2xl h-[70vh] mx-auto bg-white p-6 text-center space-y-4 border border-gray-400 shadow-lg rounded-lg my-10 
             transition-all duration-500 hover:scale-105 hover:border-cyan-500"
>      {/* Image with circle border */}
      <div className="flex justify-center">
        <img
          src="/founder.jpg" // Replace with your image path
          alt="Founder"
          className="w-32 h-32 rounded-full border-4 border-cyan-500"
        />
      </div>

      {/* Name and Title */}
      <div>
        <h2 className="text-cyan-600 font-bold text-lg tracking-wide">Nadeem</h2>
        <p className="text-sm font-medium">Founder</p>
      </div>

      {/* Quotation section */}
      <div className="relative text-gray-800 text-sm leading-relaxed px-2 max-w-xl mx-auto">
  <Quote className="absolute left-[-8px] top-[-10px] text-cyan-400 opacity-50 w-8 h-8 rotate-180" />
  <div className="space-y-4">
    <p className="indent-6">
      <strong>Hello, I'm Captain Nadeem</strong> and I want to tell you about my typing Website <strong>MPCPCT</strong>. It is a simple and convenient online typing tutor for everybody who wants to type better.
    </p>
    <p className="indent-6">
      <strong>MPCPCT</strong> is a <span className="text-cyan-600 font-medium">user</span>-friendly learning website that is designed to help you learn, practice and improve your <strong>Computer Proficiency</strong> and typing <strong>speed & accuracy</strong>.
    </p>
  </div>
  <Quote className="text-cyan-400 opacity-50 absolute bottom-[-10px] right-0 w-8 h-8" />
</div>

    </div>
  );
}
