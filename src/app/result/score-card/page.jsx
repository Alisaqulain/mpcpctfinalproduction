"use client";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";

export default function CpctScoreCard() {
  const [userName, setUserName] = useState("User");
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mcqScore, setMcqScore] = useState(0);
  const [mcqMax, setMcqMax] = useState(75);
  const [englishNetSpeed, setEnglishNetSpeed] = useState(0);
  const [hindiNetSpeed, setHindiNetSpeed] = useState(0);
  const [englishPassed, setEnglishPassed] = useState(false);
  const [hindiPassed, setHindiPassed] = useState(false);
  const [mcqPassed, setMcqPassed] = useState(false);
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
            
            // Get MCQ score from sectionStats
            if (profileResult.sectionStats && profileResult.sectionStats.length > 0) {
              const mcqSection = profileResult.sectionStats.find(s => s.sectionName === 'Section A' || s.sectionName.includes('MCQ'));
              if (mcqSection) {
                setMcqScore(mcqSection.score || 0);
                setMcqMax(mcqSection.totalQuestions * 1 || 75);
                setMcqPassed((mcqSection.score || 0) >= 38);
              }
            }
            
            setExamData({ title: profileResult.examTitle || 'CPCT' });
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

        // Load MCQ exam data
        const examId = localStorage.getItem('currentExamId');
        if (examId) {
          const res = await fetch(`/api/exam-questions?examId=${examId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data && data.data.exam?.key === 'CPCT') {
              setExamData(data.data.exam);
              
              // Load answers
              const answersStr = localStorage.getItem('examAnswers');
              const loadedAnswers = answersStr ? JSON.parse(answersStr) : {};
              
              // Calculate MCQ score
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

              // Find MCQ section (usually Section A)
              const mcqSection = sections.find(sec => 
                sec.name === 'Section A' || 
                sec.name.includes('MCQ') || 
                sec.name.includes('Computer Proficiency')
              );

              if (mcqSection) {
                const mcqQuestions = questionsBySection[mcqSection.name] || [];
                let mcqObtained = 0;
                let mcqMaximum = 0;

                mcqQuestions.forEach(q => {
                  const marks = q.marks || 1;
                  mcqMaximum += marks;
                  const answer = loadedAnswers[q._id];
                  if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
                    mcqObtained += marks;
                  }
                });

                setMcqMax(mcqMaximum || 75);
                setMcqScore(mcqObtained);
                setMcqPassed(mcqObtained >= 38);
              }
            }
          }
        }

        // Load English Typing Result
        const englishTypingResultStr = localStorage.getItem('englishTypingResult');
        if (englishTypingResultStr) {
          try {
            const englishResult = JSON.parse(englishTypingResultStr);
            const netSpeed = englishResult.netSpeed || 0;
            setEnglishNetSpeed(netSpeed);
            setEnglishPassed(netSpeed >= 30);
          } catch (error) {
            console.error('Error parsing English typing result:', error);
          }
        }

        // Load Hindi Typing Result
        const hindiTypingResultStr = localStorage.getItem('hindiTypingResult');
        if (hindiTypingResultStr) {
          try {
            const hindiResult = JSON.parse(hindiTypingResultStr);
            const netSpeed = hindiResult.netSpeed || 0;
            setHindiNetSpeed(netSpeed);
            setHindiPassed(netSpeed >= 20);
          } catch (error) {
            console.error('Error parsing Hindi typing result:', error);
          }
        }

        // CPCT overall pass: MCQ passed AND both typing sections passed
        setIsPassed(mcqPassed && englishPassed && hindiPassed);
      } catch (error) {
        console.error('Error loading result data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResultData();
  }, [mcqPassed, englishPassed, hindiPassed]);

  // Recalculate pass status when dependencies change
  useEffect(() => {
    setIsPassed(mcqPassed && englishPassed && hindiPassed);
  }, [mcqPassed, englishPassed, hindiPassed]);

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

  const mcqPercentage = mcqMax > 0 ? ((mcqScore / mcqMax) * 100).toFixed(2) : 0;
  const englishPercentage = englishNetSpeed > 0 ? ((englishNetSpeed / 60) * 100).toFixed(0) : 0; // Assuming 60 WPM is 100%
  const hindiPercentage = hindiNetSpeed > 0 ? ((hindiNetSpeed / 40) * 100).toFixed(0) : 0; // Assuming 40 WPM is 100%

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
    pdf.text('SCORE CARD', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    pdf.setFontSize(14);
    pdf.text('MPCPCT Examination 2025-26', pageWidth / 2, yPos, { align: 'center' });
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
    
    // Roll No and Exam Time
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1], rowHeight);
    pdf.rect(10 + colWidths[0] + colWidths[1], yPos, colWidths[2], rowHeight);
    pdf.rect(10 + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Roll No', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('-------', 10 + colWidths[0] + colWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.text('Exam Time', 10 + colWidths[0] + colWidths[1] + colWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('', 10 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Subject Name
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1] + colWidths[2] + colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject Name', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(examData?.title || 'CPCT', 10 + colWidths[0] + (colWidths[1] + colWidths[2] + colWidths[3])/2, yPos + 5, { align: 'center' });
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
    
    // Result Table - Complex layout
    pdf.setFontSize(10);
    const resultColWidths = [40, 50, 50, 50];
    const resultStartX = 10;
    
    // Header row 1
    pdf.setFillColor(200, 200, 200);
    pdf.rect(resultStartX, yPos, resultColWidths[0] + resultColWidths[1], rowHeight, 'F');
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2] + resultColWidths[3], rowHeight, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sections', resultStartX + (resultColWidths[0] + resultColWidths[1])/2, yPos + 5, { align: 'center' });
    pdf.text('Maximum Marks', resultStartX + resultColWidths[0] + resultColWidths[1] + (resultColWidths[2] + resultColWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Header row 2
    pdf.setFillColor(200, 200, 200);
    pdf.rect(resultStartX, yPos, resultColWidths[0] + resultColWidths[1], rowHeight, 'F');
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight, 'F');
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.text('Computer Proficiency', resultStartX + (resultColWidths[0] + resultColWidths[1])/2, yPos + 5, { align: 'center' });
    pdf.text('Net Typing Speed (WPM)', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text('Net Typing Speed (WPM)', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Data rows
    pdf.setFont('helvetica', 'normal');
    // Row 1: Marks Obtained, Out of, English, Hindi
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text('Marks Obtained', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text('Out of', resultStartX + resultColWidths[0] + resultColWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.text('English Typing', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text('Hindi Typing', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Row 2: Values
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text(mcqScore.toString(), resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text(mcqMax.toString(), resultStartX + resultColWidths[0] + resultColWidths[1]/2, yPos + 5, { align: 'center' });
    pdf.text(`${englishNetSpeed} WPM`, resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text(`${hindiNetSpeed} WPM`, resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Row 3: Percentages
    pdf.rect(resultStartX, yPos, resultColWidths[0] + resultColWidths[1], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text(`${mcqPercentage}%`, resultStartX + (resultColWidths[0] + resultColWidths[1])/2, yPos + 5, { align: 'center' });
    pdf.text(`${englishPercentage}%`, resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.text(`${hindiPercentage}%`, resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Row 4: Qualified status
    pdf.rect(resultStartX, yPos, resultColWidths[0] + resultColWidths[1], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1], yPos, resultColWidths[2], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2], yPos, resultColWidths[3], rowHeight);
    pdf.text(mcqPassed ? 'Qualified' : 'Not Qualified', resultStartX + (resultColWidths[0] + resultColWidths[1])/2, yPos + 5, { align: 'center' });
    pdf.setTextColor(englishPassed ? 0 : 255, englishPassed ? 128 : 0, 0);
    pdf.text(englishPassed ? 'Qualified' : 'Not Qualified', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2]/2, yPos + 5, { align: 'center' });
    pdf.setTextColor(hindiPassed ? 0 : 255, hindiPassed ? 128 : 0, 0);
    pdf.text(hindiPassed ? 'Qualified' : 'Not Qualified', resultStartX + resultColWidths[0] + resultColWidths[1] + resultColWidths[2] + resultColWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Total and Final Result
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1] + resultColWidths[2] + resultColWidths[3], rowHeight);
    pdf.text('Total', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.text(`${mcqScore}/${mcqMax}`, resultStartX + resultColWidths[0] + (resultColWidths[1] + resultColWidths[2] + resultColWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    pdf.rect(resultStartX, yPos, resultColWidths[0], rowHeight);
    pdf.rect(resultStartX + resultColWidths[0], yPos, resultColWidths[1] + resultColWidths[2] + resultColWidths[3], rowHeight);
    pdf.text('Final Result', resultStartX + resultColWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setTextColor(isPassed ? 0 : 255, isPassed ? 128 : 0, 0);
    const passText = isPassed ? 'Pass' : 'Fail';
    const qualifiedText = mcqPassed && englishPassed ? '(Qualified Computer Proficiency & English Typing)' : 
                         mcqPassed && hindiPassed ? '(Qualified Computer Proficiency & Hindi Typing)' :
                         mcqPassed ? '(Qualified only Computer Proficiency)' :
                         englishPassed && hindiPassed ? '(Qualified only Typing)' : '(Not Qualified)';
    pdf.text(`${passText} ${qualifiedText}`, resultStartX + resultColWidths[0] + (resultColWidths[1] + resultColWidths[2] + resultColWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += 15;
    
    // Footer
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date of Publication of Result: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    pdf.save(`CPCT-ScoreCard-${userName}-${Date.now()}.pdf`);
  };

  const qualifiedText = mcqPassed && englishPassed ? '(Qualified Computer Proficiency & English Typing)' : 
                         mcqPassed && hindiPassed ? '(Qualified Computer Proficiency & Hindi Typing)' :
                         mcqPassed ? '(Qualified only Computer Proficiency)' :
                         englishPassed && hindiPassed ? '(Qualified only Typing)' : '(Not Qualified)';

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
          <p className="uppercase font-semibold text-xl sm:text-2xl">Score Card </p>
          <p className="text-xl sm:text-2xl">MPCPCT Examination 2025-26</p>
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
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Exam Time</td>
                <td className="border border-black px-1 sm:px-2 py-1"></td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Subject Name</td>
                <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>{examData?.title || 'CPCT'}</td>
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
          <table className="w-full border border-gray-400 text-center font-semibold text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-1" colSpan={2}>Sections</th>
                <th className="border-l p-1" colSpan={2}>Maximum Marks</th>
              </tr>
              <tr className="bg-gray-200">
                <th className="p-1" colSpan={2}>Computer Proficiency</th>
                <th className="border-l p-1" colSpan={2}>Net Typing Speed (Word Per Minute)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1 text-center">Marks Obtained</td>
                <td className="border px-2 sm:px-9">Out of </td>
                <td className="border p-1">English Typing</td>
                <td className="border p-1">Hindi Typing</td>
              </tr>
              <tr>
                <td className="border p-1 text-center">{mcqScore}</td>
                <td className="border p-1">{mcqMax}</td>
                <td className="border p-1">{englishNetSpeed} WPM </td>
                <td className="border p-1">{hindiNetSpeed} WPM</td>
              </tr>
              <tr>
                <td className="border p-1 text-center" colSpan={2}>{mcqPercentage}%</td>
                <td className="border p-1">{englishPercentage}% </td>
                <td className="border p-1">{hindiPercentage}%</td>
              </tr>
              <tr>
                <td className="border p-1 text-center" colSpan={2}>
                  <span className={mcqPassed ? 'text-green-600' : 'text-red-600'}>
                    {mcqPassed ? 'Qualified' : 'Not Qualified'}
                  </span>
                </td>
                <td className="border p-1">
                  <span className={englishPassed ? 'text-green-600' : 'text-red-600'}>
                    {englishPassed ? 'Qualified' : 'Not Qualified'}
                  </span>
                </td>
                <td className="border p-1">
                  <span className={hindiPassed ? 'text-green-600' : 'text-red-600'}>
                    {hindiPassed ? 'Qualified' : 'Not Qualified'}
                  </span>
                </td>
              </tr>
              <tr className="font-bold">
                <td className="border p-1 text-center">Total</td>
                <td colSpan="3" className="border p-1 text-center">{mcqScore}/{mcqMax}</td>
              </tr>
              <tr className="font-bold">
                <td className="border p-1 text-center">Final Result</td>
                <td colSpan="3" className="border p-1 text-left pl-1 sm:pl-4">
                  <span className={isPassed ? 'text-green-600' : 'text-red-600'}>Pass  </span> 
                  <span className="pl-1 sm:pl-3">{qualifiedText}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contact Info */}
        <div className="text-xs border-t">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-semibold">
              <tbody>
                <tr className="text-sm sm:text-lg">
                  <td className="border p-1 text-center px-2 sm:px-10" colSpan={2}>For Queries about Cpct Result</td>
                  <td className="border p-1 text-center" colSpan={2}> CPCT Qualifying Criteria</td>
                </tr>
                <tr className="">
                  <td className="p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2" colSpan={2}>INCHARGE Cpct Examination</td>
                  <td className="border p-1">MCQ (Objective Computer Proficiency) </td>
                  <td className="border p-1">Minimum 38 marks (which equals 50%)</td>
                </tr>
                <tr>
                  <td className="p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2" colSpan={2}>Website MPCPCT.Com</td>
                  <td className="border p-1">English Typing Test  </td>
                  <td className="border p-1">Minimum 30 NWPM (Net Words Per Minute) — equivalent to 50% scaled</td>
                </tr>
                <tr>
                  <td className="border-b p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2" colSpan={2}>
                    Add:A.B Road SJR 465001(M.P.)<br/>Email:mpcpct111@gmail.com
                  </td>
                  <td className="border p-1">Hindi Typing Test  </td>
                  <td className="border p-1">Minimum 20 NWPM — equivalent to 50% scaled</td>
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
