"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function BreakScreenContent() {
  const [seconds, setSeconds] = useState(60);
  const [userName, setUserName] = useState("User");
  const [breakComplete, setBreakComplete] = useState(false);
  const searchParams = useSearchParams();
  const nextSectionParam = searchParams.get("next");
  const sectionParam = searchParams.get("section");
  const breakDurationParam = searchParams.get("duration"); // Duration in minutes
  
  // Calculate break duration (default 1 minute, or from parameter, or 10 minutes for typing section)
  const breakDurationMinutes = breakDurationParam ? parseInt(breakDurationParam) : 
    (sectionParam && (sectionParam.includes("Typing") || sectionParam.includes("typing"))) ? 10 : 1;
  
  // Determine next section URL
  let nextSection = "/exam_mode";
  if (nextSectionParam) {
    nextSection = nextSectionParam;
    if (sectionParam) {
      // Ensure proper encoding
      const decodedSection = decodeURIComponent(sectionParam);
      nextSection += `?section=${encodeURIComponent(decodedSection)}`;
      console.log('Break page: Next section will be:', decodedSection);
      console.log('Break page: Full URL:', nextSection);
    }
  } else if (sectionParam) {
    const decodedSection = decodeURIComponent(sectionParam);
    nextSection = `/exam_mode?section=${encodeURIComponent(decodedSection)}`;
    console.log('Break page: Next section will be:', decodedSection);
    console.log('Break page: Full URL:', nextSection);
  }

  // Fetch user name - load from localStorage first, then try API
  useEffect(() => {
    // First, try localStorage (faster)
    const userDataStr = localStorage.getItem('examUserData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.name) {
          setUserName(userData.name);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Then try API to get updated name
    const fetchUserName = async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setUserName(data.user.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    
    fetchUserName();
  }, []);

  // Initialize break time
  useEffect(() => {
    setSeconds(breakDurationMinutes * 60);
  }, [breakDurationMinutes]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setBreakComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-redirect when break completes
  useEffect(() => {
    if (breakComplete && seconds === 0) {
      // Auto-redirect after 2 seconds
      const redirectTimer = setTimeout(() => {
        window.location.href = nextSection;
      }, 2000);
      return () => clearTimeout(redirectTimer);
    }
  }, [breakComplete, seconds, nextSection]);

  const handleNextSection = () => {
    if (breakComplete) {
      window.location.href = nextSection;
    }
  };

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
        <p className="text-xl font-semibold">{userName}</p>
        <p className="text-sm font-semibold">
          Break End - <span className="italic text-gray-600">
            {breakDurationMinutes >= 10 
              ? `${Math.floor(seconds / 60)}:${(seconds % 60) < 10 ? `0${seconds % 60}` : seconds % 60}`
              : `00:${seconds < 10 ? `0${seconds}` : seconds}`
            }
          </span>
        </p>
        {breakDurationMinutes >= 10 && (
          <p className="text-xs text-gray-500 mt-1">
            Extended break: {breakDurationMinutes} minutes
          </p>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-base">
            1 मिनट का ब्रेक शुरू हो गया है। अगले सेक्शन पर तुरंत जाने के लिए{" "}
            <span className="font-bold">'Start Next Section'</span> बटन पर क्लिक करें।
          </p>
          <p className="text-sm italic text-pink-500">
            ब्रेक खत्म होते ही आप अपने आप अगले सेक्शन में चले जाएँगे।
          </p>
        </div>

        <button 
          onClick={() => window.location.href = nextSection}
          className="mt-6 px-5 py-2 rounded text-white bg-[#290c52] cursor-pointer hover:bg-blue-700"
        >
          Start Next Section
        </button>
      </div>
    </div>
  );
}

export default function BreakScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
      </div>
    }>
      <BreakScreenContent />
    </Suspense>
  );
}
