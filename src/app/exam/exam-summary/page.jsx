"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExamSummary() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [allSections, setAllSections] = useState([]);
  const [sectionStats, setSectionStats] = useState([]);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
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
          console.error('No exam ID found');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/exam-questions?examId=${examId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setAllSections(data.data.sections || []);
            
            // Get completed sections
            const savedCompletedSections = localStorage.getItem('completedSections');
            if (savedCompletedSections) {
              try {
                setCompletedSections(new Set(JSON.parse(savedCompletedSections)));
              } catch (e) {
                console.error('Error loading completed sections:', e);
              }
            }

            // Load answers and calculate stats for each section
            const savedAnswersStr = localStorage.getItem('examAnswers');
            const savedAnswers = savedAnswersStr ? JSON.parse(savedAnswersStr) : {};
            
            const visitedStr = localStorage.getItem('visitedQuestions');
            const visitedQuestions = visitedStr ? new Set(JSON.parse(visitedStr)) : new Set();
            
            const markedStr = localStorage.getItem('markedForReview');
            const markedForReview = markedStr ? new Set(JSON.parse(markedStr)) : new Set();

            // Calculate stats for each section
            const stats = data.data.sections.map(sec => {
              const sectionQuestions = data.data.allQuestions.filter(q => {
                const qSectionId = String(q.sectionId).trim();
                const secIdStr = String(sec.id).trim();
                const secIdObj = String(sec._id).trim();
                return (qSectionId === secIdObj || qSectionId === secIdStr || 
                        qSectionId === sec._id.toString() || qSectionId === sec.id);
              });

              let answered = 0;
              let notAnswered = 0;
              let notVisited = 0;
              let marked = 0;
              let answeredAndMarked = 0;

              sectionQuestions.forEach(q => {
                const isAnswered = savedAnswers[q._id] !== undefined && savedAnswers[q._id] !== null;
                const isVisited = visitedQuestions.has(q._id);
                const isMarked = markedForReview.has(q._id);

                if (isAnswered) {
                  answered++;
                  if (isMarked) {
                    answeredAndMarked++;
                  }
                } else {
                  notAnswered++;
                }

                if (!isVisited) {
                  notVisited++;
                }

                if (isMarked && !isAnswered) {
                  marked++;
                }
              });

              return {
                sectionName: sec.name,
                totalQuestions: sectionQuestions.length,
                answered,
                notAnswered,
                markedForReview: marked,
                answeredAndMarked,
                notVisited
              };
            });

            setSectionStats(stats);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#290c52] text-white px-4 py-3">
        <h1 className="text-xl font-bold">CPCTMASTER 2025</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* User Info */}
        <div className="text-center mb-6">
          <img src="/lo.jpg" alt="User" className="w-20 h-20 rounded-full mx-auto mb-2" />
          <p className="text-xl font-semibold">{userName}</p>
          <p className="text-lg font-semibold text-[#290c52] mt-2">Exam Summary</p>
        </div>

        {/* Section Summary Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#290c52] text-white">
                <th className="border p-3 text-left">Section Name</th>
                <th className="border p-3">No. of Questions</th>
                <th className="border p-3">Answered</th>
                <th className="border p-3">Not Answered</th>
                <th className="border p-3">Marked for Review</th>
                <th className="border p-3">Answered & Marked for Review (will not be considered for evaluation)</th>
                <th className="border p-3">Not Visited</th>
              </tr>
            </thead>
            <tbody>
              {sectionStats.map((stat, index) => (
                <tr key={index} className={completedSections.has(stat.sectionName) ? "bg-blue-50" : ""}>
                  <td className="border p-3 font-semibold">{stat.sectionName}</td>
                  <td className="border p-3 text-center">{stat.totalQuestions}</td>
                  <td className="border p-3 text-center text-green-600 font-semibold">{stat.answered}</td>
                  <td className="border p-3 text-center text-orange-600 font-semibold">{stat.notAnswered}</td>
                  <td className="border p-3 text-center text-purple-600 font-semibold">{stat.markedForReview}</td>
                  <td className="border p-3 text-center text-indigo-600 font-semibold">{stat.answeredAndMarked}</td>
                  <td className="border p-3 text-center text-gray-600 font-semibold">{stat.notVisited}</td>
                </tr>
              ))}
              
              {/* Typing Sections */}
              <tr>
                <td className="border p-3">English Typing</td>
                <td className="border p-3 text-center" colSpan={6}>
                  <span className="text-gray-500">(Yet to attempt)</span>
                </td>
              </tr>
              <tr>
                <td className="border p-3">हिंदी टाइपिंग</td>
                <td className="border p-3 text-center" colSpan={6}>
                  <span className="text-gray-500">(Yet to attempt)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/exam_mode')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded font-semibold"
          >
            Back to Exam
          </button>
          <button
            onClick={() => router.push('/exam/exam-result')}
            className="bg-[#290c52] hover:bg-blue-700 text-white px-8 py-3 rounded font-semibold"
          >
            View Final Results
          </button>
        </div>
      </div>
    </div>
  );
}

