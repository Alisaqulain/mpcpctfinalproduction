"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

function TopicWiseMCQPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topicId, setTopicId] = useState(null);
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [language, setLanguage] = useState("en");
  const [viewLanguage, setViewLanguage] = useState("English");
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [timerStarted, setTimerStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [userName, setUserName] = useState("User");
  const [userProfileUrl, setUserProfileUrl] = useState("/lo.jpg");
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [modalLanguage, setModalLanguage] = useState("हिन्दी");
  const audioRef = React.useRef(null);

  useEffect(() => {
    const topicIdFromUrl = searchParams.get("topicId");
    if (topicIdFromUrl) {
      setTopicId(topicIdFromUrl);
      fetchQuestions(topicIdFromUrl);
    } else {
      setError("No topic ID provided");
      setLoading(false);
    }
  }, [searchParams]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setUserName(data.user.name);
          }
          if (data.user?.profileUrl) {
            setUserProfileUrl(data.user.profileUrl);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
      
      // Fallback to localStorage
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
    };
    
    loadUserData();
  }, []);

  // Load view language preference
  useEffect(() => {
    const savedViewLang = localStorage.getItem('viewLanguage');
    if (savedViewLang) {
      setViewLanguage(savedViewLang);
    }
  }, []);

  // Initialize timer from localStorage or start fresh
  useEffect(() => {
    if (topicId && questions.length > 0 && !timerStarted) {
      const savedTime = localStorage.getItem(`topicwise-timer-${topicId}`);
      if (savedTime) {
        const savedTimeInt = parseInt(savedTime, 10);
        if (savedTimeInt > 0) {
          setTimeLeft(savedTimeInt);
        }
      }
      setTimerStarted(true);
    }
  }, [topicId, questions, timerStarted]);

  // Timer countdown
  useEffect(() => {
    if (!timerStarted || showResults || !topicId || questions.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem(`topicwise-timer-${topicId}`, newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerStarted, showResults, topicId, questions.length]);

  // Load tick sound after user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      audioRef.current = new Audio("/tick.wav");
      audioRef.current.volume = 0.2;
      document.removeEventListener("click", handleFirstClick);
    };
    document.addEventListener("click", handleFirstClick);
    return () => document.removeEventListener("click", handleFirstClick);
  }, []);

  // Play sound each second
  useEffect(() => {
    if (isSoundOn && audioRef.current && timeLeft > 0 && timerStarted) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Sound error:", err);
      });
    }
  }, [timeLeft, isSoundOn, timerStarted]);

  // Stop sound immediately when muted
  useEffect(() => {
    if (!isSoundOn && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isSoundOn]);

  const fetchQuestions = async (topicIdParam) => {
    setQuestionsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/topicwise/questions?topicId=${topicIdParam}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          if (data.questions.length < 100) {
            setError(`Only ${data.questions.length} questions found. This exam requires 100 questions. Please contact administrator.`);
            return;
          }
          const questionsToDisplay = data.questions.slice(0, 100);
          setQuestions(questionsToDisplay);
          
          if (data.topic) {
            setTopic(data.topic);
          }
          
          // Load saved answers
          const savedAnswers = localStorage.getItem(`topicwise-answers-${topicIdParam}`);
          if (savedAnswers) {
            try {
              setSelectedAnswers(JSON.parse(savedAnswers));
            } catch (e) {
              console.error("Error loading saved answers:", e);
            }
          }

          // Load visited questions
          const visitedStr = localStorage.getItem(`topicwise-visited-${topicIdParam}`);
          if (visitedStr) {
            try {
              setVisitedQuestions(new Set(JSON.parse(visitedStr)));
            } catch (e) {
              console.error("Error loading visited questions:", e);
            }
          }

          // Load marked for review
          const markedStr = localStorage.getItem(`topicwise-marked-${topicIdParam}`);
          if (markedStr) {
            try {
              setMarkedForReview(new Set(JSON.parse(markedStr)));
            } catch (e) {
              console.error("Error loading marked questions:", e);
            }
          }
        } else {
          setError("No questions found for this topic");
        }
      } else if (res.status === 401) {
        setError("Please login to access questions");
      } else if (res.status === 403) {
        setError("Active subscription required to access this topic");
      } else {
        setError("Failed to load questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions");
    } finally {
      setQuestionsLoading(false);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    const newAnswers = {
      ...selectedAnswers,
      [questionId]: answerIndex,
    };
    setSelectedAnswers(newAnswers);
    if (topicId) {
      localStorage.setItem(`topicwise-answers-${topicId}`, JSON.stringify(newAnswers));
    }
    
    // Mark as visited
    setVisitedQuestions((prev) => {
      const newSet = new Set([...prev, questionId]);
      if (topicId) {
        localStorage.setItem(`topicwise-visited-${topicId}`, JSON.stringify([...newSet]));
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    setShowResults(true);
    if (topicId) {
      localStorage.removeItem(`topicwise-timer-${topicId}`);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    let total = questions.length;
    let totalMarks = 0;
    let obtainedMarks = 0;
    
    questions.forEach((q) => {
      const marks = q.marks || 1;
      totalMarks += marks;
      const userAnswer = selectedAnswers[q._id || q.id];
      if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
        correct++;
        obtainedMarks += marks;
      }
    });

    return { 
      correct, 
      total, 
      score: obtainedMarks, 
      totalMarks,
      percentage: totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0 
    };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeShort = (seconds) => {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    if (questions[index]) {
      const qId = questions[index]._id || questions[index].id;
      setVisitedQuestions((prev) => {
        const newSet = new Set([...prev, qId]);
        if (topicId) {
          localStorage.setItem(`topicwise-visited-${topicId}`, JSON.stringify([...newSet]));
        }
        return newSet;
      });
    }
  };

  const toggleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      if (topicId) {
        localStorage.setItem(`topicwise-marked-${topicId}`, JSON.stringify([...newSet]));
      }
      return newSet;
    });
  };

  const handleDownloadPDF = () => {
    const { correct, total, score, totalMarks, percentage } = calculateScore();
    const passingMarks = Math.ceil(totalMarks * 0.5); // 50% of total marks
    const isPassed = score >= passingMarks;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Header
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('MPCPCT 2025', pageWidth / 2, 15, { align: 'center' });
    
    // User Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    let yPos = 40;
    pdf.text(`Name: ${userName}`, 10, yPos);
    yPos += 10;
    if (topic) {
      pdf.text(`Topic: ${topic.topicName}`, 10, yPos);
      yPos += 10;
    }
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 10, yPos);
    yPos += 15;
    
    // Result Summary
    pdf.setFontSize(16);
    pdf.text('Exam Result', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    pdf.setFontSize(12);
    pdf.text(`Score: ${score} / ${total}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    pdf.text(`Percentage: ${percentage.toFixed(2)}%`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    pdf.text(`Passing Marks: ${passingMarks}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    if (isPassed) {
      pdf.setTextColor(0, 128, 0);
    } else {
      pdf.setTextColor(255, 0, 0);
    }
    pdf.setFontSize(14);
    pdf.text(isPassed ? 'PASSED' : 'FAILED', pageWidth / 2, yPos, { align: 'center' });
    
    // Save PDF
    pdf.save(`topicwise-result-${userName}-${Date.now()}.pdf`);
  };

  if (loading || questionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 border border-red-300 rounded-lg bg-red-50">
          <p className="text-red-700 text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push("/exam")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Go Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const { correct, total, score, totalMarks, percentage } = calculateScore();
    const passingMarks = Math.ceil(totalMarks * 0.5); // 50% of total marks
    const isPassed = score >= passingMarks;

    // Calculate section stats similar to exam-result
    const sectionStats = [{
      sectionName: topic?.topicName || "Topic Wise MCQ",
      totalQuestions: total,
      answered: Object.keys(selectedAnswers).length,
      notAnswered: total - Object.keys(selectedAnswers).length,
      markedForReview: markedForReview.size,
      answeredAndMarked: Array.from(markedForReview).filter(qId => selectedAnswers[qId] !== undefined).length,
      notVisited: total - visitedQuestions.size,
      correct: correct,
      score: score
    }];

    return (
      <div className="min-h-screen bg-white text-sm">
        {/* Header */}
        <div className="bg-[#290c52] text-yellow-400 p-2 text-lg font-bold">
          MPCPCT 2025
        </div>

        {/* Title */}
        <div className="text-center font-semibold py-4 text-gray-800 text-base border-b border-gray-300">
          <img
            src={userProfileUrl}
            alt="avatar"
            className="w-20 h-20 rounded-full mx-auto"
            onError={(e) => {
              e.target.src = "/lo.jpg";
            }}
          />
          <p className="mt-2">{userName}</p>
        </div>

        <h1 className="text-center text-2xl font-semibold my-5">
          Exam Summary
        </h1>
        
        {/* Download PDF Button */}
        <div className="text-center mb-4">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Download PDF
          </button>
        </div>

        {/* Summary Table */}
        <div className="px-4">
          <p className="font-semibold mb-2 text-gray-800">
            {topic?.topicName || 'Topic Wise MCQ'}
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
                {sectionStats.map((stat, idx) => (
                  <tr key={idx}>
                    <td className="border p-2 text-left">{stat.sectionName}</td>
                    <td className="border p-2">{stat.totalQuestions}</td>
                    <td className="border p-2">{stat.answered}</td>
                    <td className="border p-2">{stat.notAnswered}</td>
                    <td className="border p-2">{stat.markedForReview}</td>
                    <td className="border p-2">{stat.answeredAndMarked}</td>
                    <td className="border p-2">{stat.notVisited}</td>
                    <td className="border p-2 text-green-600 font-semibold">{stat.correct}</td>
                    <td className="border p-2 font-semibold">{stat.score}</td>
                  </tr>
                ))}
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
                <tr className={`font-bold ${isPassed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                  <td colSpan="8" className="border p-2 text-left">
                    <span className="font-semibold">Passing Marks: {passingMarks}</span>
                  </td>
                  <td className={`border p-2 font-bold text-2xl ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                    {isPassed ? '✅ PASSED' : '❌ FAILED'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Pass/Fail Display */}
          <div className="mt-6">
            <div className={`p-6 rounded-lg mb-6 ${isPassed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="text-center">
                <p className="text-2xl font-bold mb-2">
                  Score: {score} / {total}
                </p>
                <p className="text-xl mb-2">
                  Percentage: {percentage.toFixed(2)}%
                </p>
                <p className="text-lg font-semibold mb-2">
                  Passing Marks: {passingMarks}
                </p>
                <p className={`text-3xl font-bold mt-4 ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                  {isPassed ? "✅ PASSED" : "❌ FAILED"}
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isPassed ? 'bg-green-50 border-green-300 border-2' : 'bg-red-50 border-red-300 border-2'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Passing Marks</p>
                      <p className="text-2xl font-bold">{passingMarks}</p>
                    </div>
                    <div className="text-4xl">
                      {isPassed ? '✅' : '❌'}
                    </div>
                  </div>
                  <p className={`text-lg font-semibold mt-2 ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 border-blue-300 border-2">
                  <div>
                    <p className="text-sm text-gray-600">Your Score</p>
                    <p className="text-2xl font-bold">
                      {score} / {total}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {score >= passingMarks 
                      ? 'You have passed!' 
                      : `You need ${passingMarks - score} more marks to pass.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review Section */}
        <div className="px-4 mt-8 mb-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Question Review</h3>
            <div className="space-y-4">
              {questions.map((q, index) => {
                const qId = q._id || q.id;
                const userAnswer = selectedAnswers[qId];
                const isCorrect = userAnswer === q.correctAnswer;
                const isAnswered = userAnswer !== undefined;

                return (
                  <div
                    key={qId}
                    className={`p-4 border-2 rounded-lg ${
                      isCorrect
                        ? "border-green-500 bg-green-50"
                        : isAnswered
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold">Q{index + 1}</span>
                      {isCorrect && <span className="text-green-700 font-semibold">✓ Correct</span>}
                      {isAnswered && !isCorrect && <span className="text-red-700 font-semibold">✗ Incorrect</span>}
                      {!isAnswered && <span className="text-gray-500 font-semibold">Not Answered</span>}
                    </div>
                    <p className="font-medium mb-2">
                      {viewLanguage === "English" ? q.question_en : q.question_hi}
                    </p>
                    <div className="space-y-1">
                      {(viewLanguage === "English" ? q.options_en : q.options_hi).map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded ${
                            optIdx === q.correctAnswer
                              ? "bg-green-200 font-semibold"
                              : optIdx === userAnswer && optIdx !== q.correctAnswer
                              ? "bg-red-200"
                              : "bg-gray-100"
                          }`}
                        >
                          {optIdx === q.correctAnswer && "✓ "}
                          {optIdx === userAnswer && optIdx !== q.correctAnswer && "✗ "}
                          {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation_en && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-sm">
                          <strong>Explanation:</strong> {viewLanguage === "English" ? q.explanation_en : q.explanation_hi}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4 justify-center mb-8">
          <button
            onClick={() => router.push("/exam")}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No questions available</p>
      </div>
    );
  }

  const qId = currentQuestion._id || currentQuestion.id;
  const isMarked = markedForReview.has(qId);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Sidebar - Question Palette */}
      <div className="w-64 bg-white border-r border-gray-300 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-300 bg-gray-50">
          <h3 className="font-semibold text-sm mb-2">Questions ({questions.length})</h3>
          {topic && (
            <p className="text-xs text-gray-600 mb-2">{topic.topicName}</p>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const qId = q._id || q.id;
                    const isAnswered = selectedAnswers[qId] !== undefined;
                    const isCurrent = idx === currentQuestionIndex;
                    const isMarkedQ = markedForReview.has(qId);
                    const isVisited = visitedQuestions.has(qId);

                    return (
                      <div
                        key={qId}
                        className={`w-8 h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${
                          isCurrent ? "bg-red-600 text-white" : isAnswered ? "bg-green-400" : isVisited ? "bg-red-500 text-white" : "bg-gray-300"
                        } ${isMarkedQ ? "ring-2 ring-purple-400" : ""}`}
                  onClick={() => goToQuestion(idx)}
                  title={`Q${idx + 1}${isMarkedQ ? " (Marked)" : ""}${isVisited ? " (Visited)" : ""}`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span>Current</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-300">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#290c52] hover:bg-cyan-700 text-white py-3 rounded text-sm font-semibold"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="fixed top-0 left-64 right-0 w-[calc(100%-16rem)] bg-[#290c52] text-white flex justify-between items-center px-4 py-2 text-sm z-30">
          <div className="font-semibold">MPCPCT 2025</div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 pr-4">
              <img 
                src={userProfileUrl} 
                className="w-8 h-8 rounded-full border" 
                alt={userName}
                onError={(e) => {
                  e.target.src = "/lo.jpg";
                }}
              />
            </div>
            <span 
              className="cursor-pointer underline hidden sm:inline text-[12px] p-2"
              onClick={() => setShowInstructionsModal(true)}
            >
              View Instructions
            </span>
            <span 
              className="cursor-pointer underline hidden sm:inline text-[12px]"
              onClick={() => setShowQuestionPaperModal(true)}
            >
              Question Paper
            </span>
          </div>
        </div>

        {/* Exam Title */}
        <div className="bg-white-50 border-b border-gray-300 px-4 py-4 mt-10">
          <h2 className="text-lg md:text-xl font-semibold text-[#290c52] text-center">
            {topic?.topicName || 'Topic Wise MCQ Exam'}
          </h2>
        </div>

        {/* Timer and Language Toggle */}
        <div className="border-b px-4 py-3 border-y-gray-200 bg-[#fff]">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setIsSoundOn(!isSoundOn)} title={isSoundOn ? "Mute" : "Unmute"}>
              {isSoundOn ? "🔊" : "🔇"}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-600">⏱️ Time Left:</span>
              <b className={`bg-blue-400 text-black px-3 py-1 rounded text-lg font-bold ${timeLeft < 600 ? "bg-red-400" : ""}`}>
                {formatTimeShort(timeLeft)}
              </b>
            </div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="flex-grow p-4 overflow-auto bg-white-50 mt-0">
          {/* Fixed Top Bar */}
          <div className="bg-[#290c52] text-white text-sm px-4 py-3 rounded-t flex justify-between flex-wrap gap-2 sticky top-0 z-10 mb-0">
            <span>Question Type: MCQ</span>
            <div className="flex items-center gap-2">
              <p>View in:</p>
              <select 
                className="text-black text-xs bg-white px-2 py-1 rounded"
                value={viewLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setViewLanguage(newLang);
                  localStorage.setItem('viewLanguage', newLang);
                }}
              >
                <option value="English">English</option>
                <option value="हिन्दी">हिन्दी</option>
              </select>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="border border-gray-300 rounded-b">
            <div className="bg-white-50 px-4 py-3 border-b text-sm font-semibold flex flex-col sm:flex-row justify-between">
              <span>Question No. {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="mt-1 sm:mt-0">
                Marks for correct answer: {currentQuestion?.marks || 1} | Negative Marks: <span className="text-red-500">{currentQuestion?.negativeMarks || 0}</span>
              </span>
            </div>

            <div className="p-4 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {isMarked && (
                    <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs mb-2 inline-block">
                      Marked for Review
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMarkForReview(qId)}
                    className={`px-3 py-1 rounded text-sm ${
                      isMarked
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {isMarked ? "Unmark" : "Mark for Review"}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-lg font-medium mb-4">
                  {viewLanguage === "English"
                    ? currentQuestion.question_en
                    : currentQuestion.question_hi}
                </p>

                {currentQuestion.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {(viewLanguage === "English"
                    ? currentQuestion.options_en
                    : currentQuestion.options_hi
                  ).map((option, optIdx) => {
                    const isSelected = selectedAnswers[qId] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${qId}`}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(qId, optIdx)}
                          className="mr-3 w-5 h-5"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    goToQuestion(
                      Math.min(questions.length - 1, currentQuestionIndex + 1)
                    )
                  }
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#290c52] text-white flex justify-between items-center px-6 py-4 rounded-t-lg">
              <h2 className="text-lg md:text-xl font-semibold">Instructions</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-sm">View in:</span>
                  <select
                    className="bg-white text-black px-2 py-1 rounded text-sm"
                    value={modalLanguage}
                    onChange={(e) => setModalLanguage(e.target.value)}
                  >
                    <option value="हिन्दी">हिन्दी</option>
                    <option value="English">English</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="text-white hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 mx-4 mt-4">
              <p className="text-sm font-semibold">
                {modalLanguage === "हिन्दी" 
                  ? "कृपया ध्यान दें: जब आप ये निर्देश पढ़ रहे हैं, तब भी टाइमर चलता रहेगा। इस विंडो को बंद करें ताकि परीक्षा जारी रख सकें।"
                  : "Important: The timer doesn't pause while you review the instructions. Close this page to get back to the questions."}
              </p>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-2 text-sm md:text-[13px] leading-relaxed">
                {modalLanguage === "हिन्दी" ? (
                  <>
                    <p className="text-center text-[20px]"> कृपया परीक्षा के निर्देशों को ध्यान से पढ़ें</p>
                    <p className="mt-5 text-[15px] font-semibold"> सामान्य निर्देश:</p>
                    <p className="mt-8"><span className="text-white bg-gray-500 border py-1 md:py-2 px-3 md:px-4">1</span>  आपने अभी तक यह प्रश्न नहीं देखा है।</p>
                    <p className="mt-8"><span className="text-white bg-orange-600 border py-1 md:py-2 px-3 md:px-4">2</span>  आपने इस प्रश्न के लिए कोई उत्तर नहीं चुना है।</p>
                    <p className="mt-8"><span className="text-white bg-green-500 border py-1 md:py-2 px-3 md:px-4">3</span>  आपने इस प्रश्न के लिए उत्तर चुन लिया है।</p>
                    <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">4</span>  आपने इस प्रश्न का उत्तर नहीं दिया है, पर इसे समीक्षा के लिए रखा है।</p>
                    <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">5</span>  "उत्तर दिया गया और समीक्षा के लिए चिह्नित" प्रश्नों पर मूल्यांकन हेतु विचार किया जाएगा।</p>
                    <p className="mt-8 text-[12px] font-semibold">1. परीक्षा प्रश्नों की भाषा बदलने के लिए, अपने सेक्शन बार के ऊपरी दाएं कोने में "View in" ढूंढें और पूरी प्रश्न-पत्रिका की भाषा बदलने के लिए उस पर क्लिक करें।</p>
                    <h2 className="font-bold mt-6 text-base md:text-lg">प्रश्न पर नेविगेट करना:</h2>
                    <p className="mt-4 text-[12px]">2. किसी प्रश्न का उत्तर देने के लिए, निम्न कार्य करें:</p>
                    <p className="mt-4 text-[12px]">a. किसी विशेष प्रश्न पर तुरंत पहुंचने के लिए, स्क्रीन के दाईं ओर प्रश्न पैलेट में उस प्रश्न की संख्या पर क्लिक करें। कृपया ध्यान दें कि ऐसा करने से आपके वर्तमान प्रश्न का उत्तर सुरक्षित नहीं होगा। <br/>
                    b. यदि आप अपना वर्तमान उत्तर सहेजना और अगले प्रश्न पर जाना चाहते हैं, तो "Save & Next" पर क्लिक करें। <br/>
                    c. यदि आप अपना वर्तमान उत्तर सहेजना चाहते हैं, इसे समीक्षा के लिए चिह्नित करना चाहते हैं, और अगले प्रश्न पर जाना चाहते हैं, तो "Mark for Review & Next" पर क्लिक करें।</p>
                    <h2 className="font-bold mt-6 text-base md:text-lg">प्रश्न का उत्तर देना:</h2>
                    <p className="text-[12px] mt-4">3. बहुविकल्पीय प्रश्न का उत्तर देने की प्रक्रिया:<br/></p>
                    <p className="mt-4 text-[12px]">a. उत्तर चुनने के लिए, एक विकल्प का बटन दबाएं।<br/>
                    b. यदि आप चुना हुआ उत्तर हटाना चाहते हैं, तो उसी बटन को फिर से दबाएं या "Clear Response" पर क्लिक करें।<br/>
                    c. दूसरा उत्तर चुनने के लिए, किसी और विकल्प का बटन दबाएं।<br/>
                    d. उत्तर सहेजने के लिए, "Save & Next" बटन पर क्लिक करना ज़रूरी है।<br/>
                    e. प्रश्न को समीक्षा के लिए चिह्नित करने के लिए, "Mark for Review & Next" बटन दबाएं।<br/></p>
                    <p className="text-[12px] mt-3">4. यदि आप पहले से दिए गए किसी उत्तर को बदलना चाहते हैं, तो पहले उस प्रश्न पर वापस जाएं और फिर सामान्य तरीके से उसका उत्तर दें।</p>
                  </>
                ) : (
                  <>
                    <p className="text-center text-[20px]">Please read the exam instructions carefully</p>
                    <p className="mt-5 text-[15px] font-semibold">General Instructions:</p>
                    <p className="mt-8"><span className="text-white bg-gray-500 border py-1 md:py-2 px-3 md:px-4">1</span> You have not seen this question yet.</p>
                    <p className="mt-8"><span className="text-white bg-orange-600 border py-1 md:py-2 px-3 md:px-4">2</span> You have not chosen any answer for this question.</p>
                    <p className="mt-8"><span className="text-white bg-green-500 border py-1 md:py-2 px-3 md:px-4">3</span> You have chosen an answer for this question.</p>
                    <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">4</span> You have not answered this question, but have kept it for review.</p>
                    <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">5</span> Questions marked as "Answered & Marked for Review" will be considered for evaluation.</p>
                    <p className="mt-8 text-[12px] font-semibold">1. To change the language of exam questions, find "View in" in the top right corner of your section bar and click on it to change the language of the entire question paper.</p>
                    <h2 className="font-bold mt-6 text-base md:text-lg">Navigating Questions:</h2>
                    <p className="mt-4 text-[12px]">2. To answer a question, do the following:</p>
                    <p className="mt-4 text-[12px]">a. To reach a specific question immediately, click on its number in the question palette on the right side of the screen. Please note that doing so will not save your current question's answer. <br/>
                    b. If you want to save your current answer and move to the next question, click "Save & Next". <br/>
                    c. If you want to save your current answer, mark it for review, and move to the next question, click "Mark for Review & Next".</p>
                    <h2 className="font-bold mt-6 text-base md:text-lg">Answering Questions:</h2>
                    <p className="text-[12px] mt-4">3. Process for answering multiple choice questions:<br/></p>
                    <p className="mt-4 text-[12px]">a. To select an answer, press a radio button for an option.<br/>
                    b. If you want to remove the selected answer, press the same button again or click "Clear Response".<br/>
                    c. To select another answer, press a radio button for another option.<br/>
                    d. To save the answer, it is necessary to click the "Save & Next" button.<br/>
                    e. To mark a question for review, press the "Mark for Review & Next" button.<br/></p>
                    <p className="text-[12px] mt-3">4. If you want to change a previously given answer, first go back to that question and then answer it in the usual way.</p>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Modal */}
      {showQuestionPaperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#290c52] text-white flex justify-between items-center px-6 py-4 rounded-t-lg">
              <h2 className="text-lg md:text-xl font-semibold">Question Paper</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-sm">View in:</span>
                  <select
                    className="bg-white text-black px-2 py-1 rounded text-sm"
                    value={modalLanguage}
                    onChange={(e) => setModalLanguage(e.target.value)}
                  >
                    <option value="हिन्दी">हिन्दी</option>
                    <option value="English">English</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowQuestionPaperModal(false)}
                  className="text-white hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 mx-4 mt-4">
              <p className="text-sm font-semibold">
                {modalLanguage === "हिन्दी" 
                  ? "कृपया ध्यान दें: जब आप ये निर्देश पढ़ रहे हैं, तब भी टाइमर चलता रहेगा। इस विंडो को बंद करें ताकि परीक्षा जारी रख सकें।"
                  : "Please be aware that the timer continues to count down as you read these instructions. Close this window to resume the exam."}
              </p>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No questions available</p>
              ) : (
                <div className="mb-6">
                  {topic && (
                    <h3 className="text-lg font-semibold text-blue-600 mb-4 bg-blue-50 px-4 py-2 rounded">
                      {topic.topicName}
                    </h3>
                  )}
                  <div className="space-y-4">
                    {questions.map((q, index) => {
                      const questionText = modalLanguage === "हिन्दी" && q.question_hi 
                        ? q.question_hi 
                        : q.question_en || q.question_hi || '[Image Question]';
                      const displayText = questionText.replace(/\s*\(Question\s+\d+\)/gi, '').trim();
                      
                      return (
                        <div key={q._id || q.id || index} className="border-b border-gray-200 pb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="font-semibold text-gray-700">Q.{index + 1}</span>
                            <div className="flex-1">
                              {q.imageUrl && q.imageUrl.trim() !== '' ? (
                                <div className="mb-2">
                                  <img 
                                    src={q.imageUrl} 
                                    alt="Question" 
                                    className="max-w-full h-auto rounded border"
                                    style={{ maxHeight: '200px' }}
                                  />
                                </div>
                              ) : (
                                <p className="text-sm md:text-base">{displayText}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {modalLanguage === "हिन्दी" 
                                  ? `प्रश्न प्रकार: MCQ ; सही उत्तर के अंक: ${q.marks || 1} ; निगेटिव अंक: ${q.negativeMarks || 0}`
                                  : `Question Type: MCQ ; Marks for correct answer: ${q.marks || 1} ; Negative marks: ${q.negativeMarks || 0}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowQuestionPaperModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopicWiseMCQPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <TopicWiseMCQPageContent />
    </Suspense>
  );
}
