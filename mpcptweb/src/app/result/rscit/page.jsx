"use client";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";

export default function RscitResult() {
  const [userName, setUserName] = useState("User");
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theoryScore, setTheoryScore] = useState(0);
  const [internalScore, setInternalScore] = useState(0);
  const [theoryMax, setTheoryMax] = useState(70);
  const [internalMax, setInternalMax] = useState(30);
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true);
        
        // Check if data is coming from profile
        const profileResultDataStr = localStorage.getItem('profileResultData');
        if (profileResultDataStr) {
          try {
            const profileResult = JSON.parse(profileResultDataStr);
            setUserName(profileResult.userName || "User");
            // For RSCIT, we need to calculate from sectionStats
            if (profileResult.sectionStats && profileResult.sectionStats.length > 0) {
              const sectionA = profileResult.sectionStats.find(s => s.sectionName === 'Section A' || s.sectionName.includes('Theory'));
              const sectionB = profileResult.sectionStats.find(s => s.sectionName === 'Section B' || s.sectionName.includes('Internal'));
              
              if (sectionA && sectionB) {
                setTheoryScore(sectionA.score || 0);
                setTheoryMax(sectionA.totalQuestions * 2 || 70);
                setInternalScore(sectionB.score || 0);
                setInternalMax(sectionB.totalQuestions * 2 || 30);
              } else {
                // Fallback: split total score
                setTheoryScore(Math.floor(profileResult.totalScore * 0.7) || 0);
                setInternalScore(Math.floor(profileResult.totalScore * 0.3) || 0);
              }
              
              // RSCIT passing: Section A >= 12 AND Section B >= 28
              const sectionAScore = sectionA ? (sectionA.score || 0) : Math.floor(profileResult.totalScore * 0.7);
              const sectionBScore = sectionB ? (sectionB.score || 0) : Math.floor(profileResult.totalScore * 0.3);
              setIsPassed(sectionAScore >= 12 && sectionBScore >= 28);
            } else {
              // Fallback calculation
              setTheoryScore(Math.floor(profileResult.totalScore * 0.7) || 0);
              setInternalScore(Math.floor(profileResult.totalScore * 0.3) || 0);
              setIsPassed(profileResult.totalScore >= 40);
            }
            setExamData({ title: profileResult.examTitle || 'RSCIT' });
            setLoading(false);
            localStorage.removeItem('profileResultData'); // Clean up
            return;
          } catch (error) {
            console.error('Error parsing profile result data:', error);
          }
        }

        // Load user data
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

        // Load exam data
        const examId = localStorage.getItem('currentExamId');
        if (!examId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/exam-questions?examId=${examId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setExamData(data.data.exam);
            
            // Load answers
            const answersStr = localStorage.getItem('examAnswers');
            const loadedAnswers = answersStr ? JSON.parse(answersStr) : {};
            
            // Calculate scores for Section A (Theory) and Section B (Internal)
            const sections = data.data.sections || [];
            const questionsBySection = {};
            sections.forEach(sec => {
              const sectionQuestions = data.data.allQuestions.filter(q => {
                const qSectionId = String(q.sectionId).trim();
                const secIdStr = String(sec.id).trim();
                const secIdObj = String(sec._id).trim();
                return qSectionId === secIdObj || qSectionId === secIdStr;
              });
              questionsBySection[sec.name] = sectionQuestions;
            });

            let theoryTotal = 0;
            let theoryObtained = 0;
            let internalTotal = 0;
            let internalObtained = 0;

            sections.forEach((sec, index) => {
              const secQuestions = questionsBySection[sec.name] || [];
              let sectionScore = 0;
              let sectionMax = 0;

              secQuestions.forEach(q => {
                const marks = q.marks || 2; // RSCIT questions are 2 marks each
                sectionMax += marks;
                const answer = loadedAnswers[q._id];
                if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
                  sectionScore += marks;
                }
              });

              // Section A (Theory) is typically first section, Section B (Internal) is second
              if (index === 0 || sec.name.includes('Section A') || sec.name.includes('Theory')) {
                theoryTotal = sectionMax;
                theoryObtained = sectionScore;
              } else if (index === 1 || sec.name.includes('Section B') || sec.name.includes('Internal')) {
                internalTotal = sectionMax;
                internalObtained = sectionScore;
              }
            });

            setTheoryMax(theoryTotal || 70);
            setInternalMax(internalTotal || 30);
            setTheoryScore(theoryObtained);
            setInternalScore(internalObtained);

            // RSCIT passing criteria: Section A >= 12 AND Section B >= 28
            const sectionAPassed = theoryObtained >= 12;
            const sectionBPassed = internalObtained >= 28;
            setIsPassed(sectionAPassed && sectionBPassed);
          }
        }
      } catch (error) {
        console.error('Error loading result data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResultData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const totalScore = theoryScore + internalScore;
  const totalMax = theoryMax + internalMax;

  const handleDownloadPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header with background
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MPCPCT', pageWidth / 2, 12, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('(To Help in typing & computer proficiency)', pageWidth / 2, 20, { align: 'center' });
    
    // Title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    let yPos = 35;
    pdf.text('RESULT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    pdf.setFontSize(14);
    pdf.text('Rscit Examination 2025-26', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Details Table
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const rowHeight = 8;
    const colWidths = [45, 45, 45, 45];
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    
    // Name and Date row
    pdf.setFont('helvetica', 'bold');
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1], rowHeight);
    pdf.rect(10 + colWidths[0] + colWidths[1], yPos, colWidths[2], rowHeight);
    pdf.rect(10 + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], rowHeight);
    pdf.text('Name of Student', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(userName, 10 + colWidths[0] + colWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.text('Result Date', 10 + colWidths[0] + colWidths[1] + colWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date().toLocaleDateString(), 10 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Roll No and Time Duration
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1], rowHeight);
    pdf.rect(10 + colWidths[0] + colWidths[1], yPos, colWidths[2], rowHeight);
    pdf.rect(10 + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Roll No', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('-------', 10 + colWidths[0] + colWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.text('Time Duration', 10 + colWidths[0] + colWidths[1] + colWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('', 10 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Subject Name
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1] + colWidths[2] + colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject Name', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(examData?.title || 'RSCIT', 10 + colWidths[0] + (colWidths[1] + colWidths[2] + colWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Exam Centre
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1] + colWidths[2] + colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Exam Centre Name', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('MPCPCT', 10 + colWidths[0] + (colWidths[1] + colWidths[2] + colWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Result header
    pdf.setFont('helvetica', 'bold');
    pdf.rect(10, yPos, pageWidth - 20, rowHeight);
    pdf.text('Result', pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += rowHeight + 5;
    
    // Result Table
    pdf.setFontSize(12);
    const resultColWidths = [50, 40, 50, 50];
    const resultStartX = 10;
    
    // Header
    pdf.setFillColor(200, 200, 200);
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight, 'F');
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1], rowHeight, 'F');
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight, 'F');
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Sections', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text('Maximum Marks', resultStartX + resultColWidths[0] + resultColWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.text('Minimum Pass Marks', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text('Obtained Marks', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Theory Marks row
    pdf.setFont('helvetica', 'normal');
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text('Theory Marks', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text(theoryMax.toString(), resultStartX + resultColWidths[0] + resultColWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.text('28', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text(theoryScore.toString(), resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Internal Marks row
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text('Internal Marks', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text(internalMax.toString(), resultStartX + resultColWidths[0] + resultColWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.text('12', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text(internalScore.toString(), resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Total row
    pdf.setFont('helvetica', 'bold');
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1] + resultColWidths[2] + resultColWidths[3], rowHeight);
    pdf.text('Total', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text(`${totalScore}/${totalMax}`, resultStartX + resultColWidths[0] + (resultColWidths[1] + resultColWidths[2] + resultColWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Final Result row
    pdf.rect(resultStartX, yPos, resultColWidths[0] + resultColWidths[1] + resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text('Final Result', resultStartX + (resultColWidths[0] + resultColWidths[1] + resultColWidths[2])/2, yPos + 5, { align: 'center' });
    pdf.setTextColor(isPassed ? 0 : 255, isPassed ? 128 : 0, 0);
    pdf.text(isPassed ? 'PASS' : 'FAIL', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += 15;
    
    // Footer
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date of Publication of Result: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    pdf.save(`RSCIT-Result-${userName}-${Date.now()}.pdf`);
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto shadow-xl text-sm font-sans bg-white my-5">
        {/* Download PDF Button */}
        <div className="text-right mb-2 pt-4 pr-4">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold border-0 focus:outline-none"
          >
            Download PDF
          </button>
        </div>
        <div className="border border-[#290c52]">

        {/* Full-Width Header */}
        <div
          className="w-full px-2 sm:px-4 py-2 border"
          style={{
            backgroundColor: "#290c52",
            backgroundImage: "url('/bg.jpg')",
            backgroundRepeat: "repeat",
            backgroundSize: "cover",
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between w-full">
            {/* Left Logo - shown on top on mobile, left on desktop */}
            <img
              src="/logor.png"
              alt="MP Logo"
              className="h-16 sm:h-24 w-auto mt-1 sm:mt-0 order-1 sm:order-none"
            />

            {/* Center Title */}
            <div className="text-center flex-1 sm:-ml-12 order-3 sm:order-none mt-2 sm:mt-0">
              <h1
                className="text-2xl sm:text-3xl md:text-5xl font-extrabold uppercase leading-[1.2] text-white"
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
              <p className="text-sm sm:text-lg md:text-2xl text-pink-300 font-semibold">
                (To Help in typing & computer proficiency)
              </p>
            </div>

            {/* Empty div to balance flex on mobile */}
            <div className="order-2 sm:order-none sm:h-24 w-0 sm:w-auto"></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4 font-semibold text-lg mt-2 py-4 relative">
          {/* Student Photo */}
          <img
            src="/lo.jpg"
            alt="Student"
            className="w-16 sm:w-24 h-12 sm:h-20 border ml-2 absolute left-0 top-[19] md:top-1/2 transform -translate-y-1/2"
          />
          <p className="uppercase font-semibold text-xl sm:text-2xl">Result</p>
          <p className="text-xl sm:text-2xl">Rscit Examination 2025-26</p>
        </div>

        {/* Details Table */}
        <div className="overflow-x-auto text-xs sm:text-sm border border-gray-300 w-full max-w-full mx-auto">
          <table className="table-auto w-full border border-black">
            <tbody>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Name of Student</td>
                <td className="border border-black px-1 sm:px-2 py-1">{userName}</td>
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Result Date</td>
                <td className="border border-black px-1 sm:px-2 py-1">{new Date().toLocaleDateString()}</td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Roll No</td>
                <td className="border border-black px-1 sm:px-2 py-1">-------</td>
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Time Duration</td>
                <td className="border border-black px-1 sm:px-2 py-1"></td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Subject Name</td>
                <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>{examData?.title || 'RSCIT'}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Exam Centre Name</td>
                <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>MPCPCT</td>
              </tr>
              <tr>
                <td className="text-center" colSpan={4}>Result</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Result Table */}
        <div className="overflow-x-auto">
          <table className="w-full border text-center">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-1">Sections</th>
                <th className="border p-1">Maximum Marks</th>
                <th className="border p-1">Minimum Pass Marks</th>
                <th className="border p-1">Obtained Marks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1 text-left">Theory Marks</td>
                <td className="border p-1">{theoryMax}</td>
                <td className="border p-1">28</td>
                <td className="border p-1">{theoryScore}</td>
              </tr>
              <tr>
                <td className="border p-1 text-left">Internal Marks</td>
                <td className="border p-1">{internalMax}</td>
                <td className="border p-1">12</td>
                <td className="border p-1">{internalScore}</td>
              </tr>
              <tr className="font-bold">
                <td className="border p-1 text-left">Total</td>
                <td colSpan="3" className="border p-1 text-left">{totalScore}/{totalMax}</td>
              </tr>
              <tr className="font-bold">
                <td className="border p-1 text-left">Final Result </td>
                <td colSpan="3" className={`p-1 text-left ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {isPassed ? 'PASS' : 'FAIL'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contact Info */}
        <div className="text-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-semibold">
              <tbody>
                <tr className="text-sm sm:text-lg">
                  <td className="border-b p-1 text-center px-2 sm:px-10" colSpan={2}>For Queries about RSCIT Result</td>
                  <td className="border-b border-l p-1 text-center" colSpan={2}> RSCIT Qualifying Criteria</td>
                </tr>
                <tr className="">
                  <td className="p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2" colSpan={2}>INCHARGE RSCIT Examination</td>
                  <td className="border-l text-[15px] p-1" colSpan={2}>The Minimum Passing Score for </td>
                </tr>
                <tr>
                  <td className="p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2" colSpan={2}>Website MPCPCT.Com</td>
                  <td className="border-l p-1 pt-3 text-[15px]" colSpan={2}>each skill is 40% External (Theory) and </td>
                </tr>
                <tr>
                  <td className=" p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2" colSpan={2}>
                    Add:A.B Road SJR 465001(M.P.)<br/>Email:mpcpct111@gmail.com
                  </td>
                  <td className="border-l pl-1  text-[15px]" colSpan={2}>Internal (Assessment) Exams  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm border-t pt-2 sm:pt-4 px-2 sm:px-4 font-semibold">
          <p className="mb-2 sm:mb-0">Date of Publication of Result : <span>{new Date().toLocaleDateString()}</span></p>
          <img
            src="/seal.png"
            alt="Seal"
            className="h-16 sm:h-20 md:h-24 mx-auto pb-1 sm:pb-2 md:pb-5"
          />
          <div className="relative mt-1 sm:mt-0">
            <img 
              src="/sing.png" 
              alt="Controller" 
              className="h-16 sm:h-20 md:h-24 ml-auto mb-[-20px] sm:mb-[-35px]" 
            />
            <p className="italic text-gray-500 text-xs sm:text-sm">
              Head of Examinations
            </p>
          </div>
        </div>
        </div>
      </div>
      <button className="bg-red-600 hover:bg-blue-700 text-white font-medium px-4 py-2 mb-2 ml-35 sm:ml-40 md:ml-70 lg:ml-80 xl:ml-156">
        <a href="/">Go To Home</a>
      </button>
    </div>
  );
}
