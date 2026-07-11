"use client";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import Link from "next/link";
import {
  normalizePassingConfig,
  formatPublicationDate,
  getOfficialResultPath,
} from "@/lib/examPassingCriteria";
import { formatResultDateDDMM } from "@/lib/formatResultDate";
import {
  DEFAULT_PROFILE_AVATAR,
  fetchUserProfileFromApi,
  mergeExamUserProfile,
  readExamUserDataFromStorage,
  resolveUserProfileUrl,
  resolveUserRollNo,
} from "@/lib/userProfile";

export default function CpctScoreCard() {
  const [userName, setUserName] = useState("User");
  const [rollNo, setRollNo] = useState("-------");
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
  const [passConfig, setPassConfig] = useState(null);
  const [publicationDate, setPublicationDate] = useState("");
  const [userProfileUrl, setUserProfileUrl] = useState(DEFAULT_PROFILE_AVATAR);

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true);

        const userData = readExamUserDataFromStorage();
        let apiUser = null;
        try {
          apiUser = await fetchUserProfileFromApi();
        } catch {
          /* ignore */
        }
        const mergedUser = mergeExamUserProfile(userData, apiUser);
        const resolvedProfileUrl = resolveUserProfileUrl(mergedUser);
        const resolvedRollNo = resolveUserRollNo(mergedUser);
        setUserProfileUrl(resolvedProfileUrl);
        setRollNo(resolvedRollNo);
        if (mergedUser.name) {
          setUserName(mergedUser.name);
        } else if (userData?.name) {
          setUserName(userData.name);
        } else if (apiUser?.name) {
          setUserName(apiUser.name);
        }
        
        // Check if data is coming from profile
        const profileResultDataStr = localStorage.getItem('profileResultData');
        if (profileResultDataStr) {
          try {
            const profileResult = JSON.parse(profileResultDataStr);
            const profileExamKey = profileResult.examKey;
            const profileResultPath = getOfficialResultPath(profileExamKey);
            if (profileResultPath && profileResultPath !== "/result/score-card") {
              window.location.replace(profileResultPath);
              return;
            }

            setUserName(profileResult.userName || mergedUser.name || "User");
            const fromProfileResult = resolveUserProfileUrl(profileResult);
            setUserProfileUrl(
              fromProfileResult !== DEFAULT_PROFILE_AVATAR
                ? fromProfileResult
                : resolvedProfileUrl
            );
            const fromProfileRoll = resolveUserRollNo(profileResult);
            setRollNo(fromProfileRoll !== "-------" ? fromProfileRoll : resolvedRollNo);
            
            // Get MCQ score from sectionStats
            if (profileResult.sectionStats && profileResult.sectionStats.length > 0) {
              const mcqSection = profileResult.sectionStats.find(s => s.sectionName === 'Section A' || s.sectionName.includes('MCQ'));
              if (mcqSection) {
                setMcqScore(mcqSection.score || 0);
                setMcqMax(mcqSection.totalQuestions * 1 || 75);
                const cfg = normalizePassingConfig({ key: profileExamKey || "CPCT" });
                setPassConfig(cfg);
                setMcqPassed((mcqSection.score || 0) >= cfg.mcqPassingMarks);
              }
            }
            
            setExamData({
              title: profileResult.examTitle || profileExamKey || "Exam",
              key: profileExamKey || "CPCT",
            });
            setLoading(false);
            localStorage.removeItem('profileResultData'); // Clean up
            return;
          } catch (error) {
            console.error('Error parsing profile result data:', error);
          }
        }

        let config = normalizePassingConfig({ key: "CPCT" });

        // Load MCQ exam data (CPCT score card only)
        const examId = localStorage.getItem('currentExamId');
        if (examId) {
          const res = await fetch(`/api/exam-questions?examId=${examId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data?.exam) {
              const exam = data.data.exam;
              const resultPath = getOfficialResultPath(exam.key);
              if (resultPath && resultPath !== "/result/score-card") {
                window.location.replace(resultPath);
                return;
              }

              setExamData(exam);
              config = normalizePassingConfig(exam);
              setPassConfig(config);
              setPublicationDate(formatPublicationDate(config.resultPublicationDate));
              
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
                setMcqPassed(mcqObtained >= config.mcqPassingMarks);
              }
            }
          }
        }

        const englishTypingResultStr = localStorage.getItem("englishTypingResult");
        if (englishTypingResultStr) {
          try {
            const englishResult = JSON.parse(englishTypingResultStr);
            const netSpeed = englishResult.netSpeed || 0;
            setEnglishNetSpeed(netSpeed);
            setEnglishPassed(netSpeed >= config.englishTypingPassingNWPM);
          } catch (error) {
            console.error("Error parsing English typing result:", error);
          }
        }

        const hindiTypingResultStr = localStorage.getItem("hindiTypingResult");
        if (hindiTypingResultStr) {
          try {
            const hindiResult = JSON.parse(hindiTypingResultStr);
            const netSpeed = hindiResult.netSpeed || 0;
            setHindiNetSpeed(netSpeed);
            setHindiPassed(netSpeed >= config.hindiTypingPassingNWPM);
          } catch (error) {
            console.error("Error parsing Hindi typing result:", error);
          }
        }
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
  const subjectName = examData?.title || examData?.key || "Exam";

  const handleDownloadPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const pubDate = publicationDate || formatPublicationDate(null);
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 16, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MPCPCT', 12, 8);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('To Help in typing & computer proficiency', 12, 13);
    pdf.text('Examination 2025-26', pageWidth - 12, 10, { align: 'right' });
    
    // Title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    let yPos = 28;
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
    pdf.text(formatResultDateDDMM(null), 10 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Roll No
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1] + colWidths[2] + colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Roll No', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(rollNo, 10 + colWidths[0] + (colWidths[1] + colWidths[2] + colWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += rowHeight;
    
    // Subject Name
    pdf.rect(10, yPos, colWidths[0], rowHeight);
    pdf.rect(10 + colWidths[0], yPos, colWidths[1] + colWidths[2] + colWidths[3], rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject Name', 10 + colWidths[0]/2, yPos + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(subjectName, 10 + colWidths[0] + (colWidths[1] + colWidths[2] + colWidths[3])/2, yPos + 5, { align: 'center' });
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
    pdf.text(isPassed ? 'Pass' : 'Fail', resultStartX + resultColWidths[0] + (resultColWidths[1] + resultColWidths[2] + resultColWidths[3])/2, yPos + 5, { align: 'center' });
    yPos += 12;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date of Publication of Result: ${pubDate}`, 12, pageHeight - 10);
    pdf.text('Head of Examinations', pageWidth - 12, pageHeight - 10, { align: 'right' });
    
    // Save PDF
    pdf.save(`CPCT-ScoreCard-${userName}-${Date.now()}.pdf`);
  };

  return (
    <div className="px-2 sm:px-0">
      <div className="max-w-4xl mx-auto shadow-xl text-sm font-sans bg-white my-3 sm:my-5 border-2 border-[#290c52]">
        <div className="border-x-2 border-[#290c52]">

        {/* Mobile header — logo left, title centered */}
        <div
          className="sm:hidden relative w-full border-b border-[#290c52] min-h-[4.5rem]"
          style={{ backgroundColor: "#290c52" }}
        >
          <img
            src="/logor.png"
            alt="MPCPCT Logo"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-14 w-auto object-contain"
          />
          <div className="text-center px-3 py-2.5 pl-16 pr-3">
            <h1 className="text-xl font-extrabold uppercase text-white tracking-wide leading-tight">
              MPCPCT
            </h1>
            <p className="text-[11px] text-pink-200 font-medium mt-1 leading-snug">
              To Help in typing &amp; computer proficiency
            </p>
          </div>
        </div>

        {/* Desktop header */}
        <div
          className="hidden sm:flex w-full px-3 py-2 border-b border-[#290c52] items-center justify-between gap-2 min-h-[3rem]"
          style={{ backgroundColor: "#290c52" }}
        >
          <img
            src="/logor.png"
            alt="MPCPCT Logo"
            className="h-16 w-auto object-contain flex-shrink-0"
          />
          <h1 className="text-2xl font-extrabold uppercase text-white tracking-wide">
            MPCPCT
          </h1>
          <p className="text-xs text-pink-200 font-medium text-center flex-1">
            To Help in typing &amp; computer proficiency
          </p>
          <p className="text-xs text-white/90 whitespace-nowrap">Examination 2025-26</p>
        </div>

        {/* Mobile: profile pic + Score Card / exam year / exam title */}
        <div className="sm:hidden relative border-b border-gray-300 min-h-[6.5rem]">
          <img
            src={userProfileUrl}
            alt="Student"
            className="absolute left-0 bottom-0 w-[6.75rem] h-[6.5rem] border-2 border-black border-l-0 border-b-0 object-cover bg-white"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_PROFILE_AVATAR;
            }}
          />
          <div className="text-center pl-[7.25rem] pr-3 py-3 min-w-0">
            <p className="uppercase font-bold text-lg leading-tight">Score Card</p>
            <p className="text-sm mt-1 leading-tight">{subjectName}</p>
            <p className="text-xs mt-1 leading-tight">Examination 2025-26</p>
          </div>
        </div>

        {/* Desktop: title + profile */}
        <div className="hidden sm:block relative border-b border-gray-300 pb-2 pt-1 px-3 min-h-[4.5rem]">
          <img
            src={userProfileUrl}
            alt="Student"
            className="absolute left-3 bottom-0 w-[5.5rem] h-[4.25rem] border-2 border-[#290c52] object-cover bg-white"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_PROFILE_AVATAR;
            }}
          />
          <div className="text-center pl-[6.5rem] pr-2">
            <p className="uppercase font-semibold text-xl leading-tight">Score Card</p>
            <p className="text-lg leading-tight">{subjectName}</p>
          </div>
        </div>

        {/* Details Table */}
        <div className="overflow-x-auto text-xs sm:text-sm border border-gray-300 w-full max-w-full mx-auto">
          <table className="table-auto w-full border border-black">
            <tbody>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Name of Student</td>
                <td className="border border-black px-1 sm:px-2 py-1">{userName}</td>
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Result Date</td>
                <td className="border border-black px-1 sm:px-2 py-1">{formatResultDateDDMM(null)}</td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Roll No</td>
                <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>
                  {rollNo}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Subject Name</td>
                <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>{subjectName}</td>
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
          <table className="w-full border border-gray-400 border-collapse text-center font-semibold text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-1 border border-gray-400" colSpan={2}>Sections</th>
                <th className="border border-gray-400 p-1" colSpan={2}>Maximum Marks</th>
              </tr>
              <tr className="bg-gray-200 border-b-2 border-gray-500">
                <th className="p-1 border border-gray-400" colSpan={2}>Section 1 — Computer Proficiency</th>
                <th className="border border-gray-400 p-1">Section 2 — English Typing</th>
                <th className="border border-gray-400 p-1">Section 3 — Hindi Typing</th>
              </tr>
              <tr className="bg-gray-100 text-[10px] sm:text-xs">
                <th className="p-0.5 border border-gray-400" colSpan={2}>Maximum Marks</th>
                <th className="border border-gray-400 p-0.5" colSpan={2}>Net Typing Speed (WPM)</th>
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
                  <span className={`font-semibold ${mcqPassed ? "text-green-600" : "text-red-600"}`}>
                    {mcqPassed ? "Qualified" : "Not Qualified"}
                  </span>
                </td>
                <td className="border p-1">
                  <span className={`font-semibold ${englishPassed ? "text-green-600" : "text-red-600"}`}>
                    {englishPassed ? "Qualified" : "Not Qualified"}
                  </span>
                </td>
                <td className="border p-1">
                  <span className={`font-semibold ${hindiPassed ? "text-green-600" : "text-red-600"}`}>
                    {hindiPassed ? "Qualified" : "Not Qualified"}
                  </span>
                </td>
              </tr>
              <tr className="font-bold text-black">
                <td className="border border-black p-1 text-center">Total</td>
                <td colSpan="3" className="border border-black p-1 text-center font-bold">
                  <span className={mcqPassed ? "text-green-600" : "text-red-600"}>{mcqScore}</span>
                  <span className="text-black">/{mcqMax}</span>
                </td>
              </tr>
              <tr className="font-bold">
                <td className="border border-black p-1 text-center text-black">Final Result</td>
                <td colSpan="3" className="border border-black p-1 text-center">
                  <span className={isPassed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {isPassed ? "Pass" : "Fail"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Compact footer: date left, seal center, signature right */}
        <div className="grid grid-cols-3 items-end gap-1 text-[10px] sm:text-xs border-t border-[#290c52] py-2 px-2 sm:px-3 font-semibold min-h-[5rem]">
          <p className="text-left self-end pb-1">
            Date of Publication of Result:<br />
            <span>{formatResultDateDDMM(publicationDate || null)}</span>
          </p>
          <div className="flex justify-center self-end">
            <img src="/seal.png" alt="Seal" className="h-12 sm:h-16 md:h-20 object-contain" />
          </div>
          <div className="text-right self-end">
            <img src="/sing.png" alt="Controller" className="h-12 sm:h-16 md:h-20 ml-auto object-contain" />
            <p className="italic text-gray-600 text-[9px] sm:text-xs mt-0.5">Head of Examinations</p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-row justify-between items-center gap-2 px-3 py-3 border-t border-[#290c52] bg-gray-50">
          <Link
            href="/"
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded text-xs sm:text-sm"
          >
            Go To Home
          </Link>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-xs sm:text-sm"
          >
            Download PDF
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
