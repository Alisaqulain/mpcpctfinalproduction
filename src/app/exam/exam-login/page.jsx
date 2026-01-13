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
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState(null);

  useEffect(() => {
    // Get exam ID and type from URL parameters
    const examIdParam = searchParams.get('examId');
    const typeParam = searchParams.get('type');
    if (examIdParam) setExamId(examIdParam);
    if (typeParam) setExamType(typeParam);
  }, [searchParams]);

  // Check exam access when examId is available
  useEffect(() => {
    const checkExamAccess = async () => {
      if (!examId) {
        setAccessChecked(true);
        setHasAccess(true); // Allow if no examId (backward compatibility)
        return;
      }

      try {
        setAccessChecked(false);
        const res = await fetch('/api/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'exam', 
            examId: examId,
            examType: examType 
          }),
          credentials: 'include'
        });

        const data = await res.json();
        
        if (data.hasAccess === true) {
          setHasAccess(true);
          setAccessError(null);
        } else {
          setHasAccess(false);
          if (data.reason === 'no_token' || data.reason === 'invalid_token') {
            setAccessError('Please login to access this exam');
          } else if (data.reason === 'no_subscription') {
            setAccessError('This exam requires a membership. Please subscribe to access.');
          } else {
            setAccessError('You do not have access to this exam');
          }
        }
      } catch (error) {
        console.error('Error checking exam access:', error);
        setHasAccess(false);
        setAccessError('Error checking access. Please try again.');
      } finally {
        setAccessChecked(true);
      }
    };

    checkExamAccess();
  }, [examId, examType]);

  const handleStart = () => {
    // Check access first
    if (!hasAccess) {
      setErrors({ access: accessError || 'You do not have access to this exam' });
      return;
    }

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

          {/* Access Check Message */}
          {accessChecked && !hasAccess && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
              <p className="text-yellow-800 text-sm mb-3">
                {accessError || 'You do not have access to this exam'}
              </p>
              {accessError && accessError.includes('membership') && (
                <div className="flex gap-2">
                  <a
                    href="/payment-app?type=exam"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    Subscribe Now
                  </a>
                  <a
                    href="/exam"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    Back to Exams
                  </a>
                </div>
              )}
            </div>
          )}

          {!accessChecked && (
            <div className="mb-4 text-center">
              <p className="text-white text-sm">Checking access...</p>
            </div>
          )}

          {errors.access && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded">
              <p className="text-red-600 text-sm">{errors.access}</p>
            </div>
          )}

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
              disabled={!accessChecked || !hasAccess}
              className={`font-semibold px-6 py-2 rounded shadow ${
                !accessChecked || !hasAccess
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-pink-300 hover:bg-blue-700 text-white'
              }`}
            >
              {!accessChecked ? 'Checking...' : !hasAccess ? 'Access Denied' : 'Start'}
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
