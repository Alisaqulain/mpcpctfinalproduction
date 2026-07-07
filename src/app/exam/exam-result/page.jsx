"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import {
  evaluateExamPassing,
  buildCriteriaLines,
  normalizePassingConfig,
} from "@/lib/examPassingCriteria";
import {
  fetchUserProfileFromApi,
  mergeExamUserProfile,
  readExamUserDataFromStorage,
  resolveUserProfileUrl,
} from "@/lib/userProfile";
import UserProfileAvatar from "@/components/common/UserProfileAvatar";

function ExamResultContent() {
  const [userName, setUserName] = useState("User");
  const [examData, setExamData] = useState(null);
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [sectionStats, setSectionStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [viewLanguage, setViewLanguage] = useState("हिन्दी");
  const [showAnswers, setShowAnswers] = useState(true); // Show answers by default on result page
  const [passingMarks, setPassingMarks] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [typingResults, setTypingResults] = useState([]);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [userProfileUrl, setUserProfileUrl] = useState("/lo.jpg");
  const [criteriaLines, setCriteriaLines] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSection = searchParams?.get("section") || null;
  
  // Use the same language the user selected during the exam
  useEffect(() => {
    const savedViewLang = localStorage.getItem("viewLanguage");
    if (savedViewLang === "English" || savedViewLang === "हिन्दी") {
      setViewLanguage(savedViewLang);
    }
  }, []);

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true);
        
        // Check if all sections are completed
        const savedCompletedSections = localStorage.getItem('completedSections');
        const examId = localStorage.getItem('currentExamId');
        const topicId = localStorage.getItem('currentTopicId');
        
        if (!examId && !topicId) {
          console.error('No exam ID or topic ID found');
          setLoading(false);
          return;
        }

        // If section parameter is provided, show section-specific results
        // Allow viewing results even if section is not marked as completed (old functionality)
        if (currentSection) {
          // Section parameter provided - show section-specific results
          // Allow viewing even if not marked as completed (old behavior)
          // Just show a warning if section is not completed
          const completedSections = savedCompletedSections ? JSON.parse(savedCompletedSections) : [];
          if (!completedSections.includes(currentSection)) {
            // Section not completed, but allow viewing (old functionality)
            console.log('Section not marked as completed, but allowing view (old functionality)');
          }
        }
        // If no section parameter, show all results (old functionality - no blocking)
        
        const userData = readExamUserDataFromStorage();
        let apiUser = null;

        try {
          apiUser = await fetchUserProfileFromApi();
        } catch {
          /* ignore */
        }

        const mergedUser = mergeExamUserProfile(userData, apiUser);
        if (mergedUser.name) {
          setUserName(mergedUser.name);
        } else if (userData?.name) {
          setUserName(userData.name);
        } else if (apiUser?.name) {
          setUserName(apiUser.name);
        }
        setUserProfileUrl(resolveUserProfileUrl(mergedUser));

        // Load selected answers
        const answersStr = localStorage.getItem('examAnswers');
        let loadedAnswers = {};
        if (answersStr) {
          try {
            loadedAnswers = JSON.parse(answersStr);
            setSelectedAnswers(loadedAnswers);
          } catch (error) {
            console.error('Error parsing answers:', error);
          }
        }

        // Load visited questions
        const visitedStr = localStorage.getItem('visitedQuestions');
        if (visitedStr) {
          try {
            setVisitedQuestions(new Set(JSON.parse(visitedStr)));
          } catch (error) {
            console.error('Error loading visited questions:', error);
          }
        }

        // Load marked for review
        const markedStr = localStorage.getItem('markedForReview');
        if (markedStr) {
          try {
            setMarkedForReview(new Set(JSON.parse(markedStr)));
          } catch (error) {
            console.error('Error loading marked questions:', error);
          }
        }

        // Fetch exam data
        const apiUrl = topicId 
          ? `/api/exam-questions?topicId=${topicId}`
          : `/api/exam-questions?examId=${examId}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setExamData(data.data.exam);
            setCriteriaLines(buildCriteriaLines(data.data.exam));
            setSections(data.data.sections || []);
            
            // Organize questions by section
            const questionsBySection = {};
            data.data.sections.forEach(sec => {
              const sectionQuestions = data.data.allQuestions.filter(q => {
                const qSectionId = String(q.sectionId).trim();
                const secIdStr = String(sec.id).trim();
                const secIdObj = String(sec._id).trim();
                return qSectionId === secIdObj || 
                       qSectionId === secIdStr ||
                       qSectionId === sec._id.toString() ||
                       qSectionId === sec.id;
              });
              questionsBySection[sec.name] = sectionQuestions;
            });
            setQuestions(questionsBySection);
            
            // Calculate section statistics using loaded answers
            // Get visited and marked questions from localStorage
            const visitedStr = localStorage.getItem('visitedQuestions');
            const markedStr = localStorage.getItem('markedForReview');
            const visitedSet = visitedStr ? new Set(JSON.parse(visitedStr)) : new Set();
            const markedSet = markedStr ? new Set(JSON.parse(markedStr)) : new Set();
            
            // Get completed sections
            const savedCompletedSections = localStorage.getItem('completedSections');
            const completedSectionsSet = savedCompletedSections ? new Set(JSON.parse(savedCompletedSections)) : new Set();
            
            // Find current section index if section parameter is provided
            const currentSectionIndex = currentSection 
              ? data.data.sections.findIndex(s => s.name === currentSection)
              : -1;
            
            const stats = [];
            data.data.sections.forEach((sec, index) => {
              const secQuestions = questionsBySection[sec.name] || [];
              const isCompleted = completedSectionsSet.has(sec.name);
              
              // Check if section has any answers, visited questions, or marked questions
              const hasAnswers = secQuestions.some(q => loadedAnswers[q._id] !== undefined && loadedAnswers[q._id] !== null);
              const hasVisited = secQuestions.some(q => visitedSet.has(q._id));
              const hasMarked = secQuestions.some(q => markedSet.has(q._id));
              const sectionHasData = isCompleted || hasAnswers || hasVisited || hasMarked;
              
              // If section parameter is provided, show:
              // - Current section: full stats (always calculate)
              // - Previous sections: always show their stats (calculate below)
              // - Upcoming sections: always show "Yet to attempt"
              if (currentSection && currentSectionIndex !== -1) {
                if (index === currentSectionIndex) {
                  // Current section - always show full stats (calculate below)
                } else if (index < currentSectionIndex) {
                  // Previous section - ALWAYS show stats (even if no data, show zeros)
                  // Don't mark as "Yet to attempt" for previous sections
                  // Continue to calculate stats below
                } else {
                  // Upcoming section - always show "Yet to attempt"
                  stats.push({
                    sectionName: sec.name,
                    totalQuestions: secQuestions.length,
                    answered: 0,
                    notAnswered: 0,
                    markedForReview: 0,
                    answeredAndMarked: 0,
                    notVisited: 0,
                    correct: 0,
                    incorrect: 0,
                    score: 0,
                    yetToAttempt: true
                  });
                  return;
                }
              } else {
                // No section parameter - show all sections
                // If section is not completed and has no data, mark as "Yet to attempt"
                if (!sectionHasData) {
                  stats.push({
                    sectionName: sec.name,
                    totalQuestions: secQuestions.length,
                    answered: 0,
                    notAnswered: 0,
                    markedForReview: 0,
                    answeredAndMarked: 0,
                    notVisited: 0,
                    correct: 0,
                    incorrect: 0,
                    score: 0,
                    yetToAttempt: true
                  });
                  return;
                }
              }
              
              let answered = 0;
              let notAnswered = 0;
              let markedForReviewCount = 0;
              let answeredAndMarked = 0;
              let notVisited = 0;
              let correct = 0;
              let incorrect = 0;
              
              secQuestions.forEach(q => {
                const answer = loadedAnswers[q._id];
                const isVisited = visitedSet.has(q._id);
                const isMarked = markedSet.has(q._id);
                
                if (answer !== undefined && answer !== null) {
                  answered++;
                  if (answer === q.correctAnswer) {
                    correct++;
                  } else {
                    incorrect++;
                  }
                  if (isMarked) {
                    answeredAndMarked++;
                  }
                } else {
                  notAnswered++;
                  if (isMarked) {
                    markedForReviewCount++;
                  }
                }
                
                if (!isVisited) {
                  notVisited++;
                }
              });
              
              // Calculate score based on marks per question
              let sectionScore = 0;
              secQuestions.forEach(q => {
                const answer = loadedAnswers[q._id];
                if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
                  sectionScore += (q.marks || 1);
                }
              });
              
              stats.push({
                sectionName: sec.name,
                totalQuestions: secQuestions.length,
                answered,
                notAnswered,
                markedForReview: markedForReviewCount,
                answeredAndMarked,
                notVisited,
                correct,
                incorrect,
                score: sectionScore,
                yetToAttempt: false
              });
            });
            setSectionStats(stats);
            
            // Calculate passing status and set state
            if (currentSection) {
              // For section-specific view, calculate pass/fail for this section only
              const currentSectionStat = stats.find(s => s.sectionName === currentSection);
              if (currentSectionStat) {
                const sectionQuestions = questionsBySection[currentSection] || [];
                const sectionMaxMarks = sectionQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
                const sectionScore = currentSectionStat.score || 0;
                
                // Get section's minimum marks requirement
                const currentSectionData = data.data.sections.find(s => s.name === currentSection);
                const cfg = normalizePassingConfig(data.data.exam);
                let sectionPassingMarks = 0;
                if (cfg.examKey === "RSCIT") {
                  if (currentSection === "Section A") sectionPassingMarks = cfg.sectionAMinMarks;
                  else if (currentSection === "Section B") sectionPassingMarks = cfg.sectionBMinMarks;
                  else sectionPassingMarks = currentSectionData?.minimumMarks || Math.ceil(sectionMaxMarks * (cfg.passingPercent / 100));
                } else if (currentSectionData?.minimumMarks) {
                  sectionPassingMarks = currentSectionData.minimumMarks;
                } else {
                  sectionPassingMarks = cfg.overallPassingMarks ?? Math.ceil(sectionMaxMarks * (cfg.passingPercent / 100));
                }
                
                setPassingMarks(sectionPassingMarks);
                setIsPassed(sectionScore >= sectionPassingMarks);
              }
            } else {
              // For full exam view, calculate overall pass/fail
              const totalScore = stats.reduce((sum, s) => sum + (s.score || 0), 0);
              const totalMaxMarks = stats.reduce((sum, s) => {
                const sectionQuestions = questionsBySection[s.sectionName] || [];
                return sum + sectionQuestions.reduce((qSum, q) => qSum + (q.marks || 1), 0);
              }, 0);
              const evalResult = evaluateExamPassing(data.data.exam, stats, totalMaxMarks);
              setPassingMarks(evalResult.passingMarksValue);
              setIsPassed(evalResult.isPassedValue);
              setTypingResults(evalResult.typingResults);
            }
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

  const handleSubmit = async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      const userDataStr = localStorage.getItem('examUserData');
      const userData = userDataStr ? JSON.parse(userDataStr) : {};
      const examId = localStorage.getItem('currentExamId');
      const examType = localStorage.getItem('examType');
      
      const totalAnswered = Object.keys(selectedAnswers).length;
      const totalCorrect = sectionStats.reduce((sum, stat) => sum + stat.correct, 0);
      const totalIncorrect = sectionStats.reduce((sum, stat) => sum + stat.incorrect, 0);
      
      // Calculate total score based on marks per question
      let totalScore = 0;
      let totalMaxMarks = 0;
      sectionStats.forEach(stat => {
        const sectionQuestions = questions[stat.sectionName] || [];
        sectionQuestions.forEach(q => {
          const marks = q.marks || 1;
          totalMaxMarks += marks;
          if (selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] === q.correctAnswer) {
            totalScore += marks;
          }
        });
      });
      
      const totalQuestions = sectionStats.reduce((sum, stat) => sum + stat.totalQuestions, 0);
      const percentage = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;
      
      const evalResult = evaluateExamPassing(examData, sectionStats, totalMaxMarks);
      const passingMarks = evalResult.passingMarksValue;
      const isPassed = evalResult.isPassedValue;
      const typingResults = evalResult.typingResults;
      
      // Save result to database
      const resultData = {
        userId: userData.mobile || 'anonymous',
        examId: examId,
        examTitle: examData?.title || 'Exam',
        examType: examType || 'CUSTOM',
        userName: userName,
        userMobile: userData.mobile,
        userCity: userData.city,
        answers: selectedAnswers,
        sectionStats: sectionStats,
        totalQuestions: totalQuestions,
        totalAnswered: totalAnswered,
        totalCorrect: totalCorrect,
        totalIncorrect: totalIncorrect,
        totalScore: totalScore,
        totalMaxMarks: totalMaxMarks,
        percentage: percentage,
        passingMarks: passingMarks,
        isPassed: isPassed,
        typingResults: typingResults,
        timeTaken: 0 // You can calculate this from start time
      };
      
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      });
      
      if (res.ok) {
        // Store result ID for profile page
        const result = await res.json();
        localStorage.setItem('lastResultId', result.result._id);
        
        // Redirect to score card after final submit
        window.location.href = "/result/score-card";
      } else {
        alert('Error saving result. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      alert('Error submitting result. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('MPCPCT 2025', pageWidth / 2, 12, { align: 'center' });
    
    // User Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    let yPos = 30;
    pdf.text(`Name: ${userName}`, 10, yPos);
    yPos += 10;
    if (examData) {
      pdf.text(`Exam: ${examData.title}`, 10, yPos);
      yPos += 10;
    }
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 10, yPos);
    yPos += 15;
    
    // Section Statistics Table
    pdf.setFontSize(12);
    pdf.text('Exam Summary', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Table headers
    const headers = ['Section', 'Total', 'Answered', 'Not Ans', 'Correct', 'Score'];
    const colWidths = [60, 20, 25, 25, 25, 25];
    let xPos = 10;
    
    pdf.setFontSize(10);
    headers.forEach((header, i) => {
      pdf.rect(xPos, yPos, colWidths[i], 8);
      pdf.text(header, xPos + colWidths[i] / 2, yPos + 5, { align: 'center' });
      xPos += colWidths[i];
    });
    yPos += 8;
    
    // Table rows
    sectionStats.forEach(stat => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      xPos = 10;
      const rowData = [
        stat.sectionName.substring(0, 20),
        stat.totalQuestions.toString(),
        stat.answered.toString(),
        stat.notAnswered.toString(),
        stat.correct.toString(),
        stat.score.toString()
      ];
      rowData.forEach((data, i) => {
        pdf.rect(xPos, yPos, colWidths[i], 8);
        pdf.text(data, xPos + colWidths[i] / 2, yPos + 5, { align: 'center' });
        xPos += colWidths[i];
      });
      yPos += 8;
    });
    
    // Total
    yPos += 5;
    const totalCorrect = sectionStats.reduce((sum, s) => sum + s.correct, 0);
    const totalQuestions = sectionStats.reduce((sum, s) => sum + s.totalQuestions, 0);
    pdf.setFontSize(12);
    pdf.text(`Total Score: ${totalCorrect} / ${totalQuestions}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    pdf.text(`Percentage: ${totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%`, pageWidth / 2, yPos, { align: 'center' });
    
    // Save PDF
    pdf.save(`exam-result-${userName}-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const displayScore = currentSection
    ? (sectionStats.find((s) => s.sectionName === currentSection)?.score || 0)
    : sectionStats.reduce((sum, s) => sum + (s.score || 0), 0);
  const displayMaxMarks = currentSection
    ? (questions[currentSection] || []).reduce((sum, q) => sum + (q.marks || 1), 0)
    : sectionStats.reduce((sum, s) => {
        const sectionQuestions = questions[s.sectionName] || [];
        return sum + sectionQuestions.reduce((qSum, q) => qSum + (q.marks || 1), 0);
      }, 0);
  const displayPercentage =
    displayMaxMarks > 0 ? ((displayScore / displayMaxMarks) * 100).toFixed(2) : "0.00";
  return (
    <div className="min-h-screen bg-white text-sm">
      {/* Header with profile */}
      <div className="bg-[#290c52] text-white px-3 py-2 flex items-center justify-between gap-2 border-b border-[#1a0835]">
        <span className="text-yellow-400 text-base sm:text-lg font-bold whitespace-nowrap">MPCPCT 2025</span>
        <div className="flex items-center gap-2 min-w-0">
          <UserProfileAvatar
            src={userProfileUrl}
            alt={userName}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white/80 object-cover flex-shrink-0"
          />
          <span className="text-sm font-semibold truncate max-w-[10rem] sm:max-w-none">{userName}</span>
        </div>
      </div>

      <h1 className="text-center text-xl sm:text-2xl font-semibold my-3 px-2">
        {currentSection ? `Section Summary: ${currentSection}` : "Exam Summary"}
      </h1>
      
      {/* Download PDF Button and View Official Result - Only show for full exam summary */}
      {!currentSection && (
        <div className="mb-4 px-4">
          <div className="flex flex-row gap-2 w-full">
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-2.5 rounded-lg font-semibold flex-1 basis-0 min-h-[44px] text-xs sm:text-sm text-center"
            >
              Download PDF
            </button>
            {examData?.key && (
              <button
                onClick={() => {
                  let resultPath = '';
                  if (examData.key === 'CCC') {
                    resultPath = '/result/ccc';
                  } else if (examData.key === 'RSCIT') {
                    resultPath = '/result/rscit';
                  } else if (examData.key === 'CPCT') {
                    resultPath = '/result/score-card';
                  } else if (examData.key === 'TOPICWISE') {
                    resultPath = '/result/topic';
                  }
                  if (resultPath) {
                    router.push(resultPath);
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-2 py-2.5 rounded-lg font-semibold flex-1 basis-0 min-h-[44px] text-xs sm:text-sm text-center leading-tight"
              >
                View Official Result Certificate
              </button>
            )}
          </div>
        </div>
      )}

      {/* CPCT Actual Summary */}
      <div className="px-4">
        <p className="font-semibold mb-2 text-gray-800">
          {examData?.title || 'Exam'} {currentSection ? `: ${currentSection}` : ''}
        </p>

        <div className="overflow-x-auto border border-gray-300">
          <table className="w-full text-center border text-sm">
            <thead className="bg-blue-100">
              <tr className="border-b">
                <th className="border p-2">Section Name</th>
                <th className="border p-2">No. of Questions</th>
                <th className="border p-2">Answered</th>
                <th className="border p-2">Not Answered</th>
                <th className="border p-2">Marked for Review</th>
                <th className="border p-2">
                  Answered & Marked for Review<br />(will not be considered for evaluation)
                </th>
                <th className="border p-2">Not Visited</th>
                <th className="border p-2">Correct</th>
                <th className="border p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {sectionStats.length > 0 ? (
                // Show all sections - current section with stats, upcoming with "Yet to attempt"
                sectionStats.map((stat, idx) => (
                  <tr key={idx}>
                    <td className="border p-2 text-left">
                      {stat.sectionName}
                      {stat.yetToAttempt && <span className="text-gray-500 ml-2">( Yet to attempt )</span>}
                    </td>
                    <td className="border p-2">{stat.yetToAttempt ? '-' : stat.totalQuestions}</td>
                    <td className="border p-2">{stat.yetToAttempt ? '-' : stat.answered}</td>
                    <td className="border p-2">{stat.yetToAttempt ? '-' : stat.notAnswered}</td>
                    <td className="border p-2">{stat.yetToAttempt ? '-' : stat.markedForReview}</td>
                    <td className="border p-2">{stat.yetToAttempt ? '-' : stat.answeredAndMarked}</td>
                    <td className="border p-2">{stat.yetToAttempt ? '-' : stat.notVisited}</td>
                    <td className="border p-2 text-green-600 font-semibold">{stat.yetToAttempt ? '-' : stat.correct}</td>
                    <td className="border p-2 font-semibold">{stat.yetToAttempt ? '-' : stat.score}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="border p-4 text-gray-500">No data available</td>
                </tr>
              )}
              {sectionStats.length > 0 && !currentSection && (
                <tr className="bg-gray-100 font-bold">
                  <td className="border p-2 text-left">Total</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.totalQuestions, 0)}</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.answered, 0)}</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.notAnswered, 0)}</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.markedForReview, 0)}</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.answeredAndMarked, 0)}</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.notVisited, 0)}</td>
                  <td className="border p-2 text-green-600">{sectionStats.reduce((sum, s) => sum + s.correct, 0)}</td>
                  <td className="border p-2">{sectionStats.reduce((sum, s) => sum + s.score, 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Score summary box */}
        {sectionStats.length > 0 && (
          <div className="mt-4">
            <div
              className={`p-4 sm:p-5 rounded-lg mb-3 ${
                isPassed ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"
              }`}
            >
              <div className="text-center space-y-1">
                <p className="text-lg sm:text-xl font-bold">
                  Score: {displayScore} / {displayMaxMarks}
                </p>
                <p className="text-base sm:text-lg">Percentage: {displayPercentage}%</p>
                <p className="text-sm sm:text-base font-semibold">
                  Passing Marks: {passingMarks}
                </p>
                <p className={`text-2xl sm:text-3xl font-bold pt-1 ${isPassed ? "text-green-700" : "text-red-700"}`}>
                  {isPassed ? "PASSED" : "FAILED"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCriteriaModal(true)}
              className="w-full sm:w-auto bg-[#290c52] hover:bg-[#3d1570] text-white px-5 py-2 rounded-lg font-semibold text-sm mb-4"
            >
              View Criteria
            </button>

            {/* CPCT typing results (compact) */}
            {examData?.key === "CPCT" && typingResults.length > 0 && (
              <div className="space-y-2 mb-2">
                {typingResults.map((tr, idx) => {
                      const typingResultKey = tr.language === "English" ? "englishTypingResult" : "hindiTypingResult";
                      const fullTypingResult = localStorage.getItem(typingResultKey);
                      let errors = tr.errors || [];
                      let remarks = tr.remarks || "";
                      
                      if (fullTypingResult && errors.length === 0) {
                        try {
                          const result = JSON.parse(fullTypingResult);
                          errors = result.errors || [];
                          remarks = result.remarks || remarks;
                        } catch (e) {
                          console.error("Error parsing typing result:", e);
                        }
                      }
                      
                      return (
                        <div key={idx} className={`p-3 rounded ${tr.isPassed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{tr.sectionName} ({tr.language})</span>
                            <span className={tr.isPassed ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                              {tr.isPassed ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Speed: {tr.netSpeed} NWPM (Required: {tr.passingSpeed} NWPM)
                          </p>
                          {remarks && (
                            <p className="text-sm mb-2">
                              Remarks: <span className={`${remarks === 'Excellent' || remarks === 'Very Good' ? 'text-green-500' : remarks === 'Good' ? 'text-blue-500' : 'text-red-500'}`}>
                                {remarks}
                              </span>
                            </p>
                          )}
                          {errors && errors.length > 0 && (
                            <div className="mt-3 border border-gray-300 p-3 bg-gray-50 rounded">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-sm">
                                  Total Errors: <span>{errors.length} Typed [Record]</span>
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-2">
                                {errors.map((error, errorIndex) => {
                                  // Parse error format: "THGe [The]" -> typed: "THGe", correct: "The"
                                  const match = error.match(/^(.+?)\s*\[(.+?)\]$/);
                                  if (match) {
                                    const [, typedWord, correctWord] = match;
                                    return (
                                      <div key={errorIndex} className="text-sm leading-tight break-words">
                                        <span className="text-red-600 font-semibold">{typedWord}</span>
                                        {' '}
                                        <span className="text-gray-700">[</span>
                                        <span className="text-green-700 font-semibold">{correctWord}</span>
                                        <span className="text-gray-700">]</span>
                                        {errorIndex < errors.length - 1 && ','}
                                      </div>
                                    );
                                  } else {
                                    // Fallback for errors not in expected format
                                    return (
                                      <div key={errorIndex} className="text-sm leading-tight break-words">
                                        {error}
                                        {errorIndex < errors.length - 1 && ','}
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Criteria modal */}
      {showCriteriaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCriteriaModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-[#290c52]">Qualifying Criteria</h3>
              <button
                type="button"
                onClick={() => setShowCriteriaModal(false)}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
              {criteriaLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {examData?.key === "CPCT" && typingResults.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-3">
                <p className="font-semibold text-sm">Your section results:</p>
                {typingResults.map((tr, idx) => (
                  <p key={idx} className={`text-sm ${tr.isPassed ? "text-green-700" : "text-red-700"}`}>
                    {tr.language} Typing: {tr.netSpeed} NWPM — {tr.isPassed ? "Passed" : "Failed"} (min {tr.passingSpeed} NWPM)
                  </p>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowCriteriaModal(false)}
              className="mt-4 w-full bg-[#290c52] text-white py-2 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog - Show if section is specified (no answers shown for section results) */}
      {currentSection ? (
        <div className="px-4 mt-8 mb-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-gray-800 font-medium leading-relaxed mb-2 text-center">
                <strong>क्या आप वाकई इस सेक्शन को सबमिट करना चाहते हैं?</strong>
              </p>
              <p className="text-xs text-gray-600 mb-2 text-center">
                आगे बढ़ने के लिए 'Continue to Next Section' पर क्लिक करें; वापस जाने के लिए 'Go Back' पर क्लिक करें।
              </p>
              <p className="text-xs text-red-600 font-semibold text-center">
                प्रतिभागी, एक बार सेक्शन सबमिट करने के बाद, आप अपने उत्तरों में कोई संशोधन नहीं कर पाएंगे।
              </p>
              <p className="text-xs text-blue-600 font-semibold text-center mt-2">
                सही उत्तर केवल अंतिम परिणाम में दिखाए जाएंगे।
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  // Don't show answers, just continue to next section
                  // Find next section
                  const currentSectionIndex = sections.findIndex(s => s.name === currentSection);
                  if (currentSectionIndex < sections.length - 1) {
                    const nextSection = sections[currentSectionIndex + 1];
                    
                    // For RSCIT Section A, check eligibility before proceeding
                    const currentSectionStat = sectionStats.find(s => s.sectionName === currentSection);
                    const isRSCIT = examData?.key === 'RSCIT';
                    const isSectionA = currentSection === 'Section A';
                    const sectionScore = currentSectionStat?.score || 0;
                    const sectionAPassed = isRSCIT && isSectionA && sectionScore >= 12;
                    
                    if (isRSCIT && isSectionA && !sectionAPassed) {
                      alert(`You need minimum 12 marks in Section A to proceed to Section B. Your Section A score: ${sectionScore} marks.`);
                      return;
                    }
                    
                    // For RSCIT, check if Section B is accessible
                    if (isRSCIT && nextSection.name === 'Section B' && !sectionAPassed) {
                      alert(`You need minimum 12 marks in Section A to proceed to Section B. Your Section A score: ${sectionScore} marks.`);
                      return;
                    }
                    
                    // Check if next section is a typing section
                    const isTypingSection = nextSection.name === "English Typing" || 
                                           nextSection.name === "हिंदी टाइपिंग" ||
                                           nextSection.name.includes("Typing") || 
                                           nextSection.name.includes("typing");
                    
                    // Check if we're moving from 5th section to typing (6th section) - 10 min break
                    const isAfterFiveSections = currentSectionIndex === 4; // 0-indexed, so 4 = 5th section
                    const breakDuration = (isTypingSection && isAfterFiveSections) ? 10 : 1;
                    
                    if (isTypingSection && !isAfterFiveSections) {
                      // Typing section but not after 5 sections, go directly
                      router.push(`/exam_mode?section=${encodeURIComponent(nextSection.name)}`);
                    } else {
                      // Go to break page (1 min for MCQ sections, 10 min for typing after 5 sections)
                      router.push(`/exam/break?next=/exam_mode&section=${encodeURIComponent(nextSection.name)}&duration=${breakDuration}`);
                    }
                  } else {
                    // Last section completed, show final results (with answers)
                    router.push('/exam/exam-result');
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Continue to Next Section
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Questions Review Section - Show only in final result (no section parameter) */}
      {sectionStats.length > 0 && !currentSection && (
        <div className="px-4 mt-8 mb-4">
          <div className="bg-[#290c52] text-white p-3 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold">Questions Review</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="bg-white text-[#290c52] px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100"
              >
                {showAnswers ? '🔒 Hide Answers' : '🔓 Show Answers'}
              </button>
              <span className="text-sm">View in:</span>
              <select 
                className="text-black text-xs bg-white px-2 py-1 rounded"
                value={viewLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setViewLanguage(newLang);
                  localStorage.setItem('viewLanguage', newLang);
                }}
              >
                <option value="हिन्दी">हिन्दी</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-b-lg overflow-hidden">
            {sections
              .filter(sec => !currentSection || sec.name === currentSection)
              .map((sec, sectionIndex) => {
                const sectionQuestions = questions[sec.name] || [];
                if (sectionQuestions.length === 0) return null;
                
                const sectionStat = sectionStats.find(s => s.sectionName === sec.name);
                if (!sectionStat || sectionStat.yetToAttempt) return null;
              
              return (
                <div key={sec._id || sectionIndex} className="border-b border-gray-200 last:border-b-0">
                  <div className="bg-blue-50 p-3 border-b border-gray-300">
                    <h3 className="text-base md:text-lg font-semibold text-[#290c52]">
                      {sec.name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Total Questions: {sectionStat.totalQuestions} | 
                      Correct: <span className="text-green-600 font-semibold">{sectionStat.correct}</span> | 
                      Incorrect: <span className="text-red-600 font-semibold">{sectionStat.incorrect}</span>
                    </p>
                  </div>
                  
                  <div className="p-4 space-y-6">
                    {sectionQuestions.map((q, qIndex) => {
                      const userAnswer = selectedAnswers[q._id];
                      const correctAnswer = q.correctAnswer;
                      const isCorrect = userAnswer !== undefined && userAnswer !== null && userAnswer === correctAnswer;
                      const isAnswered = userAnswer !== undefined && userAnswer !== null;
                      const options = (viewLanguage === "हिन्दी" && q.options_hi && q.options_hi.length > 0)
                        ? q.options_hi 
                        : (q.options_en || q.options_hi || []);
                      const questionText = (viewLanguage === "हिन्दी" && q.question_hi)
                        ? q.question_hi
                        : (q.question_en || q.question_hi || 'No question text available');
                      
                      return (
                        <div 
                          key={q._id || qIndex}
                          className={`border-2 rounded-lg p-4 ${
                            showAnswers && isCorrect 
                              ? 'border-green-500 bg-green-50' 
                              : isAnswered 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-[#290c52] text-white px-3 py-1 rounded-full text-sm font-bold">
                                  Q{qIndex + 1}
                                </span>
                                {showAnswers && isCorrect && (
                                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                    ✓ Correct
                                  </span>
                                )}
                                {showAnswers && isAnswered && !isCorrect && (
                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                    ✗ Incorrect
                                  </span>
                                )}
                                {!showAnswers && isAnswered && (
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                    Answered
                                  </span>
                                )}
                                {!isAnswered && (
                                  <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                    Not Answered
                                  </span>
                                )}
                              </div>
                              
                              {/* Question Image */}
                              {q.imageUrl && String(q.imageUrl).trim() !== '' && (
                                <div className="mb-3 w-full overflow-hidden" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                                  <img 
                                    src={encodeURI(String(q.imageUrl).trim())} 
                                    alt="Question" 
                                    className="w-full max-w-full rounded border shadow-md"
                                    style={{
                                      display: 'block',
                                      maxWidth: '100%',
                                      width: q.imageWidth ? `${Math.min(q.imageWidth, 800)}px` : '100%',
                                      height: 'auto',
                                      maxHeight: q.imageHeight ? `${Math.min(q.imageHeight, 600)}px` : '70vh',
                                      objectFit: 'contain',
                                      margin: '0'
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* Question Text */}
                              <p className="text-sm md:text-base font-medium text-gray-800 mb-4">
                                {questionText}
                              </p>
                            </div>
                          </div>
                          
                          {/* Options */}
                          <div className="space-y-2">
                            {options.map((opt, optIndex) => {
                              const isUserAnswer = isAnswered && userAnswer === optIndex;
                              const isCorrectOption = correctAnswer === optIndex;
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded border-2 flex items-start gap-3 ${
                                    isUserAnswer && isCorrectOption
                                      ? 'bg-blue-100 border-blue-500'
                                      : showAnswers && isCorrectOption
                                      ? 'bg-green-100 border-green-500'
                                      : isUserAnswer
                                      ? 'bg-red-100 border-red-400'
                                      : 'bg-white border-gray-300'
                                  }`}
                                >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${
                                    isUserAnswer && isCorrectOption
                                      ? 'bg-blue-600 text-white'
                                      : showAnswers && isCorrectOption
                                      ? 'bg-green-600 text-white'
                                      : isUserAnswer
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <div className="flex-1">
                                    <span className={`text-sm md:text-base ${
                                      (showAnswers && isCorrectOption) || isUserAnswer
                                        ? 'font-semibold'
                                        : 'font-normal'
                                    }`}>
                                      {opt}
                                    </span>
                                    <div className="flex gap-2 mt-1">
                                      {showAnswers && isCorrectOption && (
                                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-semibold">
                                          Correct Answer
                                        </span>
                                      )}
                                      {isUserAnswer && !isCorrectOption && (
                                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-semibold">
                                          Your Answer
                                        </span>
                                      )}
                                      {isUserAnswer && isCorrectOption && (
                                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">
                                          Your Answer {showAnswers ? '(Correct)' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Explanation */}
                          {(() => {
                            const explanationText = (viewLanguage === "हिन्दी" && q.explanation_hi && q.explanation_hi.trim() !== '')
                              ? q.explanation_hi
                              : (q.explanation_en && q.explanation_en.trim() !== '')
                              ? q.explanation_en
                              : null;
                            
                            return explanationText ? (
                              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-gray-800">
                                    {viewLanguage === "हिन्दी" ? "व्याख्या:" : "Explanation:"}
                                  </span>
                                </div>
                                <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                                  {explanationText}
                                </p>
                              </div>
                            ) : null;
                          })()}
                          
                          {/* Solution Video Link */}
                          {q.solutionVideoLink && q.solutionVideoLink.trim() !== '' && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-semibold text-blue-800">Solution Video:</span>
                              </div>
                              <a
                                href={q.solutionVideoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                              >
                                {q.solutionVideoLink}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Button - Show for section-specific view */}
      {currentSection ? (
        <div className="text-center text-sm p-4 mt-4">
          {(() => {
            // For RSCIT Section A, check if user passed (score >= 12)
            const currentSectionStat = sectionStats.find(s => s.sectionName === currentSection);
            const isRSCIT = examData?.key === 'RSCIT';
            const isSectionA = currentSection === 'Section A';
            const sectionScore = currentSectionStat?.score || 0;
            const sectionAPassed = isRSCIT && isSectionA && sectionScore >= 12;
            const sectionAFailed = isRSCIT && isSectionA && sectionScore < 12;
            
            return (
              <div className="space-y-4">
                {/* Show pass/fail message for RSCIT Section A */}
                {isRSCIT && isSectionA && (
                  <div className={`p-4 rounded-lg mb-4 ${sectionAPassed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                    <p className={`text-xl font-bold ${sectionAPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {sectionAPassed 
                        ? '✅ Congratulations! You have passed Section A. You are now eligible for Section B.' 
                        : `❌ You need minimum 12 marks to pass Section A. Your score: ${sectionScore} marks. You cannot proceed to Section B.`}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center gap-4">
                  {sectionAFailed ? (
                    <button
                      onClick={() => router.push('/exam')}
                      className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Back to Exams
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // For RSCIT Section A, check eligibility before proceeding
                        if (isRSCIT && isSectionA && !sectionAPassed) {
                          alert(`You need minimum 12 marks in Section A to proceed to Section B. Your Section A score: ${sectionScore} marks.`);
                          return;
                        }
                        
                        // Find next section
                        const currentSectionIndex = sections.findIndex(s => s.name === currentSection);
                        if (currentSectionIndex < sections.length - 1) {
                          const nextSection = sections[currentSectionIndex + 1];
                          
                          // For RSCIT, check if Section B is accessible
                          if (isRSCIT && nextSection.name === 'Section B' && !sectionAPassed) {
                            alert(`You need minimum 12 marks in Section A to proceed to Section B. Your Section A score: ${sectionScore} marks.`);
                            return;
                          }
                          
                          // Check if next section is a typing section
                          const isTypingSection = nextSection.name === "English Typing" || 
                                                 nextSection.name === "हिंदी टाइपिंग" ||
                                                 nextSection.name.includes("Typing") || 
                                                 nextSection.name.includes("typing");
                          
                          // Check if we're moving from 5th section to typing (6th section) - 10 min break
                          const isAfterFiveSections = currentSectionIndex === 4; // 0-indexed, so 4 = 5th section
                          const breakDuration = (isTypingSection && isAfterFiveSections) ? 10 : 1;
                          
                          if (isTypingSection && !isAfterFiveSections) {
                            // Typing section but not after 5 sections, go directly
                            router.push(`/exam_mode?section=${encodeURIComponent(nextSection.name)}`);
                          } else {
                            // Go to break page (1 min for MCQ sections, 10 min for typing after 5 sections)
                            router.push(`/exam/break?next=/exam_mode&section=${encodeURIComponent(nextSection.name)}&duration=${breakDuration}`);
                          }
                        } else {
                          // Last section completed, show final results
                          router.push('/exam/exam-result');
                        }
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Continue to Next Section
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="text-center text-sm p-4 mt-4">
          <p className="text-gray-800 font-medium leading-relaxed">
            क्या आप वाकई इस सेक्शन को सबमिट करना चाहते हैं? आगे बढ़ने के लिए
            <span className="font-bold"> 'Yes'</span> पर क्लिक करें, वापस जाने के लिए
            <span className="font-bold"> 'No'</span> पर क्लिक करें। <br />
            प्रतिभागी, एक बार सेक्शन सबमिट करने के बाद, आप अपने उत्तरों में कोई संशोधन नहीं कर पाएंगे।
          </p>

          <div className="mt-4 flex justify-center gap-4">
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Yes'}
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded">
              <a href="/exam_mode">No</a>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamSummary() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
      </div>
    }>
      <ExamResultContent />
    </Suspense>
  );
}
