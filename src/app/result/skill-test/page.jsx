"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

function SkillTestResultContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualUserName, setActualUserName] = useState(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        let id = resultId;
        
        // If no resultId in URL, try localStorage
        if (!id) {
          id = localStorage.getItem('lastTypingResultId');
        }
        
        if (!id) {
          console.error('No result ID found');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/typing-results?resultId=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.result) {
            setResult(data.result);
            
            // If userName is "User" or missing, try to fetch actual user name
            if (!data.result.userName || data.result.userName === "User") {
              try {
                const profileRes = await fetch('/api/profile', { credentials: 'include' });
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  if (profileData.user?.name) {
                    setActualUserName(profileData.user.name);
                  }
                }
              } catch (error) {
                console.error('Failed to fetch user profile:', error);
              }
            }
          }
        } else {
          console.error('Failed to fetch result');
        }
      } catch (error) {
        console.error('Error loading result:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [resultId]);

  const handleDownloadPDF = () => {
    if (!result) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('MPCPCT', pageWidth / 2, 15, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('(To Help in typing & computer proficiency)', pageWidth / 2, 22, { align: 'center' });
    
    // Title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    let yPos = 40;
    pdf.text('Result', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    pdf.setFontSize(14);
    pdf.text('Skill Test Examination 2025 - 26', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Details Table
    pdf.setFontSize(10);
    pdf.rect(10, yPos, pageWidth - 20, 30);
    pdf.text(`Name of Student: ${actualUserName || result.userName || "User"}`, 12, yPos + 6);
    pdf.text(`Result Date: ${new Date(result.submittedAt).toLocaleDateString()} ${new Date(result.submittedAt).toLocaleTimeString()}`, 12, yPos + 12);
    pdf.text(`Test Language: ${result.language}${result.subLanguage ? ` (${result.subLanguage})` : ''}`, 12, yPos + 18);
    pdf.text(`Time Duration: ${result.duration} minutes`, 12, yPos + 24);
    pdf.text(`Exercise Name: ${result.exerciseName}`, 12, yPos + 30);
    pdf.text(`Exam Centre Name: MPCPCT`, 12, yPos + 36);
    yPos += 40;
    
    // Result Table
    pdf.setFontSize(12);
    pdf.text('Result', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    const tableData = [
      ['Gross Speed', `${result.grossSpeed}wpm`, 'Total Type Word', result.totalWords.toString()],
      ['Correct Word', result.correctWords.toString(), 'Wrong Words', result.wrongWords.toString()],
      ['Net Speed', `${result.netSpeed}wpm`, 'Accuracy', `${result.accuracy}%`],
    ];
    
    const colWidths = [50, 30, 50, 30];
    let xPos = 10;
    
    tableData.forEach((row, idx) => {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }
      xPos = 10;
      row.forEach((cell, i) => {
        pdf.rect(xPos, yPos, colWidths[i], 8);
        pdf.text(cell, xPos + colWidths[i] / 2, yPos + 5, { align: 'center' });
        xPos += colWidths[i];
      });
      yPos += 8;
    });
    
    // Final Result
    yPos += 5;
    pdf.rect(10, yPos, pageWidth - 20, 8);
    pdf.text('Final Result', 12, yPos + 5);
    const finalResultText = `${result.finalResult} (Minimum Passing Net Speed of 30 Word per Minute)`;
    pdf.text(finalResultText, 60, yPos + 5);
    yPos += 15;
    
    // Errors
    if (result.errors && result.errors.length > 0) {
      pdf.setFontSize(10);
      pdf.text(`Total Errors: ${result.errors.length} Typed [Record]`, 12, yPos);
      yPos += 6;
      pdf.text(`Remarks: ${result.remarks}`, pageWidth - 60, yPos - 6);
      yPos += 6;
      pdf.setFontSize(8);
      const errorsText = result.errors.slice(0, 10).join(', '); // Limit to first 10 errors
      pdf.text(errorsText, 12, yPos, { maxWidth: pageWidth - 24 });
    }
    
    // Footer
    yPos = pageHeight - 30;
    pdf.setFontSize(10);
    pdf.text(`Date of Publication of Result: ${new Date().toLocaleDateString()}`, 12, yPos);
    
    // Save PDF
    pdf.save(`skill-test-result-${actualUserName || result.userName || "User"}-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">No Result Found</h1>
          <p className="text-gray-500">Please complete a typing test to see results.</p>
          <a href="/skill_test" className="text-blue-600 hover:underline mt-2 inline-block">
            Go to Skill Test
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto border-4 border-[#290c52] bg-white shadow-xl text-sm font-sans my-5">
        {/* Header */}
        <div
          className="w-full px-4 py-2 border"
          style={{
            backgroundColor: "#290c52",
            backgroundImage: "url('/bg.jpg')",
            backgroundRepeat: "repeat",
            backgroundSize: "cover",
          }}
        >
          <div className="flex items-center justify-between w-full">
            <img
              src="/logor.png"
              alt="MP Logo"
              className="h-24 w-35 mt-[-8]"
            />
            <div className="text-center flex-1 -ml-12">
              <h1
                className="text-3xl md:text-5xl font-extrabold uppercase md:mt-0 leading-[1.2] text-white"
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
              <p className="text-lg md:text-2xl text-pink-300 md:mt-0 font-semibold">
                (To Help in typing & computer proficiency)
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="text-center mt-4 mb-2">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Download PDF
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-4 font-semibold text-lg mt-2 py-4">
          <img
            src="/lo.jpg"
            alt="Student"
            className="w-24 h-20 border ml-2 absolute top-40"
          />
          <p className="uppercase font-bold text-2xl">Result</p>
          <p className="text-3xl md:text-2xl pt-10 md:pt-0">Skill Test Examination 2025 - 26</p>
        </div>

        {/* Details Table */}
        <div className="overflow-x-auto text-sm border border-gray-300 w-full max-w-full mx-auto">
          <table className="table-auto w-full border border-black">
            <tbody>
              <tr className="border border-black">
                <td className="border border-black px-2 py-1 font-semibold">Name of Student</td>
                <td className="border border-black px-2 py-1">{actualUserName || result.userName || "User"}</td>
                <td className="border border-black px-2 py-1 font-semibold">Result Date</td>
                <td className="border border-black px-2 py-1">
                  {new Date(result.submittedAt).toLocaleDateString()} {new Date(result.submittedAt).toLocaleTimeString()}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-2 py-1 font-semibold">Test Language</td>
                <td className="border border-black px-2 py-1">
                  {result.language}{result.subLanguage ? ` (${result.subLanguage})` : ''}
                </td>
                <td className="border border-black px-2 py-1 font-semibold">Time Duration</td>
                <td className="border border-black px-2 py-1">{result.duration} minutes</td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-2 py-1 font-semibold">Exercise Name</td>
                <td className="border border-black px-2 py-1" colSpan={3}>{result.exerciseName}</td>
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
              <td className="border p-1">{result.grossSpeed}wpm</td>
              <td className="border p-1">Total Type Word</td>
              <td className="border p-1">{result.totalWords}</td>
            </tr>
            <tr className="font-bold">
              <td className="border p-1 text-left">Correct Word</td>
              <td className="border p-1">{result.correctWords}</td>
              <td className="border p-1">Wrong Words</td>
              <td className="border p-1">{result.wrongWords}</td>
            </tr>
            <tr className="font-bold">
              <td className="border p-1 text-left">Net Speed</td>
              <td colSpan="1" className="border p-1">{result.netSpeed}wpm</td>
              <td colSpan="1" className="border p-1">Accuracy</td>
              <td colSpan="1" className="border p-1">{result.accuracy}%</td>
            </tr>
            <tr className="p-1 font-bold">
              <td className="text-center border" colSpan={2}>Final Result</td>
              <td className="" colSpan={3}>
                <span className={`text-left pr-5 ml-[-120] ${result.finalResult === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                  {result.finalResult}
                </span>
                {' '}(Minimum Passing Net Speed of 30 Word per Minute)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Errors */}
        <div className="bg-white p-4 w-full max-w-full text-sm mb-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold">
              Total Errors: <span>{result.errors?.length || 0} Typed [Record]</span>
            </h2>
            <a href="#" className="text-md">
              Remarks: <span className={`${result.remarks === 'Excellent' || result.remarks === 'Very Good' ? 'text-green-500' : result.remarks === 'Good' ? 'text-blue-500' : 'text-red-500'}`}>
                {result.remarks}
              </span>
            </a>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 border border-gray-300 p-3 bg-gray-50 rounded">
              <div className="space-y-0.5">
                {result.errors.map((error, index) => {
                  // Parse error format: "THGe [The]" -> typed: "THGe", correct: "The"
                  const match = error.match(/^(.+?)\s*\[(.+?)\]$/);
                  if (match) {
                    const [, typedWord, correctWord] = match;
                    return (
                      <div key={index} className="text-base leading-tight">
                        <span className="text-red-600 font-semibold">{typedWord}</span>
                        {' '}
                        <span className="text-gray-700">[</span>
                        <span className="text-green-700 font-semibold">{correctWord}</span>
                        <span className="text-gray-700">]</span>
                        {index < result.errors.length - 1 && ','}
                      </div>
                    );
                  } else {
                    // Fallback for errors not in expected format
                    return (
                      <div key={index} className="text-base leading-tight">
                        {error}
                        {index < result.errors.length - 1 && ','}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-md border-t pt-4 px-4 font-semibold">
          <p className="mb-2 md:mb-0 text-sm md:text-base">
            Date of Publication of Result: <span>{new Date().toLocaleDateString()}</span>
          </p>
          <img
            src="/seal.png"
            alt="Seal"
            className="h-20 md:h-30 mx-auto pb-2 md:pb-5"
          />
          <div className="relative mt-2 md:mt-0">
            <img
              src="/sing.png"
              alt="Controller"
              className="h-20 md:h-30 ml-auto mb-[-35]"
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

export default function SkillTestResult() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SkillTestResultContent />
    </Suspense>
  );
}
