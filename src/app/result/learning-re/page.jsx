"use client";
import React, { useState, useEffect } from "react";

export default function CpctScoreCard() {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get result data from localStorage
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('learningResult');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setResultData(parsed);
        } catch (error) {
          console.error('Error parsing result data:', error);
        }
      }
    }
    setLoading(false);
  }, []);

  // Default data if no result found
  const defaultData = [
    { key: "A", value: 30 },
    { key: "B", value: 28 },
    { key: "7", value: 29 },
    { key: "j", value: 10 },
  ];

  // Get difficult keys data from result or use default
  let difficultKeysData = defaultData;
  
  if (resultData?.difficultKeys && Array.isArray(resultData.difficultKeys)) {
    difficultKeysData = resultData.difficultKeys;
    console.log('=== LOADING RESULT DATA ===');
    console.log('Result data:', resultData);
    console.log('Difficult keys from result:', resultData.difficultKeys);
    console.log('Total keys:', difficultKeysData.length);
    console.log('Keys:', difficultKeysData.map(k => k.key));
  } else {
    console.warn('No difficult keys in result data, using default');
    console.log('Result data:', resultData);
  }
  
  // Calculate max difficulty for chart scaling
  const allDifficulties = difficultKeysData.map(d => d.difficulty !== undefined ? d.difficulty : (d.value !== undefined ? d.value : 0));
  const maxDifficulty = allDifficulties.length > 0 
    ? Math.max(...allDifficulties, 1)
    : 100;
  
  console.log('Final difficultKeysData to display:', difficultKeysData);
  console.log('Max difficulty:', maxDifficulty);

  const maxHeight = 100; // height in px

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }
  return (
      <div>
    <div className="max-w-4xl mx-auto border-4 border-[#290c52] bg-white shadow-xl text-sm font-sans my-5">
      {/* Full-Width Header */}
      <div
        className="w-full px-4 py-2 border"
        style={{
          backgroundColor: "#290c52",
          backgroundImage: "url('/bg.jpg')",
          backgroundRepeat: "repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between w-full">
          {/* Left Logo - order changes on mobile */}
          <img
            src="/logor.png"
            alt="MP Logo"
            className="h-20 w-auto md:h-24 md:mt-[-8] md:order-1 order-2"
          />

          {/* Center Title - comes first on mobile */}
          <div className="text-center flex-1 md:-ml-12 order-1 md:order-2">
            <h1
              className="text-3xl md:text-5xl font-extrabold uppercase leading-[1.2] text-white"
              style={{
                textShadow: `
                  0 0 10px black,
                  1px 1px 0 #39245f,
                  2px 2px 0 #341f57,
                  3px 3px 0 #2d1a4e,
                  4px 4px 0 #241244,
                  5px 5px 6px rgba(0, 0, 0, 0.4)
                `,
                letterSpacing: '2px',
              }}
            >
              MPCPCT
            </h1>
            <p className="text-lg md:text-2xl text-pink-300 font-semibold">
              (To Help in typing & computer proficiency)
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-4 font-semibold text-lg mt-2 py-4 relative">
        {/* Student Photo - position adjusted for mobile */}
        <img
          src="/lo.jpg"
          alt="Student"
          className="w-16 sm:w-24 h-12 sm:h-20 border ml-2 absolute left-0 top-[40] md:top-1/2 transform -translate-y-1/2"
        />
        <p className="uppercase font-bold text-xl md:text-2xl">Result</p>
        <p className="text-xl md:text-2xl">Learning Section</p>
      </div>

      {/* Details Table */}
      <div className="overflow-x-auto text-sm border border-gray-300 w-full max-w-full mx-auto">
        <table className="table-auto w-full border border-black">
          <tbody>
            <tr className="border border-black">
              <td className="border border-black px-2 py-1 font-semibold">Name of Student</td>
              <td className="border border-black px-2 py-1">{resultData?.userName || "__________"}</td>
              <td className="border border-black px-2 py-1 font-semibold">Result Date</td>
              <td className="border border-black px-2 py-1">{resultData ? `${resultData.resultDate} ${resultData.resultTime}` : "date & Time"}</td>
            </tr>
            <tr className="border border-black">
              <td className="border border-black px-2 py-1 font-semibold">Test Language</td>
              <td className="border border-black px-2 py-1">{resultData?.language || "English/Hindi"}</td>
              <td className="border border-black px-2 py-1 font-semibold">Time Duration</td>
              <td className="border border-black px-2 py-1">{resultData ? `${Math.floor(resultData.timeDuration / 60)}:${(resultData.timeDuration % 60).toString().padStart(2, '0')}` : ""}</td>
            </tr>
            <tr className="border border-black">
              <td className="border border-black px-2 py-1 font-semibold">Exercise Name</td>
              <td className="border border-black px-2 py-1" colSpan={3}>{resultData?.exerciseName || "__________"}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Exam Centre Name</td>
              <td className="border border-black px-2 py-1" colSpan={3}>MPCPCT</td>
            </tr>
            <tr>
              <td className="text-center" colSpan={4}>Result</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Result Table */}
      <table className="w-full border text-center">
        <tbody>
          <tr className="font-bold">
            <td className="border p-1 text-left">Gross Speed</td>
            <td className="border p-1">{resultData?.grossSpeed || 0}wpm</td>
          </tr>
          <tr className="font-bold">
            <td className="border p-1 text-left">Accuracy</td>
            <td className="border p-1">{resultData?.accuracy || 0}%</td>
          </tr>
          <tr className="font-bold">
            <td className="border p-1 text-left">Net Speed</td>
            <td colSpan="1" className="border p-1">{resultData?.netSpeed || 0}wpm</td>
          </tr>
        </tbody>
      </table>

      {/* Contact Info */}
      <div className="bg-white p-4 w-full max-w-full text-sm mb-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold">Difficult Keys in this Exercise</h2>
          <a href="#" className="text-blue-600 text-xs underline">Review</a>
        </div>

        {/* Chart area */}
        <div className="relative h-[140px] border border-black">
          {/* Difficulty zones */}
          <div className="absolute top-0 left-0 w-full h-1/3 border-b border-green-300 flex items-center justify-end pr-2 text-xs text-gray-600">
            Problematic
          </div>
          <div className="absolute top-1/3 left-0 w-full h-1/3 border-b border-green-300 flex items-center justify-end pr-2 text-xs text-gray-600">
            Difficult
          </div>
          <div className="absolute top-2/3 left-0 w-full h-1/3 flex items-center justify-end pr-2 text-xs text-gray-600">
            OK
          </div>

          {/* Bars - Show ALL keys with their difficulty levels */}
          <div className="absolute bottom-0 left-0 right-0 w-full flex gap-x-1 sm:gap-x-2 md:gap-x-3 items-end justify-center px-2 sm:px-4 overflow-x-auto" style={{ height: '100%', paddingBottom: '5px' }}>
            {difficultKeysData && Array.isArray(difficultKeysData) && difficultKeysData.length > 0 ? (
              difficultKeysData.map((item, index) => {
                const difficultyValue = item.difficulty !== undefined ? item.difficulty : (item.value !== undefined ? item.value : 0);
                const keyName = item.key || item.name || '?';
                
                // Determine bar color based on difficulty level
                let barColor = "bg-green-400"; // OK (0 difficulty)
                if (difficultyValue >= 3) {
                  barColor = "bg-red-500"; // Problematic
                } else if (difficultyValue >= 1) {
                  barColor = "bg-yellow-500"; // Difficult
                }
                
                // Calculate height
                let heightPercentage;
                if (maxDifficulty <= 1 && difficultyValue === 0) {
                  heightPercentage = 20; // 20% for OK keys
                } else if (maxDifficulty > 1) {
                  heightPercentage = Math.max((difficultyValue / maxDifficulty) * 100, 10);
                } else {
                  heightPercentage = difficultyValue > 0 ? 50 : 20;
                }
                
                // Adjust bar width based on number of keys
                const barWidth = difficultKeysData.length > 15 ? "w-3 sm:w-4" : 
                                difficultKeysData.length > 10 ? "w-4 sm:w-5" : 
                                "w-4 sm:w-6";
                const barHeight = Math.max((heightPercentage / 100) * maxHeight, 10);
                
                const frequency = item.frequency || 1; // How many times this key appeared
                
                return (
                  <div key={`${keyName}-${index}`} className="flex flex-col items-center justify-end flex-shrink-0 h-full" title={`${keyName}: ${difficultyValue} error${difficultyValue !== 1 ? 's' : ''} (appeared ${frequency} time${frequency !== 1 ? 's' : ''})`}>
                    <div
                      className={`${barColor} ${barWidth} transition-all rounded-t mb-1`}
                      style={{ height: `${barHeight}px`, minHeight: '10px', maxHeight: '120px' }}
                    ></div>
                    <span className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap font-semibold mb-0.5">{keyName}</span>
                    <span className="text-[8px] sm:text-[10px] text-gray-500">{difficultyValue}</span>
                    {frequency > 1 && (
                      <span className="text-[7px] sm:text-[9px] text-blue-500">({frequency}x)</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 w-full py-4 flex items-center justify-center h-full">
                <p>No keys data available. Please complete a practice session first.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center text-md border-t pt-4 px-4 font-semibold">
        <p className="mb-2 md:mb-0 text-sm md:text-base">Date of Publication of Result : <span>June 30,2025</span></p>
        <img
          src="/seal.png"
          alt="Seal"
          className="h-20 md:h-30 mx-auto pb-2 md:pb-5"
        />
        <div className="relative mt-2 md:mt-0">
          <img 
            src="/sing.png" 
            alt="Controller" 
            className="h-20 md:h-30 ml-auto  mb-[-35]" 
          />
          <p className="italic text-gray-500 text-sm md:text-base">
            Head of Examinations
          </p>
        </div>
      </div>
      </div>
         <button className="bg-red-600 hover:bg-blue-700 text-white font-medium px-4 py-2 mb-2 ml-35 sm:ml-40 md:ml-70 lg:ml-80 xl:ml-156">
  <a href="/">Go To Home</a>
</button>
    </div>
  );
}