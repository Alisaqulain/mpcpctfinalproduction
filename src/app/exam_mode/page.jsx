"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

export default function CPCTPage() {
  const [section, setSection] = useState("");
  const [timeLeft, setTimeLeft] = useState(75 * 60);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [userName, setUserName] = useState("User");
  const [examData, setExamData] = useState(null);
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [questionLanguage, setQuestionLanguage] = useState("English");
  const [viewLanguage, setViewLanguage] = useState("English");
  const [loading, setLoading] = useState(true);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(60); // 1 minute break
  const [allSectionsCompleted, setAllSectionsCompleted] = useState(false);
  const audioRef = useRef(null);
  const loggedImageQuestions = useRef(new Set()); // Track which questions we've already logged

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(selectedAnswers).length > 0) {
      localStorage.setItem('examAnswers', JSON.stringify(selectedAnswers));
    }
  }, [selectedAnswers]);

  // Load exam data from database
  useEffect(() => {
    const loadExamData = async () => {
      try {
        setLoading(true);
        
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

        // Load question language preference
        const savedLang = localStorage.getItem('questionLanguage');
        if (savedLang) {
          setQuestionLanguage(savedLang);
        }

        // Get exam ID from localStorage
        const examId = localStorage.getItem('currentExamId');
        if (!examId) {
          console.error('No exam ID found');
          setLoading(false);
          return;
        }

        // Fetch exam data
        const res = await fetch(`/api/exam-questions?examId=${examId}`);
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched exam data:', data);
          if (data.success && data.data) {
            setExamData(data.data.exam);
            setSections(data.data.sections || []);
            
            // Organize questions by section
            const questionsBySection = {};
            const unmatchedQuestions = [];
            
            data.data.sections.forEach(sec => {
              // Match questions by sectionId (can be _id string or section id)
              const sectionQuestions = data.data.allQuestions.filter(q => {
                const qSectionId = String(q.sectionId).trim();
                const secIdStr = String(sec.id).trim();
                const secIdObj = String(sec._id).trim();
                
                const matches = qSectionId === secIdObj || 
                       qSectionId === secIdStr ||
                       qSectionId === sec._id.toString() ||
                       qSectionId === sec.id;
                return matches;
              });
              questionsBySection[sec.name] = sectionQuestions;
              console.log(`Section "${sec.name}" (id: ${sec.id}, _id: ${sec._id}): ${sectionQuestions.length} questions`);
              sectionQuestions.forEach((q, idx) => {
                const isImageQ = q.question_en === '[Image Question]';
                const hasImg = q.imageUrl && typeof q.imageUrl === 'string' && q.imageUrl.trim() !== '';
                console.log(`  Question ${idx + 1}: sectionId="${q.sectionId}" (type: ${typeof q.sectionId}), question_en="${q.question_en?.substring(0, 30)}...", imageUrl: ${q.imageUrl || 'undefined'}, isImageQuestion: ${isImageQ}, hasImageUrl: ${hasImg}`);
                if (isImageQ && !hasImg) {
                  console.warn(`    ⚠️ WARNING: Question ${idx + 1} is an image question but has no imageUrl!`);
                  console.warn(`    Question ID: ${q._id}`);
                  console.warn(`    Section: ${sec.name}`);
                  console.warn(`    Please edit this question in the admin panel and upload an image.`);
                  console.warn(`    Question Object:`, JSON.parse(JSON.stringify(q)));
                } else if (isImageQ && hasImg) {
                  console.log(`    ✅ Question ${idx + 1} is an image question WITH imageUrl: ${q.imageUrl}`);
                }
              });
            });
            
            // Find unmatched questions
            const allMatchedQuestionIds = new Set();
            Object.values(questionsBySection).forEach(secQuestions => {
              secQuestions.forEach(q => allMatchedQuestionIds.add(q._id));
            });
            data.data.allQuestions.forEach(q => {
              if (!allMatchedQuestionIds.has(q._id)) {
                unmatchedQuestions.push(q);
              }
            });
            
            // If there are unmatched questions, add them to a default section
            if (unmatchedQuestions.length > 0) {
              console.warn(`Found ${unmatchedQuestions.length} unmatched questions:`, unmatchedQuestions);
              // Try to match them to the first section or create a default section
              if (data.data.sections.length > 0) {
                const firstSectionName = data.data.sections[0].name;
                questionsBySection[firstSectionName] = [
                  ...(questionsBySection[firstSectionName] || []),
                  ...unmatchedQuestions
                ];
              }
            }
            
            console.log('Questions by section:', questionsBySection);
            
            // Collect all image questions without imageUrl for summary
            const imageQuestionsWithoutUrl = [];
            Object.keys(questionsBySection).forEach(secName => {
              questionsBySection[secName].forEach(q => {
                if (q.question_en === '[Image Question]' && (!q.imageUrl || q.imageUrl.trim() === '')) {
                  imageQuestionsWithoutUrl.push({
                    _id: q._id,
                    section: secName,
                    questionNumber: questionsBySection[secName].indexOf(q) + 1
                  });
                }
              });
            });
            
            if (imageQuestionsWithoutUrl.length > 0) {
              console.warn('⚠️ SUMMARY: Found', imageQuestionsWithoutUrl.length, 'image questions without imageUrl:');
              imageQuestionsWithoutUrl.forEach((q, idx) => {
                console.warn(`  ${idx + 1}. Question ID: ${q._id}, Section: ${q.section}, Question #${q.questionNumber}`);
              });
              console.warn('Please edit these questions in the admin panel and upload images.');
            }
            
            // Clear logged questions when new data is loaded
            loggedImageQuestions.current.clear();
            
            setQuestions(questionsBySection);
            
            // Set first section as default
            if (data.data.sections.length > 0) {
              const firstSectionName = data.data.sections[0].name;
              setSection(firstSectionName);
              // Mark first question of first section as visited
              const firstQuestion = questionsBySection[firstSectionName]?.[0];
              if (firstQuestion?._id) {
                setVisitedQuestions(prev => {
                  const newSet = new Set([...prev, firstQuestion._id]);
                  localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                  return newSet;
                });
              }
            }
            
            // Set timer from exam data
            if (data.data.exam.totalTime) {
              setTimeLeft(data.data.exam.totalTime * 60);
            }
            
            // Load completed sections from localStorage
            const savedCompletedSections = localStorage.getItem('completedSections');
            if (savedCompletedSections) {
              try {
                setCompletedSections(new Set(JSON.parse(savedCompletedSections)));
              } catch (e) {
                console.error('Error loading completed sections:', e);
              }
            }
            
            // Load saved answers from localStorage
            const savedAnswersStr = localStorage.getItem('examAnswers');
            if (savedAnswersStr) {
              try {
                const savedAnswers = JSON.parse(savedAnswersStr);
                setSelectedAnswers(savedAnswers);
              } catch (error) {
                console.error('Error loading saved answers:', error);
              }
            }
            
            // Load visited questions from localStorage
            const visitedStr = localStorage.getItem('visitedQuestions');
            if (visitedStr) {
              try {
                const visitedArray = JSON.parse(visitedStr);
                setVisitedQuestions(new Set(visitedArray));
              } catch (error) {
                console.error('Error loading visited questions:', error);
              }
            }
            
            // Load marked for review from localStorage
            const markedStr = localStorage.getItem('markedForReview');
            if (markedStr) {
              try {
                const markedArray = JSON.parse(markedStr);
                setMarkedForReview(new Set(markedArray));
              } catch (error) {
                console.error('Error loading marked questions:', error);
              }
            }
          } else {
            console.error('Invalid response format:', data);
          }
        } else {
          const errorText = await res.text();
          console.error('Failed to fetch exam data:', res.status, errorText);
        }
      } catch (error) {
        console.error('Error loading exam data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, []);

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

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play sound each second
  useEffect(() => {
    if (isSoundOn && audioRef.current && timeLeft > 0) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Sound error:", err);
      });
    }
  }, [timeLeft, isSoundOn]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Get current question based on section and index
  const getCurrentQuestion = useCallback(() => {
    if (!section || !questions[section] || questions[section].length === 0) {
      return null;
    }
    const question = questions[section][currentQuestionIndex] || questions[section][0];
    return question;
  }, [section, currentQuestionIndex, questions]);

  const currentQuestion = getCurrentQuestion();

  // Log image question warnings only once per question
  useEffect(() => {
    // Get current question inside useEffect to ensure fresh value
    const question = getCurrentQuestion();
    
    if (!question || !question._id) {
      return;
    }

    const questionId = question._id.toString();
    
    // Skip if we've already logged this question
    if (loggedImageQuestions.current.has(questionId)) {
      return;
    }

    try {
      // Check if it's an image question
      const isImageQuestion = question.question_en === '[Image Question]';
      const imageUrlValue = question.imageUrl;
      const hasImageUrl = imageUrlValue && typeof imageUrlValue === 'string' && imageUrlValue.trim() !== '';
      
      // Log image question status
      if (isImageQuestion) {
        if (!hasImageUrl) {
          // Mark as logged
          loggedImageQuestions.current.add(questionId);
          
          // Use console.warn instead of console.error to avoid showing in error overlay
          console.warn('⚠️ Image question missing image URL');
          console.warn('Question ID:', questionId);
          console.warn('Please edit this question in the admin panel and upload an image.');
          console.warn('Full question data:', JSON.parse(JSON.stringify(question)));
        } else {
          // Log when image question has URL (for debugging)
          console.log('✅ Image question with URL:', {
            questionId: questionId,
            imageUrl: imageUrlValue,
            imageUrlType: typeof imageUrlValue
          });
        }
      }
    } catch (error) {
      // Only log actual errors, not missing image URLs
      console.warn('Error checking question image URL:', error);
    }
  }, [getCurrentQuestion]);

  // Check if we're on the last question of the last section
  const isLastQuestion = () => {
    if (!section || !questions[section] || sections.length === 0) return false;
    const currentSectionIndex = sections.findIndex(s => s.name === section);
    const isLastSection = currentSectionIndex === sections.length - 1;
    const isLastQuestionInSection = currentQuestionIndex === (questions[section]?.length || 0) - 1;
    return isLastSection && isLastQuestionInSection;
  };

  // Calculate statistics from all questions
  const calculateStatistics = () => {
    let totalAnswered = 0;
    let totalNotAnswered = 0;
    let totalNotVisited = 0;
    let totalMarkedForReview = 0;
    let totalAnsweredAndMarked = 0;
    let totalQuestions = 0;

    // Iterate through all sections and questions
    Object.keys(questions).forEach(secName => {
      const secQuestions = questions[secName] || [];
      secQuestions.forEach(q => {
        totalQuestions++;
        const isAnswered = selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] !== null;
        const isVisited = visitedQuestions.has(q._id);
        const isMarked = markedForReview.has(q._id);

        if (isAnswered) {
          totalAnswered++;
        } else {
          totalNotAnswered++;
        }

        if (!isVisited) {
          totalNotVisited++;
        }

        if (isMarked && isAnswered) {
          totalAnsweredAndMarked++;
        } else if (isMarked) {
          totalMarkedForReview++;
        }
      });
    });

    return {
      totalQuestions,
      totalAnswered,
      totalNotAnswered,
      totalNotVisited,
      totalMarkedForReview,
      totalAnsweredAndMarked
    };
  };

  const stats = calculateStatistics();

  // Mark current question as visited when it's displayed
  useEffect(() => {
    if (currentQuestion && currentQuestion._id) {
      setVisitedQuestions(prev => {
        const newSet = new Set([...prev, currentQuestion._id]);
        // Save to localStorage
        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
        return newSet;
      });
    }
  }, [currentQuestion]);

  // Save marked for review to localStorage
  useEffect(() => {
    if (markedForReview.size > 0) {
      localStorage.setItem('markedForReview', JSON.stringify([...markedForReview]));
    }
  }, [markedForReview]);

  // Handle section submission
  const handleSubmitSection = () => {
    if (!section) return;
    
    // Mark section as completed
    setCompletedSections(prev => {
      const newSet = new Set([...prev, section]);
      localStorage.setItem('completedSections', JSON.stringify([...newSet]));
      return newSet;
    });

    // Check if all sections are completed
    const allCompleted = sections.every(sec => {
      const isCompleted = sec.name === section || completedSections.has(sec.name);
      return isCompleted;
    });

    if (allCompleted) {
      setAllSectionsCompleted(true);
      // Redirect to result page after a short delay
      setTimeout(() => {
        window.location.href = "/exam/exam-result";
      }, 1000);
    } else {
      // Start break timer before next section
      setIsBreakActive(true);
      setBreakTimeLeft(60);
      const breakInterval = setInterval(() => {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(breakInterval);
            return 0;
          }
          return prev - 1;
          });
      }, 1000);
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-white relative">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-1 left-2 z-50 bg-[#290c52] text-white p-2 rounded"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white w-64 overflow-y-auto">
          <div className="p-4 text-sm h-full">
            <div className="flex flex-col items-center py-6">
              <img src="/lo.jpg" className="w-24 h-24 rounded-full border-2" />
              <p className="mt-2 font-semibold text-blue-800">{userName}</p>
              <hr className="border w-full mt-2" />
            </div>
            <div className="text-xs grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center">
                <span className="inline-block w-8 h-8 bg-green-400 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalAnswered}</span>
                <p>Answered</p>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-10 h-8 bg-red-600 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalNotAnswered}</span>
                <p>Not Answered</p>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-8 h-8 bg-gray-400 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalNotVisited}</span>
                <p>Not Visited</p>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-12 h-8 bg-purple-600 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalMarkedForReview}</span>
                <p>Marked for Review</p>
              </div>
              <div className="flex items-center col-span-2">
                <span className="inline-block w-8 h-8 bg-indigo-600 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalAnsweredAndMarked}</span>
                <p>Answered & Marked for Review</p>
              </div>
            </div>

            {section && (
              <>
                <h2 className="font-bold mb-2 text-white-50 text-center bg-[#290c52] text-[12px] text-white py-2">{section}</h2>
                <h2 className="font-bold mb-2 text-white-50">Choose a Question</h2>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {questions[section] && questions[section].length > 0 ? (
                    questions[section].map((q, i) => {
                      const isAnswered = selectedAnswers[q._id] !== undefined;
                      const isCurrent = i === currentQuestionIndex;
                      return (
                        <div
                          key={q._id}
                          className={`w-8 h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${
                            isCurrent ? "bg-red-600 text-white" : isAnswered ? "bg-green-400" : "bg-gray-300"
                          }`}
                          onClick={() => {
                            setCurrentQuestionIndex(i);
                            // Mark question as visited when clicked
                            if (q._id) {
                              setVisitedQuestions(prev => {
                                const newSet = new Set([...prev, q._id]);
                                localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                                return newSet;
                              });
                            }
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-500 col-span-4">No questions in this section</p>
                  )}
                </div>
              </>
            )}
          
            <button 
              onClick={handleSubmitSection}
              disabled={completedSections.has(section)}
              className={`px-12 py-3 ml-2 mt-1 text-[13px] rounded ${
                completedSections.has(section)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#290c52] hover:bg-cyan-700 text-white'
              }`}
            >
              {completedSections.has(section) ? 'Section Completed' : 'Submit Section'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 w-full bg-[#290c52] text-white flex justify-between items-center px-4 py-2 text-sm z-30">
          <div className="font-semibold">MPCPCT 2025</div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 pr-4">
              <img src="/lo.jpg" className="w-8 h-8 rounded-full border" />
            </div>
            <span className="cursor-pointer underline hidden sm:inline text-[12px] p-2">View Instructions</span>
            <span className="cursor-pointer underline hidden sm:inline text-[12px]">Question Paper</span>
          </div>
        </div>

        {/* Exam Title (Mobile & Desktop) */}
        {examData && (
          <div className="bg-white-50 border-b border-gray-300 px-4 py-4 mt-10">
            <h2 className="text-lg md:text-xl font-semibold text-[#290c52] text-center">
              {examData.title || 'Exam'}
            </h2>
          </div>
        )}

        {/* Section Dropdown (Mobile) */}
        <div className="lg:hidden border-b px-4 py-3 border-y-gray-200 bg-[#fff]">
          <div className="relative">
            <button 
              className="w-full bg-white text-blue-700 px-4 py-3 border border-gray-300 rounded text-left flex justify-between items-center"
              onClick={() => setShowSectionDropdown(!showSectionDropdown)}
            >
              <span>{section}</span>
              <span>{showSectionDropdown ? "▲" : "▼"}</span>
            </button>
            {showSectionDropdown && (
              <div className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                {sections.map((sec) => (
                  <button
                    key={sec._id}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      section === sec.name ? "bg-gray-200" : ""
                    }`}
                    onClick={() => {
                      setSection(sec.name);
                      setCurrentQuestionIndex(0);
                      setShowSectionDropdown(false);
                      // Mark first question of selected section as visited
                      const firstQuestion = questions[sec.name]?.[0];
                      if (firstQuestion?._id) {
                        setVisitedQuestions(prev => {
                          const newSet = new Set([...prev, firstQuestion._id]);
                          localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                          return newSet;
                        });
                      }
                    }}
                  >
                    {sec.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end mt-2">
            <button onClick={() => setIsSoundOn(!isSoundOn)} title={isSoundOn ? "Mute" : "Unmute"}>
              {isSoundOn ? "🔊" : "🔇"}
            </button>
            <span className="text-lg ml-2">Time Left: <b className="bg-blue-400 text-black px-3">{formatTime(timeLeft)}</b></span>
          </div>
        </div>

        {/* Section Nav (Desktop) */}
        <div className="hidden lg:flex border-b px-4 py-0 border-y-gray-200 bg-[#fff] text-xs overflow-x-auto">
          {sections.map((sec) => (
            <button
              key={sec._id}
              onClick={() => {
                setSection(sec.name);
                setCurrentQuestionIndex(0);
                // Mark first question of selected section as visited
                const firstQuestion = questions[sec.name]?.[0];
                if (firstQuestion?._id) {
                  setVisitedQuestions(prev => {
                    const newSet = new Set([...prev, firstQuestion._id]);
                    localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                    return newSet;
                  });
                }
              }}
              className={`${
                section === sec.name
                  ? "bg-[#290c52] text-white border-gray-300"
                  : "bg-white text-blue-700 border-r border-gray-300 px-4"
              } px-2 py-3 whitespace-nowrap`}
            >
              {sec.name}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
            <button onClick={() => setIsSoundOn(!isSoundOn)} title={isSoundOn ? "Mute" : "Unmute"}>
              {isSoundOn ? "🔊" : "🔇"}
            </button>
            <span className="text-lg">Time Left: <b className="bg-blue-400 text-black px-3 mr-5">{formatTime(timeLeft)}</b></span>
          </div>
          
        </div>
        {section && questions[section] && questions[section].length > 0 && (
          <div className="flex gap-2 h-20 overflow-x-auto md:hidden ml-5">
            {questions[section].map((q, i) => {
              const isAnswered = selectedAnswers[q._id] !== undefined;
              const isCurrent = i === currentQuestionIndex;
              return (
                <div
                  key={q._id}
                  className={`min-w-[2rem] h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${
                    isCurrent ? "bg-red-600 text-white" : isAnswered ? "bg-green-400" : "bg-gray-300"
                  }`}
                  onClick={() => setCurrentQuestionIndex(i)}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        )}



        {/* Question Panel */}
      <div className="flex-grow p-4 overflow-auto bg-white-50 mt-0 md:mt-0 relativeaaaaaaaaaaaaaa">
  {/* Fixed Top Bar */}
  <div className="bg-[#290c52] text-white text-sm px-4 py-3 rounded-t flex justify-between flex-wrap gap-2 sticky top-[-20px] md:top-0 z-10 mb-0 md:">
    <span>Question Type: MCQ</span>
    <div className="flex items-center gap-2">
      <p>View in:</p>
      <select 
        className="text-black text-xs bg-white"
        value={viewLanguage}
        onChange={(e) => setViewLanguage(e.target.value)}
      >
        <option value="English">English</option>
        <option value="हिन्दी">हिन्दी</option>
      </select>
    </div>
  </div>

  {/* Scrollable Content */}
  <div className="border border-gray-300 rounded-b">
    <div className="bg-white-50 px-4 py-3 border-b text-sm font-semibold flex flex-col sm:flex-row justify-between">
      <span>Question No. {currentQuestionIndex + 1} {questions[section] && `of ${questions[section].length}`}</span>
      <span className="mt-1 sm:mt-0">
        Marks for correct answer: {currentQuestion?.marks || 1} | Negative Marks: <span className="text-red-500">{currentQuestion?.negativeMarks || 0}</span>
      </span>
    </div>

    {loading ? (
      <div className="p-8 text-center">
        <p>Loading exam questions...</p>
      </div>
    ) : !currentQuestion ? (
      <div className="p-8 text-center">
        <p>No questions available for this section.</p>
      </div>
    ) : (
      <>
        {/* Break Modal */}
        {isBreakActive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <h2 className="text-2xl font-bold mb-4 text-[#290c52]">Break Time</h2>
              <p className="text-lg mb-4">Section "{section}" completed successfully!</p>
              <p className="text-3xl font-bold text-blue-600 mb-4">{formatTime(breakTimeLeft)}</p>
              <p className="text-gray-600 mb-4">Take a 1 minute break before the next section</p>
              {breakTimeLeft === 0 && (
                <button
                  onClick={() => {
                    setIsBreakActive(false);
                    setBreakTimeLeft(60);
                    // Move to next incomplete section
                    const nextSection = sections.find(sec => !completedSections.has(sec.name));
                    if (nextSection) {
                      setSection(nextSection.name);
                      setCurrentQuestionIndex(0);
                    }
                  }}
                  className="bg-[#290c52] hover:bg-cyan-700 text-white px-6 py-2 rounded"
                >
                  Continue to Next Section
                </button>
              )}
            </div>
          </div>
        )}

        {currentQuestion.passage_en || currentQuestion.passage_hi ? (
          <div className="flex flex-col lg:flex-row p-4 gap-x-6 gap-y-10">
            <div className="lg:w-2/3 text-sm border-r pr-4 max-h-72 overflow-y-auto">
              <h3 className="font-bold mb-2">Passage:</h3>
              <p>{viewLanguage === "हिन्दी" && currentQuestion.passage_hi 
                ? currentQuestion.passage_hi 
                : currentQuestion.passage_en || currentQuestion.passage_hi}</p>
            </div>
            <div className="lg:w-1/3 text-xl">
            {/* Show image if question has imageUrl, otherwise show text */}
            {(() => {
              const isImageQuestion = currentQuestion?.question_en === '[Image Question]';
              // Handle both null and undefined - check if imageUrl exists and is not empty
              const hasImageUrl = currentQuestion?.imageUrl && 
                                  currentQuestion.imageUrl !== null && 
                                  currentQuestion.imageUrl !== undefined &&
                                  String(currentQuestion.imageUrl).trim() !== '';
              
              // Image question without URL - show warning message
              if (isImageQuestion && !hasImageUrl) {
                return (
                  <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <p className="text-red-600 font-semibold mb-2">
                      ⚠️ Image question but no image URL found!
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      Question ID: <code className="bg-gray-200 px-2 py-1 rounded">{currentQuestion?._id}</code>
                    </p>
                    <p className="text-sm text-gray-700">
                      Please go to the <strong>Admin Panel</strong>, edit this question, and upload an image.
                    </p>
                  </div>
                );
              }
              
              // For non-image questions without imageUrl, just show text
              if (!hasImageUrl) {
                return (
                  <p className="mb-4">
                    {viewLanguage === "हिन्दी" && currentQuestion?.question_hi 
                      ? currentQuestion.question_hi 
                      : currentQuestion?.question_en || currentQuestion?.question_hi || 'No question text available'}
                  </p>
                );
              }
              
              // Has imageUrl - render the image
              // Ensure imageUrl is a valid string (handle null/undefined)
              const imageUrl = String(currentQuestion.imageUrl || '').trim();
              const encodedUrl = encodeURI(imageUrl);
              
              console.log('🖼️ Rendering image:', {
                originalUrl: imageUrl,
                encodedUrl: encodedUrl,
                questionId: currentQuestion._id
              });
              
              return (
                <div className="mb-4">
                  <img 
                    src={encodedUrl} 
                    alt="Question Image" 
                    className="max-w-full h-auto rounded border shadow-md"
                    style={{ maxHeight: '500px', display: 'block' }}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', {
                        originalUrl: imageUrl,
                        encodedUrl: encodedUrl,
                        attemptedSrc: e.target.src,
                        questionId: currentQuestion._id
                      });
                      e.target.style.border = '2px solid red';
                      e.target.alt = 'Image failed to load: ' + imageUrl;
                      // Show error message
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-600 text-sm mt-2 p-2 bg-red-50 rounded';
                      errorDiv.innerHTML = `<strong>Image failed to load!</strong><br/>URL: ${imageUrl}<br/>Please check if the file exists at: <code>public${imageUrl}</code>`;
                      e.target.parentElement.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', {
                        url: imageUrl,
                        encodedUrl: encodedUrl,
                        questionId: currentQuestion._id
                      });
                    }}
                  />
                </div>
              );
            })()}
              {(viewLanguage === "हिन्दी" && currentQuestion.options_hi && currentQuestion.options_hi.length > 0
                ? currentQuestion.options_hi 
                : currentQuestion.options_en || currentQuestion.options_hi || []).map((opt, i) => (
                <label key={i} className="flex items-start gap-x-2 gap-y-6">
                  <input 
                    type="radio" 
                    name={`q-${currentQuestion._id}`}
                    className="mt-1"
                    checked={selectedAnswers[currentQuestion._id] === i}
                    onChange={() => {
                      const newAnswers = {...selectedAnswers, [currentQuestion._id]: i};
                      setSelectedAnswers(newAnswers);
                      localStorage.setItem('examAnswers', JSON.stringify(newAnswers));
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 text-md md:text-xl mb-28">
            {/* Show image if question has imageUrl, otherwise show text */}
            {(() => {
              const isImageQuestion = currentQuestion?.question_en === '[Image Question]';
              // Handle both null and undefined - check if imageUrl exists and is not empty
              const hasImageUrl = currentQuestion?.imageUrl && 
                                  currentQuestion.imageUrl !== null && 
                                  currentQuestion.imageUrl !== undefined &&
                                  String(currentQuestion.imageUrl).trim() !== '';
              
              // Image question without URL - show warning message
              if (isImageQuestion && !hasImageUrl) {
                return (
                  <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <p className="text-red-600 font-semibold mb-2">
                      ⚠️ Image question but no image URL found!
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      Question ID: <code className="bg-gray-200 px-2 py-1 rounded">{currentQuestion?._id}</code>
                    </p>
                    <p className="text-sm text-gray-700">
                      Please go to the <strong>Admin Panel</strong>, edit this question, and upload an image.
                    </p>
                  </div>
                );
              }
              
              // For non-image questions without imageUrl, just show text
              if (!hasImageUrl) {
                return (
                  <p className="mb-4">
                    {viewLanguage === "हिन्दी" && currentQuestion?.question_hi 
                      ? currentQuestion.question_hi 
                      : currentQuestion?.question_en || currentQuestion?.question_hi || 'No question text available'}
                  </p>
                );
              }
              
              // Has imageUrl - render the image
              // Ensure imageUrl is a valid string (handle null/undefined)
              const imageUrl = String(currentQuestion.imageUrl || '').trim();
              const encodedUrl = encodeURI(imageUrl);
              
              console.log('🖼️ Rendering image:', {
                originalUrl: imageUrl,
                encodedUrl: encodedUrl,
                questionId: currentQuestion._id
              });
              
              return (
                <div className="mb-4">
                  <img 
                    src={encodedUrl} 
                    alt="Question Image" 
                    className="max-w-full h-auto rounded border shadow-md"
                    style={{ maxHeight: '500px' }}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', {
                        originalUrl: imageUrl,
                        encodedUrl: encodedUrl,
                        attemptedSrc: e.target.src,
                        questionId: currentQuestion._id
                      });
                      e.target.style.border = '2px solid red';
                      e.target.alt = 'Image failed to load: ' + imageUrl;
                      // Show error message
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-600 text-sm mt-2 p-2 bg-red-50 rounded';
                      errorDiv.innerHTML = `<strong>Image failed to load!</strong><br/>URL: ${imageUrl}<br/>Please check if the file exists at: <code>public${imageUrl}</code>`;
                      e.target.parentElement.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', {
                        url: imageUrl,
                        encodedUrl: encodedUrl,
                        questionId: currentQuestion._id
                      });
                    }}
                  />
                </div>
              );
            })()}
            {(viewLanguage === "हिन्दी" && currentQuestion.options_hi && currentQuestion.options_hi.length > 0
              ? currentQuestion.options_hi 
              : currentQuestion.options_en || currentQuestion.options_hi || []).map((opt, i) => (
              <label key={i} className="flex items-start gap-2">
                <input 
                  type="radio" 
                  name={`q-${currentQuestion._id}`}
                  className="mt-1"
                  checked={selectedAnswers[currentQuestion._id] === i}
                  onChange={() => setSelectedAnswers({...selectedAnswers, [currentQuestion._id]: i})}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
      </>
    )}
  </div>
  
</div>

        {/* Footer */}
        <div className="flex justify-between items-center bg-white-50 px-4 py-3 border-t flex-wrap gap-2">
          <div className="space-x-2">
            <button 
              className="px-4 py-2 absolute md:relative mb-[-30] ml-38 md:ml-0 md:mb-0 bg-purple-600 text-white rounded text-sm whitespace-nowrap"
              onClick={() => {
                // Mark current question for review
                if (currentQuestion && currentQuestion._id) {
                  setMarkedForReview(prev => new Set([...prev, currentQuestion._id]));
                }
                
                if (isLastQuestion()) {
                  // On last question, redirect to result page
                  window.location.href = "/exam/exam-result";
                } else {
                  // Mark for review and move to next question
                  if (currentQuestion && questions[section] && currentQuestionIndex < questions[section].length - 1) {
                    const nextIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextIndex);
                    // Mark next question as visited
                    const nextQuestion = questions[section][nextIndex];
                    if (nextQuestion?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, nextQuestion._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  } else if (sections.length > 0) {
                    // Move to next section
                    const currentSectionIndex = sections.findIndex(s => s.name === section);
                    if (currentSectionIndex < sections.length - 1) {
                      const nextSection = sections[currentSectionIndex + 1];
                      setSection(nextSection.name);
                      setCurrentQuestionIndex(0);
                      // Mark next section's first question as visited
                      const nextQuestion = questions[nextSection.name]?.[0];
                      if (nextQuestion?._id) {
                        setVisitedQuestions(prev => {
                          const newSet = new Set([...prev, nextQuestion._id]);
                          localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                          return newSet;
                        });
                      }
                    }
                  }
                }
              }}
            >
              {isLastQuestion() ? "Mark for Review & Submit" : "Mark for Review & Next"}
            </button>
            <button 
              className="px-4 py-2 bg-red-500 text-white rounded text-sm whitespace-nowrap"
              onClick={() => {
                // Clear response for current question
                if (currentQuestion) {
                  const newAnswers = {...selectedAnswers};
                  delete newAnswers[currentQuestion._id];
                  setSelectedAnswers(newAnswers);
                }
              }}
            >
              Clear Response
            </button>
          </div>
          <div className="space-x-20 md:space-x-2">
            <button 
              className="bg-blue-900 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded whitespace-nowrap disabled:opacity-50"
              disabled={currentQuestionIndex === 0 && section === sections[0]?.name}
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                } else if (sections.length > 0) {
                  // Move to previous section
                  const currentSectionIndex = sections.findIndex(s => s.name === section);
                  if (currentSectionIndex > 0) {
                    const prevSection = sections[currentSectionIndex - 1];
                    setSection(prevSection.name);
                    const prevIndex = (questions[prevSection.name]?.length || 1) - 1;
                    setCurrentQuestionIndex(prevIndex);
                    // Mark previous section's last question as visited
                    const prevQuestion = questions[prevSection.name]?.[prevIndex];
                    if (prevQuestion?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, prevQuestion._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  }
                }
              }}
            >
              Previous
            </button>
            <button 
              className={`bg-green-600 hover:bg-cyan-700 text-white px-6 py-2 text-sm rounded whitespace-nowrap ${isLastQuestion() ? 'bg-green-600' : ''}`}
              onClick={() => {
                if (isLastQuestion()) {
                  // On last question of section, submit section
                  handleSubmitSection();
                } else {
                  // Save answer and move to next question
                  if (currentQuestion && questions[section] && currentQuestionIndex < questions[section].length - 1) {
                    const nextIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextIndex);
                    // Mark next question as visited
                    const nextQuestion = questions[section][nextIndex];
                    if (nextQuestion?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, nextQuestion._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  } else if (sections.length > 0) {
                    // Move to next section
                    const currentSectionIndex = sections.findIndex(s => s.name === section);
                    if (currentSectionIndex < sections.length - 1) {
                      const nextSection = sections[currentSectionIndex + 1];
                      setSection(nextSection.name);
                      setCurrentQuestionIndex(0);
                      // Mark next section's first question as visited
                      const nextQuestion = questions[nextSection.name]?.[0];
                      if (nextQuestion?._id) {
                        setVisitedQuestions(prev => {
                          const newSet = new Set([...prev, nextQuestion._id]);
                          localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                          return newSet;
                        });
                      }
                    }
                  }
                }
              }}
            >
              {isLastQuestion() ? " Save & Next" : "Save & Next"}
            </button>
          </div>
          <button className="bg-green-800 hover:bg-cyan-700 text-white px-12 py-2 ml-2 text-[13px] rounded w-full md:hidden">
  <a href="/exam/exam-result">Submit Section</a>
</button>

        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-full lg:w-60 bg-blue-50 border-l shadow-lg max-h-[100vh] overflow-y-auto sticky top-0 mt-3">
        <div className="p-4 text-sm h-full">
          <div className="flex flex-col items-center py-6">
            <img src="/lo.jpg" className="w-24 h-24 rounded-full border-2" />
            <p className="mt-2 font-semibold text-blue-800">{userName}</p>
            <hr className="border w-full mt-2" />
          </div>
          <div className="text-xs grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center">
              <span className="inline-block w-8 h-8 bg-green-400 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalAnswered}</span>
              <p>Answered</p>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-15 h-8 bg-red-600 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalNotAnswered}</span>
              <p>Not Answered</p>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-8 h-8 bg-gray-400 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalNotVisited}</span>
              <p>Not Visited</p>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-14 h-8 bg-purple-600 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalMarkedForReview}</span>
              <p>Marked for Review</p>
            </div>
            <div className="flex items-center col-span-2">
              <span className="inline-block w-8 h-8 bg-indigo-600 mr-2 rounded-sm text-center items-center justify-center pt-1 text-white text-[20px]">{stats.totalAnsweredAndMarked}</span>
              <p>Answered & Marked for Review</p>
            </div>
          </div>

          {section && (
            <>
              <h2 className="font-bold mb-2 text-white-50 text-center bg-[#290c52] text-[12px] text-white py-2">{section}</h2>
              <h2 className="font-bold mb-2 text-white-50">Choose a Question</h2>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {questions[section] && questions[section].length > 0 ? (
                  questions[section].map((q, i) => {
                    const isAnswered = selectedAnswers[q._id] !== undefined;
                    const isCurrent = i === currentQuestionIndex;
                      return (
                        <div
                          key={q._id}
                          className={`w-8 h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${
                            isCurrent ? "bg-red-600 text-white" : isAnswered ? "bg-green-400" : "bg-gray-300"
                          }`}
                          onClick={() => {
                            setCurrentQuestionIndex(i);
                            // Mark question as visited when clicked
                            if (q._id) {
                              setVisitedQuestions(prev => {
                                const newSet = new Set([...prev, q._id]);
                                localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                                return newSet;
                              });
                            }
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                  })
                ) : (
                  <p className="text-xs text-gray-500 col-span-4">No questions in this section</p>
                )}
              </div>
            </>
          )}
        
          <button className="bg-green-800 hover:bg-cyan-700 text-white px-12 py-2 ml-2 mt-[-4] text-[13px] rounded">
            <a href="/exam/exam-result">Submit Section</a>
          </button>
        </div>
      </div>
    </div>
  );
}