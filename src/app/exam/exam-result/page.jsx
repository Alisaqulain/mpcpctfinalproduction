"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSection = searchParams?.get("section") || null;

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true);
        
        // Check if all sections are completed
        const savedCompletedSections = localStorage.getItem('completedSections');
        const examId = localStorage.getItem('currentExamId');
        
        if (!examId) {
          console.error('No exam ID found');
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
        const res = await fetch(`/api/exam-questions?examId=${examId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setExamData(data.data.exam);
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
                score: correct,
                yetToAttempt: false
              });
            });
            setSectionStats(stats);
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
      const totalScore = totalCorrect;
      const totalQuestions = sectionStats.reduce((sum, stat) => sum + stat.totalQuestions, 0);
      const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
      
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
        percentage: percentage,
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
        
        // Redirect to break page or show success
        window.location.href = "/exam/break";
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

  return (
    <div className="min-h-screen bg-white text-sm">
      {/* Header */}
      <div className="bg-[#290c52] text-yellow-400 p-2 text-lg font-bold">
        MPCPCT 2025
      </div>

      {/* Title */}
      <div className="text-center font-semibold py-4 text-gray-800 text-base border-b border-gray-300">
        <img
          src="/lo.jpg"
          alt="avatar"
          className="w-20 h-20 rounded-full mx-auto"
        />
        <p className="mt-2">{userName}</p>
      </div>

      <h1 className="text-center text-2xl font-semibold my-5">
        {currentSection ? `Section Summary: ${currentSection}` : 'Exam Summary'}
      </h1>
      
      {/* Download PDF Button - Only show for full exam summary */}
      {!currentSection && (
        <div className="text-center mb-4">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Download PDF
          </button>
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
      </div>

      {/* Confirmation Message - Show different messages based on context */}
      {currentSection ? (
        <div className="text-center text-sm p-4 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <p className="text-gray-800 font-medium leading-relaxed mb-2">
              <strong>क्या आप वाकई इस सेक्शन को सबमिट करना चाहते हैं?</strong>
            </p>
            <p className="text-xs text-gray-600 mb-2">
              आगे बढ़ने के लिए 'Continue to Break' पर क्लिक करें; वापस जाने के लिए 'Go Back' पर क्लिक करें।
            </p>
            <p className="text-xs text-red-600 font-semibold">
              प्रतिभागी, एक बार सेक्शन सबमिट करने के बाद, आप अपने उत्तरों में कोई संशोधन नहीं कर पाएंगे।
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
                // Find next section
                const currentSectionIndex = sections.findIndex(s => s.name === currentSection);
                if (currentSectionIndex < sections.length - 1) {
                  const nextSection = sections[currentSectionIndex + 1];
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
          </div>
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
