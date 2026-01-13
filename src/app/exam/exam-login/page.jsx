"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaUser, FaPhone, FaHome, FaArrowLeft } from "react-icons/fa";

function StartTestPageContent() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState({});
  const [examId, setExamId] = useState(null);
  const [examType, setExamType] = useState(null);

  useEffect(() => {
    // Get exam ID and type from URL parameters
    const examIdParam = searchParams.get('examId');
    const typeParam = searchParams.get('type');
    if (examIdParam) setExamId(examIdParam);
    if (typeParam) setExamType(typeParam);
  }, [searchParams]);

  const handleStart = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!mobile.match(/^\d{10}$/)) newErrors.mobile = "Enter a valid 10-digit mobile number";
    if (!city.trim()) newErrors.city = "City is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Clear all previous exam data to start fresh
      localStorage.removeItem('examAnswers');
      localStorage.removeItem('visitedQuestions');
      localStorage.removeItem('markedForReview');
      localStorage.removeItem('completedSections');
      
      // Store exam data in localStorage
      if (examId) {
        localStorage.setItem('currentExamId', examId);
      }
      if (examType) {
        localStorage.setItem('examType', examType);
      }
      // Store user data
      localStorage.setItem('examUserData', JSON.stringify({ name, mobile, city }));
      // Navigate to exam
      window.location.href = "/exam/exam-con";
    }
  };

  return (
    <div className="min-h-screen bg-white-50">
      {/* Top Header */}
      <div className="bg-[#290c52] text-white flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold text-yellow-300">MPCPCT</div>
        {/* <div className="text-right text-sm space-y-1 ml-90">
          <p>
            Candidate Name : <span className="text-yellow-300">User</span>
          </p>
          <p>
            Subject : <span className="text-yellow-300">Exam Mock Test</span>
          </p>
        </div> */}
        <div className="w-16 h-16">
          <img
            src="/lo.jpg"
            alt="User"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>

      {/* Centered Card Form */}
      <div className="flex justify-center mt-20 px-4">
        <div className="bg-[#290c52] border rounded-md p-6 w-full max-w-md shadow">
          <h2 className="text-center text-xl text-white font-semibold mb-6">Start Test</h2>

          {/* Name Input */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center bg-white border rounded overflow-hidden">
              <div className="p-3 bg-gray-100">
                <FaUser className="text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="Name"
                className="flex-1 px-3 py-2 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="p-3 bg-gray-100">
                <FaArrowLeft className="text-gray-600" />
              </div>
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Mobile Number Input */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center bg-white border rounded overflow-hidden">
              <div className="p-3 bg-gray-100">
                <FaPhone className="text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="Mobile Number"
                className="flex-1 px-3 py-2 outline-none"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <div className="p-3 bg-gray-100">
                <FaArrowLeft className="text-gray-600" />
              </div>
            </div>
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
          </div>

          {/* City Input */}
          <div className="flex flex-col mb-6">
            <div className="flex items-center bg-white border rounded overflow-hidden">
              <div className="p-3 bg-gray-100">
                <FaHome className="text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="City"
                className="flex-1 px-3 py-2 outline-none"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <div className="p-3 bg-gray-100">
                <FaArrowLeft className="text-gray-600" />
              </div>
            </div>
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStart}
              className="bg-pink-300 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StartTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <StartTestPageContent />
    </Suspense>
  );
}
