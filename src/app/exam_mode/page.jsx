"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TypingArea from "@/components/typing/TypingArea";

function ExamModeContent() {
  const [section, setSection] = useState("");
  const [timeLeft, setTimeLeft] = useState(75 * 60);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [userName, setUserName] = useState("User");
  const [examData, setExamData] = useState(null);
  const [sections, setSections] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [questions, setQuestions] = useState({}); // questions[sectionName] = array of questions
  const [questionsByPart, setQuestionsByPart] = useState({}); // questionsByPart[sectionName][partName] = array of questions
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
  const [isTypingSection, setIsTypingSection] = useState(false);
  const [typingTimeLeft, setTypingTimeLeft] = useState(null);
  const [isMainTimerPaused, setIsMainTimerPaused] = useState(false);
  const [pausedMainTime, setPausedMainTime] = useState(null);
  const [showNotEligibleModal, setShowNotEligibleModal] = useState(false);
  const [sectionAScore, setSectionAScore] = useState(0);
  const audioRef = useRef(null);
  const loggedImageQuestions = useRef(new Set()); // Track which questions we've already logged
  const searchParams = useSearchParams();
  const router = useRouter();

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
            // Sort sections by order to ensure correct sequence
            const sortedSections = (data.data.sections || []).sort((a, b) => {
              const orderA = a.order || 0;
              const orderB = b.order || 0;
              if (orderA !== orderB) return orderA - orderB;
              // If order is same, sort by lessonNumber
              const lessonA = a.lessonNumber || 0;
              const lessonB = b.lessonNumber || 0;
              return lessonA - lessonB;
            });
            console.log('📋 Loaded sections (sorted by order):', sortedSections.map((s, i) => `${i}: ${s.name} (order: ${s.order || 0}, lesson: ${s.lessonNumber || 0})`));
            setSections(sortedSections);
            setParts(data.data.parts || []);
            
            // Organize questions by section and part
            const questionsBySection = {};
            const questionsByPartData = {}; // Store questions organized by section and part
            const unmatchedQuestions = [];
            
            data.data.sections.forEach(sec => {
              // Get parts for this section
              const sectionParts = (data.data.parts || []).filter(p => {
                const pSectionId = String(p.sectionId).trim();
                const secIdStr = String(sec.id).trim();
                const secIdObj = String(sec._id).trim();
                return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === sec._id.toString();
              });
              
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
              
              // If section has parts, organize questions by part
              if (sectionParts.length > 0) {
                // Sort parts by order
                sectionParts.sort((a, b) => (a.order || 0) - (b.order || 0));
                
                // Group questions by part
                const questionsByPart = {};
                sectionParts.forEach(part => {
                  const partQuestions = sectionQuestions.filter(q => {
                    if (!q.partId) {
                      console.log(`  Question ${q._id} has no partId`);
                      return false;
                    }
                    const qPartId = String(q.partId).trim();
                    // partId in questions is stored as ObjectId string, so compare with part._id
                    const partIdObj = String(part._id).trim();
                    // Also try comparing with part.id in case some questions use the custom ID
                    const partIdStr = String(part.id).trim();
                    const matches = qPartId === partIdObj || qPartId === partIdStr || qPartId === part._id.toString();
                    if (!matches) {
                      console.log(`  Question ${q._id} partId="${q.partId}" does NOT match part "${part.name}" (_id: ${part._id}, id: ${part.id})`);
                    }
                    return matches;
                  });
                  questionsByPart[part.name] = partQuestions;
                  console.log(`  Part "${part.name}" (id: ${part.id}, _id: ${part._id}, order: ${part.order}): ${partQuestions.length} questions`);
                  if (partQuestions.length === 0) {
                    console.warn(`  ⚠️ WARNING: Part "${part.name}" has no questions! Check if questions have partId="${part._id}" or partId="${part.id}"`);
                  }
                  if (partQuestions.length > 0) {
                    partQuestions.forEach((q, idx) => {
                      console.log(`    Question ${idx + 1}: partId="${q.partId}" matches part._id="${part._id}"`);
                    });
                  }
                });
                
                // Also include questions without partId (for backward compatibility)
                const questionsWithoutPart = sectionQuestions.filter(q => !q.partId);
                if (questionsWithoutPart.length > 0) {
                  questionsByPart['_no_part'] = questionsWithoutPart;
                  console.log(`  Questions without part: ${questionsWithoutPart.length}`);
                }
                
                // Store questions by part for this section
                const sectionQuestionsByPart = {};
                sectionParts.forEach(part => {
                  if (questionsByPart[part.name]) {
                    sectionQuestionsByPart[part.name] = questionsByPart[part.name];
                  }
                });
                if (questionsByPart['_no_part']) {
                  sectionQuestionsByPart['_no_part'] = questionsByPart['_no_part'];
                }
                
                // Store questions organized by part for this section
                questionsByPartData[sec.name] = sectionQuestionsByPart;
                
                // Flatten all questions from all parts for the section (in part order) - for backward compatibility
                const allSectionQuestions = [];
                sectionParts.forEach(part => {
                  if (questionsByPart[part.name]) {
                    allSectionQuestions.push(...questionsByPart[part.name]);
                  }
                });
                if (questionsByPart['_no_part']) {
                  allSectionQuestions.push(...questionsByPart['_no_part']);
                }
                
                questionsBySection[sec.name] = allSectionQuestions;
                console.log(`Section "${sec.name}" (id: ${sec.id}, _id: ${sec._id}): ${allSectionQuestions.length} total questions across ${sectionParts.length} parts`);
                // Log questions from all parts
                allSectionQuestions.forEach((q, idx) => {
                  const isImageQ = q.question_en === '[Image Question]';
                  const hasImg = q.imageUrl && typeof q.imageUrl === 'string' && q.imageUrl.trim() !== '';
                  console.log(`  Question ${idx + 1}: sectionId="${q.sectionId}", partId="${q.partId || 'none'}", question_en="${q.question_en?.substring(0, 30)}...", imageUrl: ${q.imageUrl || 'undefined'}, isImageQuestion: ${isImageQ}, hasImageUrl: ${hasImg}`);
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
              } else {
                // No parts, just use all section questions
                questionsBySection[sec.name] = sectionQuestions;
                console.log(`Section "${sec.name}" (id: ${sec.id}, _id: ${sec._id}): ${sectionQuestions.length} questions (no parts)`);
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
              }
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
            setQuestionsByPart(questionsByPartData);
            
            // Set section - ALWAYS check URL parameter first, then default to first section
            // Sort sections by order first
            const sortedSectionsForInit = (data.data.sections || []).sort((a, b) => {
              const orderA = a.order || 0;
              const orderB = b.order || 0;
              if (orderA !== orderB) return orderA - orderB;
              const lessonA = a.lessonNumber || 0;
              const lessonB = b.lessonNumber || 0;
              return lessonA - lessonB;
            });
            
            if (sortedSectionsForInit.length > 0) {
              const sectionParam = searchParams?.get('section');
              let targetSectionName = null;
              
              // If section parameter exists, use it (PRIORITY - NEVER override with first section)
              if (sectionParam) {
                // Decode the section parameter and trim whitespace
                const decodedSectionParam = decodeURIComponent(sectionParam).trim();
                console.log('🔍 Initial load - Looking for section from URL parameter:', decodedSectionParam);
                console.log('🔍 Available sections (sorted):', sortedSectionsForInit.map((s, i) => `${i}: "${s.name}" (order: ${s.order || 0})`));
                
                // Try exact match first
                let foundSection = sortedSectionsForInit.find(s => s.name === decodedSectionParam);
                
                // If not found, try case-insensitive match
                if (!foundSection) {
                  foundSection = sortedSectionsForInit.find(s => 
                    s.name.toLowerCase().trim() === decodedSectionParam.toLowerCase().trim()
                  );
                }
                
                // If still not found, try removing emojis/special characters
                if (!foundSection) {
                  const cleanParam = decodedSectionParam.replace(/[🔒🔓]/g, '').trim();
                  foundSection = sortedSectionsForInit.find(s => {
                    const cleanSectionName = s.name.replace(/[🔒🔓]/g, '').trim();
                    return cleanSectionName === cleanParam || 
                           cleanSectionName.toLowerCase() === cleanParam.toLowerCase();
                  });
                }
                
                if (foundSection) {
                  targetSectionName = foundSection.name;
                  console.log('✅ Initial load - Found section from URL parameter:', targetSectionName);
                } else {
                  console.error('❌ Initial load - Section parameter NOT FOUND:', decodedSectionParam);
                  console.error('Available sections are:', sortedSectionsForInit.map(s => s.name));
                  // If section param exists but not found, DO NOT default to first section
                  // Instead, keep it null and let the useEffect handle it
                  console.warn('⚠️ Section from URL not found, will try to match in useEffect');
                  targetSectionName = null; // Don't set anything, let useEffect handle it
                }
              } else {
                // No section parameter - check if we should use first incomplete section or first section
                // First, check if there are any completed sections
                const savedCompletedSections = localStorage.getItem('completedSections');
                let firstIncompleteSection = null;
                
                if (savedCompletedSections) {
                  try {
                    const completedArray = JSON.parse(savedCompletedSections);
                    const completedSet = new Set(completedArray);
                    firstIncompleteSection = sortedSectionsForInit.find(s => !completedSet.has(s.name));
                  } catch (e) {
                    console.error('Error parsing completed sections:', e);
                  }
                }
                
                // Use first incomplete section if available, otherwise use first section
                targetSectionName = firstIncompleteSection ? firstIncompleteSection.name : sortedSectionsForInit[0].name;
                console.log('ℹ️ Initial load - No section parameter in URL');
                console.log('ℹ️ Using section:', targetSectionName, firstIncompleteSection ? '(first incomplete)' : '(first section)');
              }
              
              // Only set section if we have a valid targetSectionName
              if (targetSectionName) {
                console.log('✅ Setting section to:', targetSectionName);
                setSection(targetSectionName);
                setCurrentQuestionIndex(0); // Reset to first question when changing sections
              } else {
                console.log('⏸️ Not setting section yet, will be set by useEffect from URL parameter');
              }
              
              // Set first part as default if section has parts
              const targetSection = targetSectionName 
                ? sortedSectionsForInit.find(s => s.name === targetSectionName) || sortedSectionsForInit[0]
                : sortedSectionsForInit[0];
              const targetSectionParts = (data.data.parts || []).filter(p => {
                const pSectionId = String(p.sectionId).trim();
                const secIdStr = String(targetSection.id).trim();
                const secIdObj = String(targetSection._id).trim();
                return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === targetSection._id.toString();
              });
              if (targetSectionParts.length > 0) {
                targetSectionParts.sort((a, b) => (a.order || 0) - (b.order || 0));
                const firstPartName = targetSectionParts[0].name;
                setSelectedPart(firstPartName);
                console.log('Set default part to:', firstPartName, 'for section:', targetSectionName);
                console.log('QuestionsByPart for this section:', questionsByPartData[targetSectionName]);
              } else {
                setSelectedPart(null);
              }
              
              // Mark first question of TARGET section as visited (not first section)
              const targetSectionQuestions = questionsBySection[targetSectionName] || [];
              const firstQuestion = targetSectionQuestions[0];
              if (firstQuestion?._id) {
                setVisitedQuestions(prev => {
                  const newSet = new Set([...prev, firstQuestion._id]);
                  localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                  return newSet;
                });
              }
            }
            
            // Set timer from exam data or restore from localStorage
            // For RSCIT: Section A uses separate 15 min timer, Section B uses main 60 min timer
            if (data.data.exam.totalTime) {
              const examKey = data.data.exam.key || '';
              const currentSectionName = searchParams?.get('section') || data.data.sections?.[0]?.name || '';
              
              // Check if current section is a typing section (has typingTime)
              const currentSectionData = sortedSections.find(s => s.name === currentSectionName);
              const isTypingSec = currentSectionData && currentSectionData.typingTime;
              
              // For typing sections (like RSCIT Section A), don't set main timer here
              // The typing timer will be set in the useEffect that detects typing sections
              if (isTypingSec) {
                // Set main timer to 60 minutes for Section B (will be paused during Section A)
                setTimeLeft(data.data.exam.totalTime * 60); // 60 minutes for Section B
              } else {
                // For other sections or exams, use saved time or default
                const savedTimeLeft = localStorage.getItem('examTimeLeft');
                if (savedTimeLeft) {
                  const savedTime = parseInt(savedTimeLeft, 10);
                  // Only use saved time if it's valid and less than total time
                  if (savedTime > 0 && savedTime <= data.data.exam.totalTime * 60) {
                    setTimeLeft(savedTime);
                  } else {
                    setTimeLeft(data.data.exam.totalTime * 60);
                  }
                } else {
                  setTimeLeft(data.data.exam.totalTime * 60);
                }
              }
            }

            // Note: Typing section detection is now handled by a separate useEffect
            // that watches for section changes, so we don't need to set it here
            
            // Load completed sections from localStorage
            const savedCompletedSections = localStorage.getItem('completedSections');
            if (savedCompletedSections) {
              try {
                const completedArray = JSON.parse(savedCompletedSections);
                setCompletedSections(new Set(completedArray));
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
  }, [searchParams]);

  // Handle section change from URL parameter after sections are loaded
  // This ensures URL parameter always takes priority - FORCE update even if section appears same
  // CRITICAL: This useEffect MUST run and update the section from URL parameter
  useEffect(() => {
    if (sections.length > 0 && searchParams) {
      const sectionParam = searchParams.get('section');
      console.log('🔍 ========== URL PARAMETER CHECK ==========');
      console.log('🔍 Section parameter from URL:', sectionParam);
      console.log('🔍 Current section state:', section);
      console.log('🔍 Total sections available:', sections.length);
      
      if (sectionParam) {
        const decodedSectionParam = decodeURIComponent(sectionParam).trim();
        console.log('🔍 Decoded section parameter:', decodedSectionParam);
        console.log('🔍 Available sections:', sections.map((s, i) => `${i}: "${s.name}" (order: ${s.order || 0})`));
        
        // Sort sections by order first
        const sortedSections = [...sections].sort((a, b) => {
          const orderA = a.order || 0;
          const orderB = b.order || 0;
          if (orderA !== orderB) return orderA - orderB;
          const lessonA = a.lessonNumber || 0;
          const lessonB = b.lessonNumber || 0;
          return lessonA - lessonB;
        });
        
        // Try multiple matching strategies
        let foundSection = sortedSections.find(s => s.name === decodedSectionParam);
        
        if (!foundSection) {
          console.log('⚠️ Exact match failed, trying case-insensitive...');
          // Try case-insensitive match
          foundSection = sortedSections.find(s => 
            s.name.toLowerCase().trim() === decodedSectionParam.toLowerCase().trim()
          );
        }
        
        if (!foundSection) {
          console.log('⚠️ Case-insensitive match failed, trying without emojis...');
          // Try removing special characters/emojis for matching
          const cleanParam = decodedSectionParam.replace(/[🔒🔓]/g, '').trim();
          foundSection = sortedSections.find(s => {
            const cleanSectionName = s.name.replace(/[🔒🔓]/g, '').trim();
            return cleanSectionName === cleanParam || 
                   cleanSectionName.toLowerCase() === cleanParam.toLowerCase();
          });
        }
        
        if (foundSection) {
          // ALWAYS update section from URL parameter - even if it's the same
          console.log('✅ ========== FOUND SECTION FROM URL ==========');
          console.log('✅ Found section name:', foundSection.name);
          console.log('✅ Current section state:', section);
          console.log('✅ Will update section to:', foundSection.name);
          
          // CRITICAL: Force update - ALWAYS set the section from URL parameter
          // This ensures we're on the correct section after redirect from break page
          // Even if the section appears the same, we update it to ensure state is correct
          console.log('🔄 FORCING section update to:', foundSection.name);
          setSection(foundSection.name);
          setCurrentQuestionIndex(0);
          
          // Clear any cached section from localStorage to prevent conflicts
          localStorage.removeItem('currentSection');
          
          // Set first part for the new section
          const targetSectionParts = parts.filter(p => {
            const pSectionId = String(p.sectionId).trim();
            const secIdStr = String(foundSection.id).trim();
            const secIdObj = String(foundSection._id).trim();
            return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === foundSection._id.toString();
          }).sort((a, b) => (a.order || 0) - (b.order || 0));
          
          if (targetSectionParts.length > 0) {
            setSelectedPart(targetSectionParts[0].name);
            console.log('  - Set part to:', targetSectionParts[0].name);
          } else {
            setSelectedPart(null);
            console.log('  - No parts for this section');
          }
        } else {
          console.error('❌ ========== SECTION NOT FOUND ==========');
          console.error('❌ Section from URL parameter NOT FOUND:', decodedSectionParam);
          console.error('❌ Available sections:', sortedSections.map(s => s.name));
          console.error('❌ This should not happen - check section names match exactly');
        }
      } else {
        console.log('ℹ️ No section parameter in URL - will use default or current section');
        // If no section param, don't change section - keep current or use default from initial load
      }
    }
  }, [sections, parts, searchParams]); // Removed section from dependencies to prevent infinite loop

  // Detect typing sections when section changes and set up typing timer
  useEffect(() => {
    if (!section || sections.length === 0 || !examData) {
      return;
    }

    // Find current section data
    const currentSectionData = sections.find(s => s.name === section);
    
    // For RSCIT Section A: Use separate 15 min timer
    // For RSCIT Section B: Use main 60 min timer (fresh, not remaining from Section A)
    if (currentSectionData && currentSectionData.typingTime) {
      // This is a typing section - pause main timer and start typing timer
      console.log(`⏱️ Typing section detected: ${currentSectionData.name}, typing time: ${currentSectionData.typingTime} minutes`);
      setIsTypingSection(true);
      
      // Check if there's a saved typing time in localStorage
      const savedTypingTime = localStorage.getItem(`typingTimeLeft-${section}`);
      let typingTimeToSet;
      if (savedTypingTime) {
        const savedTime = parseInt(savedTypingTime, 10);
        if (savedTime > 0 && savedTime <= currentSectionData.typingTime * 60) {
          typingTimeToSet = savedTime;
          const m = Math.floor(typingTimeToSet / 60);
          const s = typingTimeToSet % 60;
          console.log(`⏱️ Restored typing time from localStorage: ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        } else {
          typingTimeToSet = currentSectionData.typingTime * 60;
          const m = Math.floor(typingTimeToSet / 60);
          const s = typingTimeToSet % 60;
          console.log(`⏱️ Invalid saved time, setting fresh typing time: ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        }
      } else {
        typingTimeToSet = currentSectionData.typingTime * 60;
        const m = Math.floor(typingTimeToSet / 60);
        const s = typingTimeToSet % 60;
        console.log(`⏱️ No saved time, setting fresh typing time: ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      }
      setTypingTimeLeft(typingTimeToSet);
      localStorage.setItem(`typingTimeLeft-${section}`, typingTimeToSet.toString());
      
      setIsMainTimerPaused(true);
      // Save current main timer time so we can resume it later
      // Use functional update to get the latest timeLeft value
      setTimeLeft(prev => {
        // Save the current time before pausing
        setPausedMainTime(prev);
        const m = Math.floor(prev / 60);
        const s = prev % 60;
        console.log(`⏱️ Main timer paused at: ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        return prev; // Keep the same time, timer is paused
      });
    } else {
      // This is a regular section - resume main timer if it was paused
      console.log(`Regular section: ${section}`);
      setIsTypingSection(false);
      setTypingTimeLeft(null);
      localStorage.removeItem(`typingTimeLeft-${section}`);
      setIsMainTimerPaused(false);
      
      // For RSCIT Section B: Set main timer to 60 minutes (don't add remaining time from Section A)
      if (examData?.key === 'RSCIT' && section === 'Section B') {
        // Section B gets fresh 60 minutes, not remaining time from Section A
        console.log('RSCIT Section B: Setting fresh 60 minutes timer');
        setTimeLeft(60 * 60); // 60 minutes for Section B
        localStorage.setItem('examTimeLeft', (60 * 60).toString());
        setPausedMainTime(null); // Clear paused time
      } else {
        // Resume main timer from where it was paused
        setPausedMainTime(prev => {
          if (prev !== null) {
            setTimeLeft(prev);
          }
          return null;
        });
      }
    }
  }, [section, sections, examData]);

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

  // Main Exam Timer - only runs when not paused and not in typing section
  useEffect(() => {
    if (isMainTimerPaused || isTypingSection) {
      return; // Don't run timer if paused or in typing section
    }
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          localStorage.removeItem('examTimeLeft'); // Clear timer when it reaches 0
          return 0;
        }
        const newTime = prev - 1;
        // Save remaining time to localStorage
        localStorage.setItem('examTimeLeft', newTime.toString());
        return newTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMainTimerPaused, isTypingSection]);

  // Typing Section Timer - separate timer for typing sections
  useEffect(() => {
    if (!isTypingSection || typingTimeLeft === null || typingTimeLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTypingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          localStorage.removeItem(`typingTimeLeft-${section}`);
          // Auto-submit section when typing time expires
          if (section) {
            console.log('⏰ Typing time expired, auto-submitting section:', section);
            // Use a small delay to ensure state is updated
            setTimeout(() => {
              handleSubmitSection();
            }, 500);
          }
          return 0;
        }
        const newTime = prev - 1;
        // Save typing time to localStorage
        localStorage.setItem(`typingTimeLeft-${section}`, newTime.toString());
        return newTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTypingSection, typingTimeLeft, section]);

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

  // Reset all answers and exam state
  const handleResetExam = () => {
    // Clear all answers
    setSelectedAnswers({});
    localStorage.removeItem('examAnswers');
    
    // Clear visited questions
    setVisitedQuestions(new Set());
    localStorage.removeItem('visitedQuestions');
    
    // Clear marked for review
    setMarkedForReview(new Set());
    localStorage.removeItem('markedForReview');
    
    // Reset current question index
    setCurrentQuestionIndex(0);
    
    // Reset completed sections (remove Section A)
    setCompletedSections(prev => {
      const newSet = new Set([...prev]);
      newSet.delete('Section A');
      localStorage.setItem('completedSections', JSON.stringify([...newSet]));
      return newSet;
    });
    
    // Reset timer for Section A (15 minutes)
    if (examData?.key === 'RSCIT' && section === 'Section A') {
      const currentSectionData = sections.find(s => s.name === 'Section A');
      if (currentSectionData && currentSectionData.typingTime) {
        const freshTime = currentSectionData.typingTime * 60;
        setTypingTimeLeft(freshTime);
        localStorage.setItem(`typingTimeLeft-Section A`, freshTime.toString());
      }
    }
    
    // Close modal
    setShowNotEligibleModal(false);
    setSectionAScore(0);
  };

  // Get current question based on section, part, and index
  const getCurrentQuestion = useCallback(() => {
    if (!section) return null;
    
    // If part is selected and section has parts, filter by part
    if (selectedPart && questionsByPart[section] && questionsByPart[section][selectedPart]) {
      const partQuestions = questionsByPart[section][selectedPart];
      if (partQuestions.length === 0) return null;
      return partQuestions[currentQuestionIndex] || partQuestions[0];
    }
    
    // Otherwise, use all questions in section (backward compatibility)
    const sectionQuestions = questions[section] || [];
    if (sectionQuestions.length === 0) {
      return null;
    }
    const question = sectionQuestions[currentQuestionIndex] || sectionQuestions[0];
    return question;
  }, [section, selectedPart, currentQuestionIndex, questions, questionsByPart]);
  
  // Get questions for current section and part
  // Use useMemo to prevent infinite loops - this was causing the re-render issue
  const currentQuestions = useMemo(() => {
    if (!section) {
      return [];
    }
    
    // If part is selected and section has parts, return part questions
    if (selectedPart && questionsByPart[section]) {
      if (questionsByPart[section][selectedPart]) {
        return questionsByPart[section][selectedPart];
      }
    }
    
    // Otherwise, return all questions in section
    return questions[section] || [];
  }, [section, selectedPart, questions, questionsByPart]);

  const currentQuestion = getCurrentQuestion();

  // Get parts for current section
  const getCurrentSectionParts = useCallback(() => {
    if (!section) return [];
    return parts.filter(p => {
      const pSectionId = String(p.sectionId).trim();
      const currentSec = sections.find(s => s.name === section);
      if (!currentSec) return false;
      const secIdStr = String(currentSec.id).trim();
      const secIdObj = String(currentSec._id).trim();
      return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === currentSec._id.toString();
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [section, parts, sections]);

  const currentSectionParts = getCurrentSectionParts();

  // Check if we're on the last question of current part
  const isLastQuestionInPart = useCallback(() => {
    if (!section || !selectedPart || !currentQuestions || currentQuestions.length === 0) return false;
    return currentQuestionIndex === currentQuestions.length - 1;
  }, [section, selectedPart, currentQuestions, currentQuestionIndex]);

  // Check if we're on the last part of current section
  const isLastPartInSection = useCallback(() => {
    if (!section || currentSectionParts.length === 0) return false;
    if (!selectedPart) return false;
    const currentPartIndex = currentSectionParts.findIndex(p => p.name === selectedPart);
    return currentPartIndex === currentSectionParts.length - 1;
  }, [section, selectedPart, currentSectionParts]);

  // Get next part in current section
  const getNextPart = useCallback(() => {
    if (!section || currentSectionParts.length === 0 || !selectedPart) return null;
    const currentPartIndex = currentSectionParts.findIndex(p => p.name === selectedPart);
    if (currentPartIndex < currentSectionParts.length - 1) {
      return currentSectionParts[currentPartIndex + 1];
    }
    return null;
  }, [section, selectedPart, currentSectionParts]);

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
    if (!section || !currentQuestions || sections.length === 0) return false;
    const currentSectionIndex = sections.findIndex(s => s.name === section);
    const isLastSection = currentSectionIndex === sections.length - 1;
    const isLastQuestionInSection = currentQuestionIndex === (currentQuestions.length || 0) - 1;
    // Also check if we're on last part of last section
    const isLastPart = isLastPartInSection();
    return isLastSection && isLastQuestionInSection && isLastPart;
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

  // Load completed sections from localStorage on mount and when section changes
  // This ensures completed sections persist and are never lost
  useEffect(() => {
    const savedCompletedSections = localStorage.getItem('completedSections');
    if (savedCompletedSections) {
      try {
        const completedArray = JSON.parse(savedCompletedSections);
        setCompletedSections(new Set(completedArray));
      } catch (e) {
        console.error('Error loading completed sections:', e);
      }
    }
  }, [section]); // Reload when section changes to ensure state is preserved

  // Sync completed sections to localStorage whenever they change
  // This ensures any programmatic changes are saved
  useEffect(() => {
    if (completedSections.size > 0) {
      localStorage.setItem('completedSections', JSON.stringify([...completedSections]));
    }
  }, [completedSections]);

  // Handle section submission
  const handleSubmitSection = () => {
    if (!section) {
      console.error('handleSubmitSection: No section selected');
      return;
    }
    
    console.log('handleSubmitSection called for section:', section);
    console.log('Current completedSections:', Array.from(completedSections));
    console.log('Available sections:', sections.map(s => s.name));

    // Check RSCIT eligibility: Section A requires minimum 12 marks to proceed to Section B
    if (examData?.key === 'RSCIT' && section === 'Section A') {
      const sectionAQuestions = questions['Section A'] || [];
      let calculatedScore = 0;
      sectionAQuestions.forEach(q => {
        const answer = selectedAnswers[q._id];
        if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
          calculatedScore += (q.marks || 2);
        }
      });
      
      if (calculatedScore < 12) {
        setSectionAScore(calculatedScore);
        setShowNotEligibleModal(true);
        return;
      }
    }
    
    // Prevent double submission - but still allow navigation to next section
    if (completedSections.has(section)) {
      console.log('⚠️ Section already completed, but allowing navigation to next section');
      // Even if already completed, allow moving to next section
      // Sort sections first to ensure correct order
      const sortedSections = [...sections].sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        const lessonA = a.lessonNumber || 0;
        const lessonB = b.lessonNumber || 0;
        return lessonA - lessonB;
      });
      
      const currentSectionIndex = sortedSections.findIndex(s => s.name === section);
      if (currentSectionIndex === -1) {
        console.error('❌ Current section not found in sorted sections');
        return;
      }
      
      if (currentSectionIndex < sortedSections.length - 1) {
        const nextSection = sortedSections[currentSectionIndex + 1];
        console.log('✅ Section already completed, moving to next section:', nextSection.name);
        localStorage.removeItem('currentSection');
        const encodedSection = encodeURIComponent(nextSection.name);
        const redirectUrl = `/exam/break?next=${encodeURIComponent('/exam_mode')}&section=${encodedSection}`;
        console.log('🚀 ========== REDIRECT (already completed section) ==========');
        console.log('🚀 Next section name:', nextSection.name);
        console.log('🚀 Encoded section:', encodedSection);
        console.log('🚀 Full redirect URL:', redirectUrl);
        setTimeout(() => {
          console.log('🚀 Executing redirect to:', redirectUrl);
          if (typeof window !== 'undefined') {
            window.location.href = redirectUrl;
          }
        }, 100);
      } else {
        // Last section, go to final result
        console.log('✅ Last section already completed, going to result page');
        localStorage.removeItem('examTimeLeft'); // Clear timer when exam is complete
        window.location.replace('/exam/exam-result');
      }
      return;
    }
    
    // Mark section as completed - this is permanent and cannot be undone
    setCompletedSections(prev => {
      const newSet = new Set([...prev, section]);
      // Immediately save to localStorage to persist
      localStorage.setItem('completedSections', JSON.stringify([...newSet]));
      console.log('Section marked as completed:', section);
      return newSet;
    });

    // ALWAYS redirect to result page first (with section parameter)
    // The result page will then redirect to break page → next section
    // NO VALIDATION - User can submit even if not all questions are answered
    // User can submit with empty answers and still move to next section
    setTimeout(() => {
      // Ensure the section is saved before redirect
      const finalCompletedSections = new Set([...completedSections, section]);
      localStorage.setItem('completedSections', JSON.stringify([...finalCompletedSections]));

      console.log('📊 ========== SECTION SUBMISSION ==========');
      console.log('📊 Current section being submitted:', section);
      console.log('📊 Redirecting to result page with section parameter');
      
      // Clear any section-related state from localStorage to ensure fresh load
      localStorage.removeItem('currentSection');
      
      // ALWAYS go to result page first with the current section parameter
      // The result page will handle showing the section results and then redirecting to break → next section
      const encodedSection = encodeURIComponent(section);
      const resultPageUrl = `/exam/exam-result?section=${encodedSection}`;
      
      console.log('🚀 ========== REDIRECTING TO RESULT PAGE ==========');
      console.log('🚀 Section being submitted:', section);
      console.log('🚀 Encoded section param:', encodedSection);
      console.log('🚀 Result page URL:', resultPageUrl);
      
      // Use window.location.href for reliable parameter passing
      if (typeof window !== 'undefined') {
        console.log('🚀 Setting window.location.href to result page:', resultPageUrl);
        window.location.href = resultPageUrl;
      } else {
        console.error('❌ window is undefined, cannot redirect!');
      }
    }, 100);
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
              {/* Parts Nav (Desktop Sidebar) - Show if current section has parts */}
              {currentSectionParts.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-gray-700 w-full">Parts:</span>
                    {currentSectionParts.map((part) => (
                      <button
                        key={part._id}
                        onClick={() => {
                          setSelectedPart(part.name);
                          setCurrentQuestionIndex(0);
                        }}
                        className={`${
                          selectedPart === part.name
                            ? "bg-blue-600 text-white"
                            : "bg-white text-blue-700 border border-gray-300"
                        } px-2 py-1 text-xs rounded`}
                      >
                        {part.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {currentQuestions && currentQuestions.length > 0 ? (
                  currentQuestions.map((q, i) => {
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
                {sections.map((sec, index) => {
                  const isCompleted = completedSections.has(sec.name);
                  const isCurrentSection = section === sec.name;
                  
                  // Check if this section can be accessed
                  const currentSectionIndex = sections.findIndex(s => s.name === section);
                  const thisSectionIndex = index;
                  const isPreviousSection = thisSectionIndex < currentSectionIndex;
                  const isNextSection = thisSectionIndex > currentSectionIndex;
                  const canAccess = isCurrentSection || 
                    (isNextSection && completedSections.has(section)) ||
                    (isPreviousSection && !isCompleted);
                  const isLocked = !canAccess;
                  
                  return (
                    <button
                      key={sec._id}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                        section === sec.name ? "bg-gray-200" : ""
                      } ${isCompleted ? "bg-green-50" : ""} ${isLocked ? "bg-gray-100 opacity-50" : ""}`}
                      onClick={() => {
                        // Prevent navigation to locked sections
                        if (isLocked || isCompleted) {
                          if (isCompleted) {
                            alert('This section is already completed and locked.');
                          } else {
                            alert('Please complete the current section before moving to the next section.');
                          }
                          return;
                        }

                        // Check RSCIT eligibility: Section B requires Section A with minimum 12 marks
                        if (examData?.key === 'RSCIT' && sec.name === 'Section B' && !completedSections.has('Section A')) {
                          alert('Please complete Section A first before attempting Section B.');
                          return;
                        }

                        // Check if Section A score >= 12 marks for RSCIT Section B
                        if (examData?.key === 'RSCIT' && sec.name === 'Section B') {
                          const sectionACompleted = completedSections.has('Section A');
                          if (!sectionACompleted) {
                            alert('Please complete Section A first before attempting Section B.');
                            return;
                          }
                          
                          // Check Section A score
                          const sectionAAnswers = JSON.parse(localStorage.getItem('examAnswers') || '{}');
                          const sectionAQuestions = questions['Section A'] || [];
                          let sectionAScore = 0;
                          sectionAQuestions.forEach(q => {
                            const answer = sectionAAnswers[q._id];
                            if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
                              sectionAScore += (q.marks || 2);
                            }
                          });
                          
                          if (sectionAScore < 12) {
                            alert(`You need minimum 12 marks in Section A to proceed to Section B. Your Section A score: ${sectionAScore} marks.`);
                            return;
                          }
                        }
                        // Save current timer state before switching sections
                        const currentTime = timeLeft;
                        localStorage.setItem('examTimeLeft', currentTime.toString());
                        setSection(sec.name);
                        setCurrentQuestionIndex(0);
                        setShowSectionDropdown(false);
                        // Reset selected part and set first part if available
                        const sectionParts = parts.filter(p => {
                          const pSectionId = String(p.sectionId).trim();
                          const secIdStr = String(sec.id).trim();
                          const secIdObj = String(sec._id).trim();
                          return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === sec._id.toString();
                        }).sort((a, b) => (a.order || 0) - (b.order || 0));
                        if (sectionParts.length > 0) {
                          setSelectedPart(sectionParts[0].name);
                        } else {
                          setSelectedPart(null);
                        }
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
                      disabled={isLocked || isCompleted}
                    >
                      <span>{sec.name}</span>
                      {isCompleted && (
                        <span className="text-green-600 font-bold">✓ Completed</span>
                      )}
                      {isLocked && !isCompleted && (
                        <span className="text-gray-500 font-bold">🔒 Locked</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end mt-2 gap-2">
            <button onClick={() => setIsSoundOn(!isSoundOn)} title={isSoundOn ? "Mute" : "Unmute"}>
              {isSoundOn ? "🔊" : "🔇"}
            </button>
            {isTypingSection && typingTimeLeft !== null ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-orange-600">⏱️ Section Timer:</span>
                  <b className="bg-orange-400 text-black px-3 py-1 rounded text-lg font-bold">{formatTime(typingTimeLeft)}</b>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">📊 Total Exam:</span>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{formatTime(timeLeft)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600">⏱️ Time Left:</span>
                <b className="bg-blue-400 text-black px-3 py-1 rounded text-lg font-bold">{formatTime(timeLeft)}</b>
              </div>
            )}
          </div>
        </div>

        {/* Section Nav (Desktop) */}
        <div className="hidden lg:flex flex-col border-b border-y-gray-200 bg-[#fff]">
          <div className="flex text-xs overflow-x-auto pl-8">
            {sections.map((sec, index) => {
              const isCompleted = completedSections.has(sec.name);
              const isCurrentSection = section === sec.name;
              
              // Check if this section can be accessed
              // Rules:
              // 1. Current section - always accessible
              // 2. Completed sections - locked, cannot access
              // 3. Previous sections that are not completed - cannot access
              // 4. Next section - only accessible if current section is completed
              const currentSectionIndex = sections.findIndex(s => s.name === section);
              const thisSectionIndex = index;
              const isPreviousSection = thisSectionIndex < currentSectionIndex;
              const isNextSection = thisSectionIndex > currentSectionIndex;
              const canAccess = isCurrentSection || 
                (isNextSection && completedSections.has(section)) ||
                (isPreviousSection && !isCompleted);
              const isLocked = !canAccess;
              
              return (
                <button
                  key={sec._id}
                  onClick={() => {
                    // Prevent navigation to locked sections
                    if (isLocked || isCompleted) {
                      if (isCompleted) {
                        alert('This section is already completed and locked.');
                      } else {
                        alert('Please complete the current section before moving to the next section.');
                      }
                      return;
                    }

                    // Check RSCIT eligibility: Section B requires Section A with minimum 12 marks
                    if (examData?.key === 'RSCIT' && sec.name === 'Section B' && !completedSections.has('Section A')) {
                      alert('Please complete Section A first before attempting Section B.');
                      return;
                    }

                    // Check if Section A score >= 12 marks for RSCIT Section B
                    if (examData?.key === 'RSCIT' && sec.name === 'Section B') {
                      const sectionACompleted = completedSections.has('Section A');
                      if (!sectionACompleted) {
                        alert('Please complete Section A first before attempting Section B.');
                        return;
                      }
                      
                      // Check Section A score
                      const sectionAAnswers = JSON.parse(localStorage.getItem('examAnswers') || '{}');
                      const sectionAQuestions = questions['Section A'] || [];
                      let sectionAScore = 0;
                      sectionAQuestions.forEach(q => {
                        const answer = sectionAAnswers[q._id];
                        if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
                          sectionAScore += (q.marks || 2);
                        }
                      });
                      
                      if (sectionAScore < 12) {
                        alert(`You need minimum 12 marks in Section A to proceed to Section B. Your Section A score: ${sectionAScore} marks.`);
                        return;
                      }
                    }
                    setSection(sec.name);
                    setCurrentQuestionIndex(0);
                    // Reset selected part and set first part if available
                    const sectionParts = parts.filter(p => {
                      const pSectionId = String(p.sectionId).trim();
                      const secIdStr = String(sec.id).trim();
                      const secIdObj = String(sec._id).trim();
                      return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === sec._id.toString();
                    }).sort((a, b) => (a.order || 0) - (b.order || 0));
                    if (sectionParts.length > 0) {
                      setSelectedPart(sectionParts[0].name);
                    } else {
                      setSelectedPart(null);
                    }
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
                    isCompleted
                      ? "bg-green-600 text-white border-green-700 cursor-not-allowed opacity-75"
                      : isLocked
                      ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-50"
                      : section === sec.name
                      ? "bg-[#290c52] text-white border-gray-300"
                      : "bg-white text-blue-700 border-r border-gray-300 px-4 hover:bg-gray-50"
                  } px-2 py-3 whitespace-nowrap relative`}
                  disabled={isLocked || isCompleted}
                  title={isCompleted ? "Section completed and locked" : isLocked ? "Complete current section first" : ""}
                >
                  {sec.name}
                  {isCompleted && (
                    <span className="ml-2 text-xs">✓</span>
                  )}
                  {isLocked && !isCompleted && (
                    <span className="ml-2 text-xs">🔒</span>
                  )}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
              <button onClick={() => setIsSoundOn(!isSoundOn)} title={isSoundOn ? "Mute" : "Unmute"}>
                {isSoundOn ? "🔊" : "🔇"}
              </button>
              {/* For RSCIT Section A: Show typing timer, for others show main timer */}
              {examData?.key === 'RSCIT' && section === 'Section A' && typingTimeLeft !== null ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-orange-600">⏱️ Section Timer:</span>
                    <b className="bg-orange-400 text-black px-3 py-1 rounded text-lg font-bold">{formatTime(typingTimeLeft)}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">📊 Total Exam:</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              ) : isTypingSection && typingTimeLeft !== null ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-orange-600">⏱️ Section Timer:</span>
                    <b className="bg-orange-400 text-black px-3 py-1 rounded text-lg font-bold">{formatTime(typingTimeLeft)}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">📊 Total Exam:</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-600">⏱️ Time Left:</span>
                  <b className="bg-blue-400 text-black px-3 py-1 rounded text-lg font-bold">{formatTime(timeLeft)}</b>
                </div>
              )}
            </div>
          </div>
          
          {/* Parts Nav (Desktop) - Show below sections if current section has parts */}
          {section && currentSectionParts.length > 0 && (
            <div className="flex text-xs overflow-x-auto border-t border-gray-200 bg-gray-50">
              <span className="px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">Parts:</span>
              {currentSectionParts.map((part) => (
                <button
                  key={part._id}
                  onClick={() => {
                    setSelectedPart(part.name);
                    setCurrentQuestionIndex(0);
                  }}
                  className={`${
                    selectedPart === part.name
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-gray-100 border-r border-gray-300"
                  } px-3 py-2 whitespace-nowrap`}
                >
                  {part.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {section && currentQuestions && currentQuestions.length > 0 && (
          <div className="flex gap-2 h-20 overflow-x-auto md:hidden ml-5">
            {currentQuestions.map((q, i) => {
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
    <span>Question Type: {currentQuestion?.questionType === "TYPING" ? "TYPING" : "MCQ"}</span>
    {currentQuestion?.questionType !== "TYPING" && (
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
    )}
  </div>

  {/* Scrollable Content */}
  <div className="border border-gray-300 rounded-b">
    {currentQuestion?.questionType !== "TYPING" && (
      <div className="bg-white-50 px-4 py-3 border-b text-sm font-semibold flex flex-col sm:flex-row justify-between">
        <span>Question No. {currentQuestionIndex + 1} {currentQuestions && `of ${currentQuestions.length}`}</span>
        <span className="mt-1 sm:mt-0">
          Marks for correct answer: {currentQuestion?.marks || 1} | Negative Marks: <span className="text-red-500">{currentQuestion?.negativeMarks || 0}</span>
        </span>
      </div>
    )}

    {loading ? (
      <div className="p-8 text-center">
        <p>Loading exam questions...</p>
      </div>
    ) : !currentQuestion ? (
      <div className="p-8 text-center">
        {section && currentSectionParts.length > 0 && selectedPart ? (
          <p>No questions available for part "{selectedPart}" in section "{section}". Please add questions to this part in the admin panel.</p>
        ) : (
          <p>No questions available for this section.</p>
        )}
      </div>
    ) : currentQuestion?.questionType === "TYPING" ? (
      // Typing Section UI
      <div className="p-4 md:p-6 overflow-hidden">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Typing Test - {section}</h2>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Language: {currentQuestion.typingLanguage}</li>
            {currentQuestion.typingLanguage === "Hindi" && (
              <li>• Script Type: {currentQuestion.typingScriptType || "Ramington Gail"}</li>
            )}
            <li>• Duration: {currentQuestion.typingDuration || 10} minutes</li>
            <li>• Backspace: {currentQuestion.typingBackspaceEnabled !== false ? 'Enabled' : 'Disabled'}</li>
            <li>• Type the text exactly as shown</li>
          </ul>
        </div>
        <div className="w-full overflow-hidden">
          <TypingArea
            content={
              currentQuestion.typingLanguage === "Hindi"
                ? (currentQuestion.typingScriptType === "Inscript" 
                    ? (currentQuestion.typingContent_hindi_inscript || currentQuestion.typingContent_hindi_ramington || "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है।")
                    : (currentQuestion.typingContent_hindi_ramington || "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है।"))
                : (currentQuestion.typingContent_english || "The quick brown fox jumps over the lazy dog. Practice typing to improve your speed and accuracy. This is a sample English typing test for RSCIT exam preparation. Type carefully and focus on accuracy. Speed will come with practice. Keep your fingers on the home row and maintain proper posture while typing.")
            }
          onComplete={(result) => {
            console.log("Typing test completed:", result);
            
            // Get the content that was supposed to be typed
            const correctContent = currentQuestion.typingLanguage === "Hindi"
              ? (currentQuestion.typingScriptType === "Inscript" 
                  ? (currentQuestion.typingContent_hindi_inscript || currentQuestion.typingContent_hindi_ramington || "")
                  : (currentQuestion.typingContent_hindi_ramington || ""))
              : (currentQuestion.typingContent_english || "");
            
            // Calculate errors in format "THGe [The]" - word by word comparison
            const errorStrings = [];
            const typedWords = result.typedText.trim().split(/\s+/).filter(w => w.length > 0);
            const correctWords = correctContent.trim().split(/\s+/).filter(w => w.length > 0);
            
            for (let i = 0; i < Math.min(typedWords.length, correctWords.length); i++) {
              if (typedWords[i] !== correctWords[i]) {
                errorStrings.push(`${typedWords[i]} [${correctWords[i]}]`);
              }
            }
            
            // Calculate CPCT metrics
            const timeInMinutes = result.timeTaken ? result.timeTaken / 60 : 15; // Default 15 minutes if not provided
            const correctWordsCount = typedWords.filter((w, i) => w === correctWords[i]).length;
            const netSpeed = timeInMinutes > 0 ? Math.round(correctWordsCount / timeInMinutes) : 0;
            
            // Determine remarks
            let remarks = "Fair";
            if (netSpeed >= 50) remarks = "Excellent";
            else if (netSpeed >= 40) remarks = "Very Good";
            else if (netSpeed >= 30) remarks = "Good";
            else if (netSpeed >= 20) remarks = "Fair";
            else remarks = "Poor";
            
            // Save typing result to localStorage (for CPCT exam results)
            const typingResultKey = currentQuestion.typingLanguage === "English" 
              ? 'englishTypingResult' 
              : 'hindiTypingResult';
            
            const typingResult = {
              typedText: result.typedText,
              mistakes: result.mistakes,
              backspaceCount: result.backspaceCount,
              wpm: result.wpm || 0,
              accuracy: result.accuracy || 100,
              netSpeed: netSpeed,
              errors: errorStrings,
              remarks: remarks,
              timeTaken: result.timeTaken || (timeInMinutes * 60)
            };
            
            localStorage.setItem(typingResultKey, JSON.stringify(typingResult));
            console.log(`Saved ${currentQuestion.typingLanguage} typing result to localStorage:`, typingResult);
            
            // Save typing result to selectedAnswers
            setSelectedAnswers(prev => ({
              ...prev,
              [currentQuestion._id]: {
                type: "TYPING",
                typedText: result.typedText,
                mistakes: result.mistakes,
                backspaceCount: result.backspaceCount,
                wpm: result.wpm || 0,
                accuracy: result.accuracy || 0,
                errors: errorStrings,
                netSpeed: netSpeed,
                remarks: remarks
              }
            }));
            
            // Auto-submit section after typing is complete
            setTimeout(() => {
              handleSubmitSection();
            }, 2000);
          }}
          onProgress={(progressStats) => {
            // Save progress to localStorage for persistence
            const progressData = {
              questionId: currentQuestion._id,
              ...progressStats
            };
            localStorage.setItem(`typingProgress_${currentQuestion._id}`, JSON.stringify(progressData));
          }}
          showTimer={false}
          duration={currentQuestion.typingDuration || 10}
          allowBackspace={currentQuestion.typingBackspaceEnabled !== false}
          language={currentQuestion.typingLanguage || "English"}
          scriptType={currentQuestion.typingLanguage === "Hindi" ? (currentQuestion.typingScriptType || "Ramington Gail") : null}
          mode="word"
        />
        </div>
      </div>
    ) : (
      <>

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
                let questionText = viewLanguage === "हिन्दी" && currentQuestion?.question_hi 
                  ? currentQuestion.question_hi 
                  : currentQuestion?.question_en || currentQuestion?.question_hi || 'No question text available';
                // Remove patterns like "(Question 57)", "(Question X)" from question text
                questionText = questionText.replace(/\s*\(Question\s+\d+\)/gi, '').trim();
                return (
                  <p className="mb-4">
                    {questionText}
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
                let questionText = viewLanguage === "हिन्दी" && currentQuestion?.question_hi 
                  ? currentQuestion.question_hi 
                  : currentQuestion?.question_en || currentQuestion?.question_hi || 'No question text available';
                // Remove patterns like "(Question 57)", "(Question X)" from question text
                questionText = questionText.replace(/\s*\(Question\s+\d+\)/gi, '').trim();
                return (
                  <p className="mb-4">
                    {questionText}
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
                
                // Check if we're on last question of last part of current section
                if (isLastQuestionInPart() && isLastPartInSection()) {
                  // On last question of last part in current section, submit section
                  // handleSubmitSection() will check if it's the last section and redirect to result page,
                  // otherwise it will go to break page and then next section
                  handleSubmitSection();
                } else if (isLastQuestionInPart()) {
                  // On last question of current part, move to next part
                  const nextPart = getNextPart();
                  if (nextPart) {
                    setSelectedPart(nextPart.name);
                    setCurrentQuestionIndex(0);
                    // Mark first question of next part as visited
                    const nextPartQuestions = questionsByPart[section]?.[nextPart.name] || [];
                    if (nextPartQuestions.length > 0 && nextPartQuestions[0]?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, nextPartQuestions[0]._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  }
                } else {
                  // Mark for review and move to next question in current part
                  if (currentQuestion && currentQuestions && currentQuestionIndex < currentQuestions.length - 1) {
                    const nextIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextIndex);
                    // Mark next question as visited
                    const nextQuestion = currentQuestions[nextIndex];
                    if (nextQuestion?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, nextQuestion._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  }
                }
              }}
            >
              {isLastQuestion() ? "Mark for Review & Submit" : (isLastQuestionInPart() && isLastPartInSection() ? "Mark for Review & Submit Section" : "Mark for Review & Next")}
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
                // Save current answer first - ensure it's saved
                if (currentQuestion) {
                  // Answer is already saved in selectedAnswers state via onChange handlers
                  console.log('Save & Submit clicked - Current question:', currentQuestion._id);
                }
                
                // Check if we're on last question of last part in current section
                const isLastInSection = isLastQuestionInPart() && isLastPartInSection();
                const isLastOverall = isLastQuestion();
                
                console.log('Button click - isLastInSection:', isLastInSection, 'isLastOverall:', isLastOverall);
                console.log('Button click - isLastQuestionInPart:', isLastQuestionInPart(), 'isLastPartInSection:', isLastPartInSection());
                console.log('Button click - currentQuestionIndex:', currentQuestionIndex, 'currentQuestions.length:', currentQuestions?.length);
                
                if (isLastOverall || isLastInSection) {
                  // On last question of last part in current section, submit section
                  console.log('Submitting section:', section);
                  handleSubmitSection();
                } else if (isLastQuestionInPart()) {
                  // On last question of current part, move to next part
                  const nextPart = getNextPart();
                  if (nextPart) {
                    console.log('Moving to next part:', nextPart.name);
                    setSelectedPart(nextPart.name);
                    setCurrentQuestionIndex(0);
                    // Mark first question of next part as visited
                    const nextPartQuestions = questionsByPart[section]?.[nextPart.name] || [];
                    if (nextPartQuestions.length > 0 && nextPartQuestions[0]?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, nextPartQuestions[0]._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  } else {
                    console.warn('No next part found, but isLastQuestionInPart is true');
                  }
                } else {
                  // Save answer and move to next question in current part
                  if (currentQuestion && currentQuestions && currentQuestionIndex < currentQuestions.length - 1) {
                    const nextIndex = currentQuestionIndex + 1;
                    console.log('Moving to next question:', nextIndex);
                    setCurrentQuestionIndex(nextIndex);
                    // Mark next question as visited
                    const nextQuestion = currentQuestions[nextIndex];
                    if (nextQuestion?._id) {
                      setVisitedQuestions(prev => {
                        const newSet = new Set([...prev, nextQuestion._id]);
                        localStorage.setItem('visitedQuestions', JSON.stringify([...newSet]));
                        return newSet;
                      });
                    }
                  } else {
                    console.warn('Cannot move to next question - invalid state');
                  }
                }
              }}
            >
              {isLastQuestion() || (isLastQuestionInPart() && isLastPartInSection()) ? "Save & Submit Section" : "Save & Next"}
            </button>
          </div>
          <button 
            onClick={handleSubmitSection}
            className="bg-green-800 hover:bg-cyan-700 text-white px-12 py-2 ml-2 text-[13px] rounded w-full md:hidden"
          >
            Submit Section
          </button>

        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-full lg:w-60 bg-blue-50 border-l shadow-lg max-h-[100vh] overflow-y-auto sticky top-0 mt-3">
        <div className="p-4 text-sm h-full">
          {/* Timer Display in Sidebar */}
          <div className="bg-white rounded-lg p-3 mb-4 border-2 border-orange-300 shadow-md">
            {isTypingSection && typingTimeLeft !== null ? (
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-xs font-semibold text-orange-600 mb-1">⏱️ Section Timer (Active)</div>
                  <div className="text-2xl font-bold bg-orange-400 text-black px-4 py-2 rounded">{formatTime(typingTimeLeft)}</div>
                </div>
                <div className="border-t pt-2 text-center">
                  <div className="text-xs text-gray-500 mb-1">📊 Total Exam Time</div>
                  <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded">{formatTime(timeLeft)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-xs font-semibold text-blue-600 mb-1">⏱️ Exam Timer</div>
                <div className="text-2xl font-bold bg-blue-400 text-black px-4 py-2 rounded">{formatTime(timeLeft)}</div>
              </div>
            )}
          </div>
          
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
              {/* Parts Nav (Mobile) - Show if current section has parts */}
              {currentSectionParts.length > 0 && (
                <div className="mb-3">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Parts:</span>
                    {currentSectionParts.map((part) => (
                      <button
                        key={part._id}
                        onClick={() => {
                          setSelectedPart(part.name);
                          setCurrentQuestionIndex(0);
                        }}
                        className={`${
                          selectedPart === part.name
                            ? "bg-blue-600 text-white"
                            : "bg-white text-blue-700 border border-gray-300"
                        } px-3 py-1 text-xs rounded whitespace-nowrap`}
                      >
                        {part.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {currentQuestions && currentQuestions.length > 0 ? (
                  currentQuestions.map((q, i) => {
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
            className="bg-green-800 hover:bg-cyan-700 text-white px-12 py-2 ml-2 mt-[-4] text-[13px] rounded"
          >
            Submit Section
          </button>
        </div>
      </div>

      {/* Not Eligible Modal */}
      {showNotEligibleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Sorry, Not Eligible</h2>
              <p className="text-gray-600 mb-2">
                You need minimum 12 marks in Section A to proceed to Section B.
              </p>
              <p className="text-gray-600 mb-6">
                Your current score: <span className="font-bold text-red-600">{sectionAScore} marks</span>
              </p>
              <p className="text-gray-700 font-semibold mb-6">
                Try again with fresh attempt?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowNotEligibleModal(false);
                    setSectionAScore(0);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  No
                </button>
                <button
                  onClick={handleResetExam}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CPCTPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
      </div>
    }>
      <ExamModeContent />
    </Suspense>
  );
}