"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [timerStarted, setTimerStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());

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
          // Use all questions (should be 100)
          if (data.questions.length < 100) {
            setError(`Only ${data.questions.length} questions found. This exam requires 100 questions. Please contact administrator.`);
            return;
          }
          // Ensure exactly 100 questions are displayed
          const questionsToDisplay = data.questions.slice(0, 100);
          setQuestions(questionsToDisplay);
          
          // Load saved answers
          const savedAnswers = localStorage.getItem(`topicwise-answers-${topicIdParam}`);
          if (savedAnswers) {
            try {
              setSelectedAnswers(JSON.parse(savedAnswers));
            } catch (e) {
              console.error("Error loading saved answers:", e);
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
    setVisitedQuestions((prev) => new Set([...prev, questionId]));
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
    
    questions.forEach((q) => {
      const userAnswer = selectedAnswers[q._id || q.id];
      if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
        correct++;
      }
    });

    return { correct, total, score: correct, percentage: (correct / total) * 100 };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    if (questions[index]) {
      const qId = questions[index]._id || questions[index].id;
      setVisitedQuestions((prev) => new Set([...prev, qId]));
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
      return newSet;
    });
  };

  if (loading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading questions...</p>
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
    const { correct, total, score, percentage } = calculateScore();
    const passingMarks = 50;
    const isPassed = score >= passingMarks;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Exam Results</h2>
          
          <div className={`p-6 rounded-lg mb-6 ${isPassed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
            <div className="text-center">
              <p className="text-2xl font-bold mb-2">
                Score: {score} / {total}
              </p>
              <p className="text-xl mb-2">
                Percentage: {percentage.toFixed(2)}%
              </p>
              <p className="text-lg font-semibold">
                Passing Marks: {passingMarks}
              </p>
              <p className={`text-2xl font-bold mt-4 ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                {isPassed ? "✅ PASSED" : "❌ FAILED"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Question Review</h3>
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
                    {language === "en" ? q.question_en : q.question_hi}
                  </p>
                  <div className="space-y-1">
                    {(language === "en" ? q.options_en : q.options_hi).map((opt, optIdx) => (
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
                        <strong>Explanation:</strong> {language === "en" ? q.explanation_en : q.explanation_hi}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => router.push("/exam")}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Back to Exams
            </button>
          </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Topic Wise MCQ Exam</h1>
            {topic && <p className="text-sm text-gray-600">{topic.topicName}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Time Remaining</p>
              <p className={`text-2xl font-bold ${timeLeft < 600 ? "text-red-600" : ""}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              {language === "en" ? "हिंदी" : "English"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h3 className="font-semibold mb-3">Questions ({questions.length})</h3>
              <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
                {questions.map((q, idx) => {
                  const qId = q._id || q.id;
                  const isAnswered = selectedAnswers[qId] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isMarkedQ = markedForReview.has(qId);
                  const isVisited = visitedQuestions.has(qId);

                  return (
                    <button
                      key={qId}
                      onClick={() => goToQuestion(idx)}
                      className={`w-10 h-10 rounded text-sm font-semibold ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-2 ring-blue-300"
                          : isAnswered
                          ? "bg-green-500 text-white"
                          : isVisited
                          ? "bg-yellow-200 text-gray-700"
                          : "bg-gray-200 text-gray-700"
                      } ${isMarkedQ ? "ring-2 ring-purple-400" : ""}`}
                      title={`Q${idx + 1}${isMarkedQ ? " (Marked)" : ""}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                  <span>Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span>Not Visited</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-semibold"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Question Display */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  {isMarked && (
                    <span className="ml-2 bg-purple-500 text-white px-2 py-1 rounded text-xs">
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
                  {language === "en"
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
                  {(language === "en"
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

