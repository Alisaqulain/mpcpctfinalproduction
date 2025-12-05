"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SectionSummaryContent() {
  const [section, setSection] = useState("");
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sectionName = searchParams.get("section");
    if (sectionName) {
      setSection(sectionName);
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
    const loadExamData = async () => {
      try {
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
            setSections(data.data.sections || []);
            
            // Organize questions by section
            const questionsBySection = {};
            data.data.sections.forEach(sec => {
              const sectionQuestions = data.data.allQuestions.filter(q => {
                const qSectionId = String(q.sectionId).trim();
                const secIdStr = String(sec.id).trim();
                const secIdObj = String(sec._id).trim();
                return qSectionId === secIdObj || qSectionId === secIdStr || qSectionId === sec._id.toString();
              });
              questionsBySection[sec.name] = sectionQuestions;
            });
            setQuestions(questionsBySection);
          }
        }
      } catch (error) {
        console.error('Error loading exam data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExamData();

    // Load answers and status
    const savedAnswersStr = localStorage.getItem('examAnswers');
    if (savedAnswersStr) {
      try {
        setSelectedAnswers(JSON.parse(savedAnswersStr));
      } catch (error) {
        console.error('Error parsing answers:', error);
      }
    }

    const visitedStr = localStorage.getItem('visitedQuestions');
    if (visitedStr) {
      try {
        setVisitedQuestions(new Set(JSON.parse(visitedStr)));
      } catch (error) {
        console.error('Error loading visited questions:', error);
      }
    }

    const markedStr = localStorage.getItem('markedForReview');
    if (markedStr) {
      try {
        setMarkedForReview(new Set(JSON.parse(markedStr)));
      } catch (error) {
        console.error('Error loading marked questions:', error);
      }
    }
  }, [searchParams]);

  // Calculate statistics for a section
  const calculateSectionStats = (sectionName) => {
    const sectionQuestions = questions[sectionName] || [];
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let notVisited = 0;

    sectionQuestions.forEach(q => {
      const isAnswered = selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] !== null;
      const isVisited = visitedQuestions.has(q._id);
      const isMarked = markedForReview.has(q._id);

      if (isAnswered) {
        answered++;
      } else {
        notAnswered++;
      }

      if (!isVisited) {
        notVisited++;
      }

      if (isMarked && isAnswered) {
        answeredAndMarked++;
      } else if (isMarked) {
        marked++;
      }
    });

    return {
      total: sectionQuestions.length,
      answered,
      notAnswered,
      marked,
      answeredAndMarked,
      notVisited
    };
  };

  const handleContinue = () => {
    // Find next section
    const currentSectionIndex = sections.findIndex(s => s.name === section);
    if (currentSectionIndex < sections.length - 1) {
      const nextSection = sections[currentSectionIndex + 1];
      // Redirect to break page, which will then redirect to next section
      router.push(`/exam/break?next=/exam_mode&section=${encodeURIComponent(nextSection.name)}`);
    } else {
      // Last section, go to exam result page
      router.push('/exam/exam-result');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
      </div>
    );
  }

  const stats = section ? calculateSectionStats(section) : { total: 0, answered: 0, notAnswered: 0, marked: 0, answeredAndMarked: 0, notVisited: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#290c52] text-white px-4 py-3">
        <h1 className="text-xl font-bold">MPCPCT 2025 - Section Summary</h1>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Section: {section || "N/A"}</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Section Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">No. of Questions</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Answered</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Not Answered</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Marked for Review</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Answered & Marked for Review</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Not Visited</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">{section || "N/A"}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{stats.total}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-green-600 font-semibold">{stats.answered}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-red-600 font-semibold">{stats.notAnswered}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-purple-600 font-semibold">{stats.marked}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-blue-600 font-semibold">{stats.answeredAndMarked}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-gray-600 font-semibold">{stats.notVisited}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-gray-700 mb-2">
              <strong>क्या आप वाकई इस सेक्शन को सबमिट करना चाहते हैं?</strong>
            </p>
            <p className="text-xs text-gray-600 mb-2">
              आगे बढ़ने के लिए 'Continue' पर क्लिक करें; वापस जाने के लिए 'Go Back' पर क्लिक करें।
            </p>
            <p className="text-xs text-red-600 font-semibold">
              प्रतिभागी, एक बार सेक्शन सबमिट करने के बाद, आप अपने उत्तरों में कोई संशोधन नहीं कर पाएंगे।
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go Back
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Continue to Break
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SectionSummary() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
      </div>
    }>
      <SectionSummaryContent />
    </Suspense>
  );
}

