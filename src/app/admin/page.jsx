"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import HindiTextarea from "@/components/typing/HindiTextarea";

export default function AdminPanel() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [sections, setSections] = useState([]);
  const [parts, setParts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('exams');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCPCTImport, setShowCPCTImport] = useState(false);
  const [cccBulkImportText, setCccBulkImportText] = useState('');
  const [cccBulkImportExamId, setCccBulkImportExamId] = useState('');
  const [cccBulkImporting, setCccBulkImporting] = useState(false);
  const [cccQuestionBankText, setCccQuestionBankText] = useState('');
  const [cccQuestionBankImporting, setCccQuestionBankImporting] = useState(false);
  const [cccDistributing, setCccDistributing] = useState(false);
  const [cccClearing, setCccClearing] = useState(false);
  const [rscitSectionAText, setRscitSectionAText] = useState('');
  const [rscitSectionBText, setRscitSectionBText] = useState('');
  const [rscitSectionAImporting, setRscitSectionAImporting] = useState(false);
  const [rscitSectionBImporting, setRscitSectionBImporting] = useState(false);
  const [rscitDistributing, setRscitDistributing] = useState(false);
  const [rscitClearing, setRscitClearing] = useState(false);
  const [cpctMcqClearing, setCpctMcqClearing] = useState(false);
  const [cpctTypingExamId, setCpctTypingExamId] = useState('');
  const [cpctEnglishTypingContent, setCpctEnglishTypingContent] = useState('');
  const [cpctHindiTypingContent, setCpctHindiTypingContent] = useState('');
  const [cpctTypingSaving, setCpctTypingSaving] = useState(false);
  const [cpctPdfExamId, setCpctPdfExamId] = useState('');
  const [cpctPdfFile, setCpctPdfFile] = useState(null);
  const [cpctPdfUploading, setCpctPdfUploading] = useState(false);
  const [cpctPdfPaperName, setCpctPdfPaperName] = useState('');
  const [cpctTextExamId, setCpctTextExamId] = useState('');
  const [cpctTextPartId, setCpctTextPartId] = useState('');
  const [cpctTextPaperName, setCpctTextPaperName] = useState('');
  const [cpctTextQuestions, setCpctTextQuestions] = useState('');
  const [cpctTextImporting, setCpctTextImporting] = useState(false);
  const [cpctTextParts, setCpctTextParts] = useState([]);
  const [cpctSelectedPart, setCpctSelectedPart] = useState('IT SKILLS'); // Default to first part
  const [cpctQuestionBankText, setCpctQuestionBankText] = useState('');
  const [cpctQuestionBankImporting, setCpctQuestionBankImporting] = useState(false);
  const [cpctDistributing, setCpctDistributing] = useState(false);
  const [cpctClearing, setCpctClearing] = useState(false);
  const [cpctAvailablePartNames, setCpctAvailablePartNames] = useState([]);
  const [cpctTotalQuestionsInBank, setCpctTotalQuestionsInBank] = useState(0);
  const [bulkReadingComprehensionText, setBulkReadingComprehensionText] = useState('');
  const [bulkReadingComprehensionImporting, setBulkReadingComprehensionImporting] = useState(false);
  const [autoImporting, setAutoImporting] = useState(false);
  const [examTypes, setExamTypes] = useState([]);
  const [examTypesLoading, setExamTypesLoading] = useState(false);
  const [showExamTypeForm, setShowExamTypeForm] = useState(false);
  const [editingExamType, setEditingExamType] = useState(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role !== "admin") {
            router.push("/admin/login");
            return;
          }
        } else {
          router.push("/admin/login");
          return;
        }
      } catch (err) {
        router.push("/admin/login");
        return;
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAdminAuth();
  }, [router]);

  useEffect(() => { 
    if (!isCheckingAuth) {
      fetchExams();
      fetchCpctPartNames();
      fetchExamTypes();
    }
  }, [isCheckingAuth]);

  const fetchExamTypes = async () => {
    setExamTypesLoading(true);
    try {
      const res = await fetch("/api/admin/exam-types", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setExamTypes(data.examTypes || []);
      }
    } catch (e) {
      console.error("Error fetching exam types:", e);
    } finally {
      setExamTypesLoading(false);
    }
  };

  const fetchCpctPartNames = async () => {
    try {
      const res = await fetch('/api/admin/get-cpct-part-names', {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setCpctAvailablePartNames(data.partNames || []);
        setCpctTotalQuestionsInBank(data.totalQuestions || 0);
        return data; // Return data so we can use it immediately
      }
    } catch (error) {
      console.error('Error fetching CPCT part names:', error);
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/admin/login");
    }
  };

  const fetchExams = async () => {
    const res = await fetch('/api/admin/exams');
    const data = await res.json();
    const examList = data.exams || [];
    
    // Sort by extracting number from title (e.g., "CPCT Exam 1" -> 1, "CPCT Exam 15" -> 15)
    const sortedExams = examList.sort((a, b) => {
      const getExamNumber = (title) => {
        const match = (title || '').match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      const numA = getExamNumber(a.title || '');
      const numB = getExamNumber(b.title || '');
      // If numbers are equal or both 0, sort by title
      if (numA === numB) {
        return (a.title || '').localeCompare(b.title || '');
      }
      return numA - numB; // Ascending order: 1, 2, 3... 15
    });
    
    setExams(sortedExams);
  };

  const fetchSections = async (examId) => {
    const res = await fetch(`/api/admin/sections?examId=${examId}`);
    const data = await res.json();
    setSections(data.sections || []);
  };

  const fetchParts = async (examId, sectionId) => {
    const url = new URL(window.location.origin + '/api/admin/parts');
    if (examId) url.searchParams.set('examId', examId);
    if (sectionId) url.searchParams.set('sectionId', sectionId);
    const res = await fetch(url.toString());
    const data = await res.json();
    setParts(data.parts || []);
  };

  const loadExistingTypingContent = async (examId) => {
    try {
      // Fetch sections to get Section B and Section C
      const sectionsRes = await fetch(`/api/admin/sections?examId=${examId}`);
      const sectionsData = await sectionsRes.json();
      const sections = sectionsData.sections || [];
      
      const sectionB = sections.find(s => s.name === 'Section B');
      const sectionC = sections.find(s => s.name === 'Section C');
      
      if (sectionB) {
        // Fetch English typing question
        const questionsRes = await fetch(`/api/admin/questions?examId=${examId}&sectionId=${sectionB._id}`);
        const questionsData = await questionsRes.json();
        const englishQuestion = questionsData.questions?.find(q => q.questionType === 'TYPING' && q.typingLanguage === 'English');
        if (englishQuestion) {
          setCpctEnglishTypingContent(englishQuestion.typingContent_english || '');
        }
      }
      
      if (sectionC) {
        // Fetch Hindi typing question
        const questionsRes = await fetch(`/api/admin/questions?examId=${examId}&sectionId=${sectionC._id}`);
        const questionsData = await questionsRes.json();
        const hindiQuestion = questionsData.questions?.find(q => q.questionType === 'TYPING' && q.typingLanguage === 'Hindi');
        if (hindiQuestion) {
          // Prefer Ramington, fallback to Inscript
          setCpctHindiTypingContent(hindiQuestion.typingContent_hindi_ramington || hindiQuestion.typingContent_hindi_inscript || '');
        }
      }
    } catch (error) {
      console.error('Error loading existing typing content:', error);
    }
  };

  const fetchQuestions = async (examId, sectionId, partId) => {
    const url = new URL(window.location.origin + '/api/admin/questions');
    if (examId) url.searchParams.set('examId', examId);
    if (sectionId) url.searchParams.set('sectionId', sectionId);
    if (partId) url.searchParams.set('partId', partId);
    const res = await fetch(url.toString());
    const data = await res.json();
    console.log('📥 Fetched questions:', data.questions?.length || 0);
    // Log imageUrl for each question
    data.questions?.forEach((q, idx) => {
      const imageUrlValue = q.imageUrl;
      // Handle both null and undefined (JSON converts undefined to null)
      const hasImageUrl = imageUrlValue !== null && imageUrlValue !== undefined && imageUrlValue !== '';
      
      console.log(`  Question ${idx + 1} (${q._id}):`, {
        question_en: q.question_en?.substring(0, 30),
        imageUrl: imageUrlValue, // Can be string, null, or undefined
        imageUrlType: typeof imageUrlValue,
        imageUrlIsUndefined: imageUrlValue === undefined,
        imageUrlIsNull: imageUrlValue === null,
        imageUrlIsEmptyString: imageUrlValue === '',
        hasImageUrl: hasImageUrl,
        allKeys: Object.keys(q)
      });
      
      // Warn if image question has no imageUrl
      if (q.question_en === '[Image Question]' && !hasImageUrl) {
        console.warn(`  ⚠️ WARNING: Question ${idx + 1} is an image question but has no imageUrl!`);
      }
    });
    setQuestions(data.questions || []);
  };

  const handleSaveExam = async (formData) => {
    setSaving(true);
    try {
      const method = editingExam ? 'PUT' : 'POST';
      const body = {
        title: formData.title, 
        key: formData.key, 
        totalTime: parseInt(formData.totalTime) || 75, 
        totalQuestions: parseInt(formData.totalQuestions) || 75,
        isFree: formData.isFree === true || formData.isFree === 'true'
      };
      if (editingExam) {
        body._id = editingExam._id;
      }
      
      const res = await fetch('/api/admin/exams', { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body)
      });
      if (res.ok) {
        await fetchExams();
        setShowExamForm(false);
        setEditingExam(null);
        // Clear selection if we deleted the selected exam
        if (editingExam && selectedExam === editingExam._id) {
          setSelectedExam(null);
          setSections([]);
          setParts([]);
          setQuestions([]);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save exam');
      }
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all sections, parts, and questions associated with it.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/exams?_id=${examId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchExams();
        // Clear selection if we deleted the selected exam
        if (selectedExam === examId) {
          setSelectedExam(null);
          setSections([]);
          setParts([]);
          setQuestions([]);
        }
        alert('Exam deleted successfully');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete exam');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam: ' + error.message);
    }
  };

  const handleSaveSection = async (formData) => {
    if (!selectedExam) {
      alert('Please select an exam first');
      return;
    }
    setSaving(true);
    try {
      // Generate a unique ID from the section name (lowercase, replace spaces with hyphens)
      const sectionId = formData.id || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Get current sections count for default values
      const currentSectionsCount = sections.length;
      
      // Calculate order - should be higher than existing sections so new section appears at bottom
      const maxOrder = sections.length > 0 
        ? Math.max(...sections.map(s => s.order || 0)) 
        : 0;
      const newOrder = maxOrder + 1;
      
      const res = await fetch('/api/admin/sections', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          examId: selectedExam, 
          name: formData.name,
          id: sectionId,
          lessonNumber: parseInt(formData.lessonNumber) || currentSectionsCount + 1,
          order: parseInt(formData.order) || newOrder,
          typingTime: formData.typingTime ? parseInt(formData.typingTime) : null
        })
      });
      
      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        alert(`Error creating section: Server returned invalid response (${res.status} ${res.statusText})`);
        return;
      }
      
      if (res.ok) {
        await fetchSections(selectedExam);
        setShowSectionForm(false);
      } else {
        alert(`Error creating section: ${data.error || 'Unknown error'}`);
        console.error('Section creation error:', data);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert(`Error creating section: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePart = async (formData) => {
    if (!selectedExam || !selectedSection) {
      alert('Please select an exam and section first');
      return;
    }
    setSaving(true);
    try {
      // Generate a unique ID from the part name
      const partId = formData.id || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Get current parts count for default values
      const currentPartsCount = parts.length;
      
      const res = await fetch('/api/admin/parts', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          examId: selectedExam,
          sectionId: selectedSection,
          name: formData.name,
          id: partId,
          order: parseInt(formData.order) || currentPartsCount
        })
      });
      
      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        alert(`Error creating part: Server returned invalid response (${res.status} ${res.statusText})`);
        return;
      }
      
      if (res.ok) {
        await fetchParts(selectedExam, selectedSection);
        setShowPartForm(false);
      } else {
        alert(`Error creating part: ${data.error || 'Unknown error'}`);
        console.error('Part creation error:', data);
      }
    } catch (error) {
      console.error('Error saving part:', error);
      alert(`Error creating part: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestion = async (formData) => {
    if (!selectedExam || !selectedSection || !selectedPart) {
      alert('Please select an exam, section, and part first');
      return;
    }
    setSaving(true);
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const questionId = editingQuestion?.id || `${selectedExam}-${selectedSection}-${timestamp}-${random}`;
      
      const body = { 
        id: questionId,
        examId: selectedExam, 
        sectionId: selectedSection,
        partId: selectedPart,
        questionType: formData.questionType || 'MCQ',
        isFree: formData.isFree === true || formData.isFree === 'true'
      };

      // Log formData before building body
      console.log('🔍 DEBUG: formData before save:', {
        useImageForQuestion: formData.useImageForQuestion,
        imageUrl: formData.imageUrl,
        imageUrl_type: typeof formData.imageUrl,
        imageUrl_length: formData.imageUrl?.length,
        imageUrl_isEmpty: !formData.imageUrl || formData.imageUrl.trim() === '',
        question: formData.question,
        questionType: formData.questionType,
        allFormDataKeys: Object.keys(formData),
        fullFormData: JSON.parse(JSON.stringify(formData)) // Deep copy to see actual values
      });
      
      // Add fields based on question type
      if (formData.questionType === 'MCQ') {
        const options = formData.options.split(',').map(s => s.trim()).filter(s => s);
        const options_hi = formData.options_hi ? formData.options_hi.split(',').map(s => s.trim()).filter(s => s) : [];
        
        // Handle text vs image question
        if (formData.useImageForQuestion) {
          // Image question - require imageUrl
          console.log('🔍 DEBUG: Checking imageUrl before save:', {
            formData_imageUrl: formData.imageUrl,
            formData_imageUrl_type: typeof formData.imageUrl,
            formData_imageUrl_length: formData.imageUrl?.length,
            formData_useImageForQuestion: formData.useImageForQuestion,
            formData_keys: Object.keys(formData)
          });
          
          if (!formData.imageUrl || formData.imageUrl.trim() === '') {
            alert('Please upload an image for the image question before saving.\n\nIf this question was previously an image question, you need to upload a new image.');
            setSaving(false);
            return;
          }
          // Image question - save imageUrl and set placeholder text
          body.question_en = '[Image Question]';
          body.question_hi = '';
          
          // CRITICAL: Ensure imageUrl is included
          const imageUrlToSave = formData.imageUrl ? formData.imageUrl.trim() : '';
          if (!imageUrlToSave) {
            console.error('❌ ERROR: formData.imageUrl is empty!', {
              formData_imageUrl: formData.imageUrl,
              formData_imageUrl_type: typeof formData.imageUrl,
              formData_keys: Object.keys(formData)
            });
            alert('ERROR: Image URL is missing! Please upload the image again and try saving.');
            setSaving(false);
            return;
          }
          
          body.imageUrl = imageUrlToSave;
          // Add imageWidth and imageHeight if provided
          if (formData.imageWidth && formData.imageWidth.trim() !== '') {
            body.imageWidth = parseInt(formData.imageWidth) || undefined;
          }
          if (formData.imageHeight && formData.imageHeight.trim() !== '') {
            body.imageHeight = parseInt(formData.imageHeight) || undefined;
          }
          console.log('💾 Saving image question with imageUrl:', body.imageUrl);
          console.log('💾 Image dimensions:', { width: body.imageWidth, height: body.imageHeight });
          console.log('💾 Full body being saved:', JSON.stringify(body, null, 2));
          console.log('💾 body.imageUrl value:', body.imageUrl);
          console.log('💾 body.imageUrl type:', typeof body.imageUrl);
          console.log('💾 body keys:', Object.keys(body));
          console.log('💾 body has imageUrl?', 'imageUrl' in body);
        } else {
          // Text question - save text
          body.question_en = formData.question || '';
          body.question_hi = formData.question_hi || '';
          // Only clear imageUrl if we're NOT editing an existing image question
          // If editing and question already has imageUrl, preserve it unless explicitly removed
          if (editingQuestion && editingQuestion.imageUrl && editingQuestion.imageUrl.trim() !== '') {
            // Preserve existing imageUrl when converting from image to text question
            // Or clear it if user explicitly wants to remove it
            body.imageUrl = formData.imageUrl || ''; // Use formData value (might be empty if user removed it)
            // Also preserve imageWidth and imageHeight if imageUrl exists
            if (formData.imageUrl && formData.imageUrl.trim() !== '') {
              if (formData.imageWidth && formData.imageWidth.trim() !== '') {
                body.imageWidth = parseInt(formData.imageWidth) || undefined;
              }
              if (formData.imageHeight && formData.imageHeight.trim() !== '') {
                body.imageHeight = parseInt(formData.imageHeight) || undefined;
              }
            }
          } else if (formData.imageUrl && formData.imageUrl.trim() !== '') {
            // Optional image for text question
            body.imageUrl = formData.imageUrl.trim();
            if (formData.imageWidth && formData.imageWidth.trim() !== '') {
              body.imageWidth = parseInt(formData.imageWidth) || undefined;
            }
            if (formData.imageHeight && formData.imageHeight.trim() !== '') {
              body.imageHeight = parseInt(formData.imageHeight) || undefined;
            }
          } else {
            body.imageUrl = '';
          }
        }
        
        body.options_en = options;
        body.options_hi = options_hi;
        body.correctAnswer = parseInt(formData.correctAnswer) || 0;
        body.marks = parseInt(formData.marks) || 1;
        body.negativeMarks = parseFloat(formData.negativeMarks) || 0;
        body.solutionVideoLink = formData.solutionVideoLink?.trim() || '';
        body.explanation_en = formData.explanation_en?.trim() || '';
        body.explanation_hi = formData.explanation_hi?.trim() || '';
      } else if (formData.questionType === 'TYPING') {
        body.typingLanguage = formData.typingLanguage || 'English';
        body.typingScriptType = formData.typingScriptType || '';
        body.typingContent_english = formData.typingContent_english || '';
        body.typingContent_hindi_ramington = formData.typingContent_hindi_ramington || '';
        body.typingContent_hindi_inscript = formData.typingContent_hindi_inscript || '';
        body.typingDuration = parseInt(formData.typingDuration) || 5;
        body.typingBackspaceEnabled = formData.typingBackspaceEnabled === true || formData.typingBackspaceEnabled === 'true';
      }

      if (editingQuestion) {
        body._id = editingQuestion._id;
        console.log('✏️ Editing question with _id:', editingQuestion._id);
        console.log('✏️ Editing question current imageUrl:', editingQuestion.imageUrl);
      } else {
        console.log('➕ Creating new question');
      }
      
      // Final check before sending
      console.log('🚀 About to send request:', {
        method: method,
        body_keys: Object.keys(body),
        body_imageUrl: body.imageUrl,
        body_imageUrl_type: typeof body.imageUrl,
        body_stringified: JSON.stringify(body)
      });
      
      const res = await fetch('/api/admin/questions', { 
        method: method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ Question saved successfully. Response:', data);
        if (data.question) {
          console.log('✅ Saved question imageUrl:', data.question.imageUrl);
        }
        await fetchQuestions(selectedExam, selectedSection, selectedPart);
        setShowQuestionForm(false);
        setEditingQuestion(null); // Clear editing state
      } else {
        alert(`Error ${editingQuestion ? 'updating' : 'creating'} question: ${data.error || 'Unknown error'}`);
        console.error('Question save error:', data);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert(`Error creating question: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleFreeStatus = async (questionId, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await fetch(`/api/admin/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFree: newStatus })
    });
    if (res.ok) fetchQuestions(selectedExam, selectedSection, selectedPart);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#290c52] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Logout
        </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => setActiveTab('exams')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='exams'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Exams
            </button>
            <button 
              onClick={() => setActiveTab('examTypes')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='examTypes'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Exam Types
            </button>
            <button 
              onClick={() => setActiveTab('learning')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='learning'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Learning
            </button>
            <button 
              onClick={() => setActiveTab('skill')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='skill'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Skill Test
            </button>
            <button 
              onClick={() => setActiveTab('subscriptions')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='subscriptions'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Subscriptions
            </button>
            <button 
              onClick={() => setActiveTab('downloads')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='downloads'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Downloads
            </button>
            <button 
              onClick={() => setActiveTab('topicwise')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='topicwise'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Topic Wise MCQ
            </button>
            <button 
              onClick={() => setActiveTab('pricing')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='pricing'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pricing
            </button>
            <button 
              onClick={() => setActiveTab('tips')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='tips'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tips
            </button>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='users'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Users
            </button>
            <button 
              onClick={() => setActiveTab('backspace')} 
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab==='backspace'
                  ? 'bg-[#290c52] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Backspace Control
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

      {activeTab==='exams' && (
        <>
          {/* CPCT PDF Upload and Import - MOVED TO TOP */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-900 mb-3 font-bold">
              <strong>📄 Upload CPCT Exam PDF:</strong>
            </p>
            <p className="text-xs text-green-700 mb-3">
              Upload a CPCT exam PDF file (e.g., 21th_Nov_2025_QP_Shift2.pdf). The system will automatically extract all questions and typing content.
              <br />Existing questions will be updated, new questions will be created.
            </p>
            
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select CPCT Exam:</label>
                <select
                  value={cpctPdfExamId}
                  onChange={(e) => setCpctPdfExamId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="">-- Select Exam --</option>
                  {exams.filter(e => e.key === 'CPCT').map(exam => (
                    <option key={exam._id} value={exam._id}>{exam.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Name (Optional):</label>
                <input
                  type="text"
                  value={cpctPdfPaperName}
                  onChange={(e) => setCpctPdfPaperName(e.target.value)}
                  placeholder="e.g., 21th Nov 2025 Shift2 QP1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">This will be stored for reference</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF File:</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCpctPdfFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                />
                {cpctPdfFile && (
                  <p className="text-xs text-gray-600 mt-1">Selected: {cpctPdfFile.name}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={async () => {
                if (!cpctPdfExamId) {
                  alert('Please select an exam first!');
                  return;
                }
                
                if (!cpctPdfFile) {
                  alert('Please select a PDF file!');
                  return;
                }
                
                if (!confirm('This will import/update all questions and typing content from the PDF. Continue?')) {
                  return;
                }
                
                setCpctPdfUploading(true);
                try {
                  const formData = new FormData();
                  formData.append('pdf', cpctPdfFile);
                  formData.append('examId', cpctPdfExamId);
                  if (cpctPdfPaperName.trim()) {
                    formData.append('paperName', cpctPdfPaperName.trim());
                  }
                  
                  const res = await fetch('/api/admin/import-cpct-pdf', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                  });
                  
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ ${data.message}\n\nImported: ${data.imported} questions\nErrors: ${data.errors || 0}`);
                    // Refresh questions if exam is selected
                    if (selectedExam === cpctPdfExamId && selectedSection) {
                      fetchQuestions(selectedExam, selectedSection, selectedPart);
                    }
                    // Reset form
                    setCpctPdfFile(null);
                    setCpctPdfPaperName('');
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) fileInput.value = '';
                  } else {
                    alert('Failed: ' + (data.error || 'Unknown error') + (data.details ? '\n' + data.details : ''));
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setCpctPdfUploading(false);
                }
              }}
              disabled={cpctPdfUploading || !cpctPdfExamId || !cpctPdfFile}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 text-sm font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {cpctPdfUploading ? 'Uploading & Processing...' : '📤 Upload & Import PDF'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>How to use:</strong> Select an Exam → Select a Section → Select a Part → View/Add Questions
            </p>
          </div>

          {/* Create 20 CPCT Exams */}
          <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 mb-3 font-bold">
              <strong>🚀 CPCT Exams Management:</strong>
            </p>
            <p className="text-xs text-purple-700 mb-3">
              Create CPCT exams with structure (NO QUESTIONS - add manually):
              <br />• <strong>Section A:</strong> 75 minutes timer, 5 parts (IT SKILLS, READING COMPREHENSION, QUANTITATIVE APTITUDE, GENERAL MENTAL ABILITY AND REASONING, GENERAL AWARENESS) - EMPTY, add questions manually
              <br />• <strong>Section B:</strong> English Typing (15 minutes separate timer) - Linked to skill lessons
              <br />• <strong>Section C:</strong> Hindi Typing (15 minutes separate timer) - Linked to skill lessons
              <br />• Paper 1 → Lesson 1, Paper 2 → Lesson 2, etc.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={async () => {
                  if (!confirm('⚠️ WARNING: This will DELETE ALL CPCT exams, sections, parts, and questions!\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) return;
                  if (!confirm('⚠️ FINAL CONFIRMATION: This will permanently delete all CPCT exams.\n\nThis is your last chance to cancel.\n\nContinue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/delete-all-cpct-exams', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Deleted all CPCT exams.\n\nDeleted:\n- ${data.deleted.exams} exams\n- ${data.deleted.sections} sections\n- ${data.deleted.parts} parts\n- ${data.deleted.questions} questions\n- Total: ${data.deleted.total} items`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to delete CPCT exams'));
                    }
                  } catch (error) {
                    console.error('Error deleting CPCT exams:', error);
                    alert('Failed to delete CPCT exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Deleting...' : '🗑️ Delete All CPCT Exams'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('⚠️ WARNING: This will remove ALL MCQ questions from ALL CPCT exams.\n\nTyping questions (Section B & C) will be PRESERVED.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) return;
                  if (!confirm('⚠️ FINAL CONFIRMATION: This will delete all CPCT MCQ questions (but keep typing questions).\n\nThis is your last chance to cancel.\n\nContinue?')) return;
                  
                  try {
                    setCpctMcqClearing(true);
                    const res = await fetch('/api/admin/clear-all-cpct-mcq-questions', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Cleared all CPCT MCQ questions.\n\nDeleted:\n- ${data.deleted.mcqQuestions} MCQ questions\n- Total: ${data.deleted.total} questions\n- Exams affected: ${data.examsAffected}`;
                      if (data.deleted.typingQuestionsPreserved > 0) {
                        message += `\n- ${data.deleted.typingQuestionsPreserved} typing questions preserved`;
                      }
                      if (data.note) {
                        message += `\n\n📝 ${data.note}`;
                      }
                      alert(message);
                      await fetchExams();
                      // Refresh questions if a CPCT exam is selected
                      if (selectedExam) {
                        const selectedExamData = exams.find(e => e._id === selectedExam);
                        if (selectedExamData && selectedExamData.key === 'CPCT') {
                          setSelectedSection(null);
                          setSelectedPart(null);
                          setQuestions([]);
                          fetchSections(selectedExam);
                        }
                      }
                    } else {
                      alert('Error: ' + (data.error || 'Failed to clear MCQ questions'));
                    }
                  } catch (error) {
                    console.error('Error clearing CPCT MCQ questions:', error);
                    alert('Failed to clear MCQ questions: ' + error.message);
                  } finally {
                    setCpctMcqClearing(false);
                  }
                }}
                disabled={saving || cpctMcqClearing}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {cpctMcqClearing ? 'Clearing...' : '🗑️ Clear All CPCT MCQ Questions'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will create 20 CPCT exams with structure (Section A with 5 parts - NO QUESTIONS, Section B & C with typing linked to skill lessons). Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/create-cpct-exams-structure', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Created ${data.exams.length} CPCT exams with structure.\n\n${data.summary.free} free, ${data.summary.paid} paid.`;
                      if (data.summary.skillLessonsLinked) {
                        message += `\n\n✅ Linked ${data.summary.skillLessonsLinked} typing sections to skill lessons (Paper 1 → Lesson 1, Paper 2 → Lesson 2, etc.).`;
                      }
                      message += `\n\n📝 Note: Section A parts are created but empty - add questions manually.`;
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to create exams'));
                    }
                  } catch (error) {
                    console.error('Error creating exams:', error);
                    alert('Failed to create exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Creating...' : '✅ Create 20 CPCT Exams (Structure Only)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will update all existing CPCT exams to the new 3-section structure (Section A with 5 parts, Section B English Typing, Section C Hindi Typing). Existing questions will be migrated where possible. This will also link typing sections to skill lessons (Paper 1 → Lesson 1, Paper 2 → Lesson 2, etc.). Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/update-cpct-exams-structure', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `Success! Updated ${data.exams.length} exams. ${data.summary.totalMigratedQuestions} questions migrated.`;
                      if (data.summary.skillLessonsLinked) {
                        message += `\n\n✅ Linked ${data.summary.skillLessonsLinked} typing sections to skill lessons.`;
                      }
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to update exams'));
                    }
                  } catch (error) {
                    console.error('Error updating exams:', error);
                    alert('Failed to update exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Updating...' : 'Update Existing CPCT Exams to New Structure'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will DELETE and RECREATE CPCT Exam 1 and Exam 2 with the same structure as other exams.\n\nExam 1 will be FREE, Exam 2 will be PAID.\n\nAll existing data for these exams will be deleted.\n\nContinue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/recreate-cpct-exams-1-2', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Recreated CPCT Exam 1 and Exam 2.\n\n`;
                      message += `Deleted: ${data.deleted.length} exam(s)\n`;
                      message += `Created: ${data.created.length} exam(s)\n`;
                      message += `- Exam 1: ${data.created.find(e => e.title === 'CPCT Exam 1')?.isFree ? 'FREE' : 'PAID'}\n`;
                      message += `- Exam 2: ${data.created.find(e => e.title === 'CPCT Exam 2')?.isFree ? 'FREE' : 'PAID'}\n`;
                      if (data.summary.skillLessonsLinked) {
                        message += `\n✅ Linked ${data.summary.skillLessonsLinked} typing sections to skill lessons.`;
                      }
                      message += `\n\n📝 Note: Section A parts are created but empty - add questions manually.`;
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to recreate exams'));
                    }
                  } catch (error) {
                    console.error('Error recreating exams:', error);
                    alert('Failed to recreate exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Recreating...' : '🔄 Recreate CPCT Exam 1 & 2 (Make Exam 1 Free)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will add one Part to each Section in all CPCT exams that don\'t have parts. Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/add-parts-to-exams', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({})
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Added ${data.createdParts} parts to ${data.parts.length} sections.`);
                      // Refresh parts if a section is selected
                      if (selectedExam && selectedSection) {
                        await fetchParts(selectedExam, selectedSection);
                      }
                    } else {
                      alert('Error: ' + (data.error || 'Failed to add parts'));
                    }
                  } catch (error) {
                    console.error('Error adding parts:', error);
                    alert('Failed to add parts: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Adding...' : 'Add Parts to Existing Exams'}
              </button>
            </div>
          </div>

          {/* Create 20 CCC Exams */}
          <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 mb-3 font-bold">
              <strong>🚀 Create 20 CCC Exams:</strong>
            </p>
            <p className="text-xs text-purple-700 mb-3">
              This will create 20 CCC exams with the following pattern:
              <br />• 90 minutes duration
              <br />• 100 questions total
              <br />• One section: "Computer Concepts"
              <br />• One part: "CCC"
              <br />• Each question: 1 mark, no negative marking
              <br />• First exam is FREE, others are PAID
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!confirm('This will create 20 CCC exams with sections, parts, and 100 questions each. Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/create-ccc-15-exams', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Created ${data.exams.length} exams. ${data.summary.free} free, ${data.summary.paid} paid.`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to create exams'));
                    }
                  } catch (error) {
                    console.error('Error creating exams:', error);
                    alert('Failed to create exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Creating...' : 'Create 20 CCC Exams'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will import CCC syllabus-based questions for exams 1-5. Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-ccc-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [1, 2, 3, 4, 5] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Imported questions for ${data.results.length} exam(s).`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import CCC Questions (Exams 1-5)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will import CCC syllabus-based questions for exams 6-10. Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-ccc-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [6, 7, 8, 9, 10] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Imported questions for ${data.results.length} exam(s).`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import CCC Questions (Exams 6-10)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will import CCC syllabus-based questions for exams 11-20. These questions will be different from exams 1-10. Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-ccc-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Imported questions for ${data.results.length} exam(s).`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import CCC Questions (Exams 11-20)'}
              </button>
              <button
                onClick={async () => {
                  const examNums = prompt('Enter exam numbers to import questions (e.g., 1,2,3):', '');
                  if (examNums === null || examNums.trim() === '') return;
                  const examNumbers = examNums.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0);
                  if (examNumbers.length === 0) {
                    alert('Please enter valid exam numbers');
                    return;
                  }
                  if (!confirm(`This will import CCC syllabus-based questions for exams: ${examNumbers.join(', ')}. Continue?`)) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-ccc-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Imported questions for ${data.results.length} exam(s).`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import CCC Questions (Custom)'}
              </button>
            </div>
          </div>

          {/* Bulk Import CCC Questions */}
          <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 mb-3 font-bold">
              <strong>📥 Bulk Import CCC Questions:</strong>
            </p>
            <p className="text-xs text-purple-700 mb-3">
              Copy and paste questions in the following format:
              <br />• <strong>Format 1:</strong> Question text (Hindi text?) A. Option1 B. Option2 C. Option3 D. Option4 Ans: A. Answer
              <br />• <strong>Format 2:</strong> Question text (Hindi text?) A. Option1 (Hindi1) B. Option2 (Hindi2) C. Option3 (Hindi3) D. Option4 (Hindi4) Ans: A. Answer
              <br />• Each question on a new line (separated by blank lines)
              <br />• If you paste more than 100 questions, only the first 100 will be imported
              <br />• Questions will replace existing questions for the selected exam
            </p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CCC Exam:
              </label>
              <select
                value={cccBulkImportExamId}
                onChange={(e) => setCccBulkImportExamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={cccBulkImporting || exams.length === 0}
              >
                <option value="">-- Select a CCC Exam --</option>
                {exams.filter(exam => exam.key === 'CCC').map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} {exam.isFree ? '(FREE)' : '(PAID)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Questions Here:
              </label>
              <textarea
                value={cccBulkImportText}
                onChange={(e) => setCccBulkImportText(e.target.value)}
                placeholder="Paste questions here in the format:&#10;Question text (Hindi text?) A. Option1 (Hindi1) B. Option2 (Hindi2) C. Option3 (Hindi3) D. Option4 (Hindi4) Ans: A. Answer&#10;&#10;Next question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                rows={10}
                disabled={cccBulkImporting || !cccBulkImportExamId}
              />
            </div>
            <button
              onClick={async () => {
                if (!cccBulkImportExamId) {
                  alert('Please select a CCC exam first');
                  return;
                }
                if (!cccBulkImportText.trim()) {
                  alert('Please paste questions first');
                  return;
                }
                const selectedExam = exams.find(e => e._id === cccBulkImportExamId);
                if (!confirm(`This will replace all existing questions for "${selectedExam?.title}". Continue?`)) return;
                
                try {
                  setCccBulkImporting(true);
                  const res = await fetch('/api/admin/bulk-import-ccc-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      questionsText: cccBulkImportText,
                      examId: cccBulkImportExamId
                    })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    let message = `Success! Imported ${data.imported} questions to "${data.examTitle}".`;
                    if (data.parsingStats) {
                      message += `\n\nParsing Stats:\n- Total blocks found: ${data.parsingStats.totalBlocks}\n- Successfully parsed: ${data.parsingStats.parsed}\n- Failed to parse: ${data.parsingStats.failed}`;
                      if (data.parsingStats.wasLimited) {
                        message += `\n- ⚠️ Limited to 100 questions (had ${data.parsingStats.originalParsed} total)`;
                      }
                    }
                    if (data.warning) {
                      message += `\n\n⚠️ ${data.warning}`;
                    }
                    alert(message);
                    setCccBulkImportText('');
                    // Refresh exams and questions if this exam is selected
                    await fetchExams();
                    if (selectedExam && String(selectedExam) === cccBulkImportExamId) {
                      setSelectedSection(null);
                      setSelectedPart(null);
                      setQuestions([]);
                      fetchSections(cccBulkImportExamId);
                    }
                  } else {
                    alert('Error: ' + (data.error || 'Failed to import questions'));
                  }
                } catch (error) {
                  console.error('Error importing CCC questions:', error);
                  alert('Failed to import questions: ' + error.message);
                } finally {
                  setCccBulkImporting(false);
                }
              }}
              disabled={cccBulkImporting || !cccBulkImportExamId || !cccBulkImportText.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
            >
              {cccBulkImporting ? 'Importing Questions...' : 'Import CCC Questions'}
            </button>
      </div>

          {/* CCC Question Bank Management */}
          <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-indigo-900 mb-3 font-bold">
              <strong>📚 CCC Question Bank Management (20 Exams - 2000 Questions):</strong>
            </p>
            <p className="text-xs text-indigo-700 mb-3">
              This system allows you to import 600+ questions into a question bank, then automatically distribute them across all 20 CCC exams (100 questions each, shuffled).
              <br />• <strong>Step 1:</strong> Paste questions below (you can paste in parts - each import will ADD to the bank, not replace)
              <br />• <strong>Step 2:</strong> Click "Import to Question Bank" - you can do this multiple times with different batches
              <br />• <strong>Step 3:</strong> Click "Remove Current Questions" to clear existing questions from all CCC exams (optional)
              <br />• <strong>Step 4:</strong> Click "Distribute Questions to All Exams" to assign 100 shuffled questions to each of the 20 CCC exams
            </p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste All 600+ Questions Here:
              </label>
              <textarea
                value={cccQuestionBankText}
                onChange={(e) => setCccQuestionBankText(e.target.value)}
                placeholder="Paste all questions here in the format:&#10;Question text (Hindi text?) A. Option1 (Hindi1) B. Option2 (Hindi2) C. Option3 (Hindi3) D. Option4 (Hindi4) Ans: A. Answer&#10;&#10;Next question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                rows={15}
                disabled={cccQuestionBankImporting || cccDistributing || cccClearing}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  if (!cccQuestionBankText.trim()) {
                    alert('Please paste questions first');
                    return;
                  }
                  if (!confirm('This will ADD questions to the CCC question bank (existing questions will remain). Continue?')) return;
                  
                  try {
                    setCccQuestionBankImporting(true);
                    const res = await fetch('/api/admin/import-ccc-question-bank', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        questionsText: cccQuestionBankText
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Imported ${data.imported} questions into CCC question bank.\n\n`;
                      message += `Total questions in bank now: ${data.totalInBank}\n`;
                      message += `Failed to parse: ${data.failed || 0} questions`;
                      if (data.wasAppended) {
                        message += `\n\n(Questions were added to existing bank)`;
                      }
                      alert(message);
                      setCccQuestionBankText('');
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import question bank'));
                    }
                  } catch (error) {
                    console.error('Error importing CCC question bank:', error);
                    alert('Failed to import question bank: ' + error.message);
                  } finally {
                    setCccQuestionBankImporting(false);
                  }
                }}
                disabled={cccQuestionBankImporting || cccDistributing || cccClearing || !cccQuestionBankText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {cccQuestionBankImporting ? 'Importing...' : '📥 Import to Question Bank'}
              </button>

              <button
                onClick={async () => {
                  if (!confirm('⚠️ WARNING: This will remove ALL questions from ALL 20 CCC exams.\n\nThe question bank will be PRESERVED so you can redistribute questions.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) return;
                  if (!confirm('⚠️ FINAL CONFIRMATION: This will delete all CCC exam questions (but keep the question bank).\n\nThis is your last chance to cancel.\n\nContinue?')) return;
                  
                  try {
                    setCccClearing(true);
                    const res = await fetch('/api/admin/clear-all-ccc-questions', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Cleared all CCC exam questions.\n\nDeleted:\n- ${data.deleted.examQuestions} exam questions\n- Total: ${data.deleted.total} questions\n- Exams affected: ${data.examsAffected}`;
                      if (data.note) {
                        message += `\n\n📝 ${data.note}`;
                      }
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to clear questions'));
                    }
                  } catch (error) {
                    console.error('Error clearing CCC questions:', error);
                    alert('Failed to clear questions: ' + error.message);
                  } finally {
                    setCccClearing(false);
                  }
                }}
                disabled={cccQuestionBankImporting || cccDistributing || cccClearing}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {cccClearing ? 'Clearing...' : '🗑️ Remove Current Questions'}
              </button>

              <button
                onClick={async () => {
                  if (!confirm('This will distribute questions from the question bank to all 20 CCC exams (100 questions each, shuffled).\n\nMake sure you have imported questions to the bank first.\n\nContinue?')) return;
                  
                  try {
                    setCccDistributing(true);
                    const res = await fetch('/api/admin/distribute-ccc-questions', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Distributed questions to ${data.results.length} CCC exams.\n\n`;
                      message += `Total questions in bank: ${data.totalQuestionsInBank}\n\n`;
                      message += `Exams updated:\n`;
                      data.results.forEach((r, idx) => {
                        message += `${idx + 1}. ${r.examTitle}: ${r.questionsAdded} questions\n`;
                      });
                      if (data.errors && data.errors.length > 0) {
                        message += `\n⚠️ Errors:\n`;
                        data.errors.forEach(e => {
                          message += `- ${e.exam}: ${e.error}\n`;
                        });
                      }
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to distribute questions'));
                    }
                  } catch (error) {
                    console.error('Error distributing CCC questions:', error);
                    alert('Failed to distribute questions: ' + error.message);
                  } finally {
                    setCccDistributing(false);
                  }
                }}
                disabled={cccQuestionBankImporting || cccDistributing || cccClearing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {cccDistributing ? 'Distributing...' : '🚀 Distribute Questions to All Exams'}
              </button>
            </div>
          </div>

          {/* RSCIT Question Bank Management */}
          <div className="bg-cyan-50 border-2 border-cyan-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-cyan-900 mb-3 font-bold">
              <strong>📚 RSCIT Question Bank Management (Section A & B):</strong>
            </p>
            <p className="text-xs text-cyan-700 mb-3">
              This system allows you to import questions separately for Section A (15 questions) and Section B (35 questions), then automatically distribute them across all RSCIT exams.
              <br />• <strong>Section A:</strong> 15 questions, 2 marks each, 15 min timer, minimum 12 marks required
              <br />• <strong>Section B:</strong> 35 questions, 2 marks each, 60 min timer, minimum 28 marks required
              <br />• <strong>Step 1:</strong> Paste Section A questions and click "Import Section A"
              <br />• <strong>Step 2:</strong> Paste Section B questions and click "Import Section B" (you can paste in parts - each import will ADD to the bank)
              <br />• <strong>Step 3:</strong> Click "Remove Current Questions" to clear existing questions from all RSCIT exams (optional)
              <br />• <strong>Step 4:</strong> Click "Distribute Questions to All Exams" to assign 15 Section A + 35 Section B questions to each exam
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Section A */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section A Questions (15 per exam):
                </label>
                <textarea
                  value={rscitSectionAText}
                  onChange={(e) => setRscitSectionAText(e.target.value)}
                  placeholder="Paste Section A questions here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
                  rows={12}
                  disabled={rscitSectionAImporting || rscitSectionBImporting || rscitDistributing || rscitClearing}
                />
                <button
                  onClick={async () => {
                    if (!rscitSectionAText.trim()) {
                      alert('Please paste Section A questions first');
                      return;
                    }
                    if (!confirm('This will ADD Section A questions to the RSCIT question bank (existing questions will remain). Continue?')) return;
                    
                    try {
                      setRscitSectionAImporting(true);
                      const res = await fetch('/api/admin/import-rscit-question-bank', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          questionsText: rscitSectionAText,
                          section: 'A'
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        let message = `✅ Success! Imported ${data.imported} Section A questions into RSCIT question bank.\n\n`;
                        message += `Total Section A questions in bank now: ${data.totalInBank}\n`;
                        message += `Failed to parse: ${data.failed || 0} questions`;
                        if (data.wasAppended) {
                          message += `\n\n(Questions were added to existing bank)`;
                        }
                        alert(message);
                        setRscitSectionAText('');
                      } else {
                        alert('Error: ' + (data.error || 'Failed to import Section A questions'));
                      }
                    } catch (error) {
                      console.error('Error importing RSCIT Section A questions:', error);
                      alert('Failed to import Section A questions: ' + error.message);
                    } finally {
                      setRscitSectionAImporting(false);
                    }
                  }}
                  disabled={rscitSectionAImporting || rscitSectionBImporting || rscitDistributing || rscitClearing || !rscitSectionAText.trim()}
                  className="mt-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 w-full"
                >
                  {rscitSectionAImporting ? 'Importing...' : '📥 Import Section A'}
                </button>
              </div>

              {/* Section B */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section B Questions (35 per exam):
                </label>
                <textarea
                  value={rscitSectionBText}
                  onChange={(e) => setRscitSectionBText(e.target.value)}
                  placeholder="Paste Section B questions here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
                  rows={12}
                  disabled={rscitSectionAImporting || rscitSectionBImporting || rscitDistributing || rscitClearing}
                />
                <button
                  onClick={async () => {
                    if (!rscitSectionBText.trim()) {
                      alert('Please paste Section B questions first');
                      return;
                    }
                    if (!confirm('This will ADD Section B questions to the RSCIT question bank (existing questions will remain). Continue?')) return;
                    
                    try {
                      setRscitSectionBImporting(true);
                      const res = await fetch('/api/admin/import-rscit-question-bank', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          questionsText: rscitSectionBText,
                          section: 'B'
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        let message = `✅ Success! Imported ${data.imported} Section B questions into RSCIT question bank.\n\n`;
                        message += `Total Section B questions in bank now: ${data.totalInBank}\n`;
                        message += `Failed to parse: ${data.failed || 0} questions`;
                        if (data.wasAppended) {
                          message += `\n\n(Questions were added to existing bank)`;
                        }
                        alert(message);
                        setRscitSectionBText('');
                      } else {
                        alert('Error: ' + (data.error || 'Failed to import Section B questions'));
                      }
                    } catch (error) {
                      console.error('Error importing RSCIT Section B questions:', error);
                      alert('Failed to import Section B questions: ' + error.message);
                    } finally {
                      setRscitSectionBImporting(false);
                    }
                  }}
                  disabled={rscitSectionAImporting || rscitSectionBImporting || rscitDistributing || rscitClearing || !rscitSectionBText.trim()}
                  className="mt-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 w-full"
                >
                  {rscitSectionBImporting ? 'Importing...' : '📥 Import Section B'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={async () => {
                  if (!confirm('⚠️ WARNING: This will remove ALL questions from ALL RSCIT exams.\n\nThe question banks will be PRESERVED so you can redistribute questions.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) return;
                  if (!confirm('⚠️ FINAL CONFIRMATION: This will delete all RSCIT exam questions (but keep the question banks).\n\nThis is your last chance to cancel.\n\nContinue?')) return;
                  
                  try {
                    setRscitClearing(true);
                    const res = await fetch('/api/admin/clear-all-rscit-questions', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Cleared all RSCIT exam questions.\n\nDeleted:\n- ${data.deleted.examQuestions} exam questions\n- Total: ${data.deleted.total} questions\n- Exams affected: ${data.examsAffected}`;
                      if (data.note) {
                        message += `\n\n📝 ${data.note}`;
                      }
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to clear questions'));
                    }
                  } catch (error) {
                    console.error('Error clearing RSCIT questions:', error);
                    alert('Failed to clear questions: ' + error.message);
                  } finally {
                    setRscitClearing(false);
                  }
                }}
                disabled={rscitSectionAImporting || rscitSectionBImporting || rscitDistributing || rscitClearing}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {rscitClearing ? 'Clearing...' : '🗑️ Remove Current Questions'}
              </button>

              <button
                onClick={async () => {
                  if (!confirm('This will distribute questions from the question banks to all RSCIT exams (15 Section A + 35 Section B questions each, shuffled).\n\nMake sure you have imported questions to both banks first.\n\nContinue?')) return;
                  
                  try {
                    setRscitDistributing(true);
                    const res = await fetch('/api/admin/distribute-rscit-questions', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      let message = `✅ Success! Distributed questions to ${data.results.length} RSCIT exams.\n\n`;
                      message += `Total questions in banks:\n- Section A: ${data.totalQuestionsInBank.sectionA}\n- Section B: ${data.totalQuestionsInBank.sectionB}\n\n`;
                      message += `Exams updated:\n`;
                      data.results.forEach((r, idx) => {
                        message += `${idx + 1}. ${r.examTitle}: ${r.sectionAQuestions} Section A + ${r.sectionBQuestions} Section B = ${r.totalQuestions} total\n`;
                      });
                      if (data.errors && data.errors.length > 0) {
                        message += `\n⚠️ Errors:\n`;
                        data.errors.forEach(e => {
                          message += `- ${e.exam}: ${e.error}\n`;
                        });
                      }
                      alert(message);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to distribute questions'));
                    }
                  } catch (error) {
                    console.error('Error distributing RSCIT questions:', error);
                    alert('Failed to distribute questions: ' + error.message);
                  } finally {
                    setRscitDistributing(false);
                  }
                }}
                disabled={rscitSectionAImporting || rscitSectionBImporting || rscitDistributing || rscitClearing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {rscitDistributing ? 'Distributing...' : '🚀 Distribute Questions to All Exams'}
              </button>
            </div>
          </div>

          {/* Delete All RSCIT Exams */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-900 mb-3 font-bold">
              <strong>🗑️ Delete All RSCIT Exams:</strong>
            </p>
            <p className="text-xs text-red-700 mb-3">
              <strong>WARNING:</strong> This will permanently delete ALL RSCIT exams (RSCIT Exam 1, RSCIT Exam 2, etc.) and ALL related data including:
              <br />• All sections
              <br />• All parts
              <br />• All questions
              <br />• This action cannot be undone!
            </p>
            <button
              onClick={async () => {
                if (!confirm('⚠️ WARNING: This will DELETE ALL RSCIT EXAMS and ALL related data (sections, parts, questions).\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to continue?')) return;
                
                if (!confirm('⚠️ FINAL CONFIRMATION: You are about to delete ALL RSCIT exams.\n\nThis is your last chance to cancel.\n\nContinue with deletion?')) return;
                
                try {
                  setSaving(true);
                  const res = await fetch('/api/admin/delete-all-rscit-exams', {
                    method: 'POST',
                    credentials: 'include'
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ ${data.message}\n\nDeleted:\n- ${data.deleted.exams} exam(s): ${data.deleted.examTitles.join(', ')}\n- ${data.deleted.sections} sections\n- ${data.deleted.parts} parts\n- ${data.deleted.questions} questions`);
                    await fetchExams();
                  } else {
                    alert('Error: ' + (data.error || 'Failed to delete RSCIT exams'));
                  }
                } catch (error) {
                  console.error('Error deleting RSCIT exams:', error);
                  alert('Failed to delete RSCIT exams: ' + error.message);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Deleting...' : '🗑️ Delete ALL RSCIT Exams'}
            </button>
          </div>

          {/* Update RSCIT Exams */}
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-900 mb-3 font-bold">
              <strong>🚀 Update RSCIT Exams:</strong>
            </p>
            <p className="text-xs text-orange-700 mb-3">
              This will update all existing RSCIT exams with the following pattern:
              <br />• Total time: 90 minutes (Section A: 15 min separate timer, Section B: 60 min main timer)
              <br />• 50 questions total (100 marks)
              <br />• <strong>Section A FIRST:</strong> 15 questions @ 2 marks each (30 marks) - 15 minutes separate timer - Minimum 12 marks required to proceed
              <br />• <strong>Section B SECOND:</strong> 35 questions @ 2 marks each (70 marks) - 60 minutes main timer (fresh, not remaining from Section A) - Minimum 28 marks required to pass
              <br />• One part "RSCIT" in each section
              <br />• <strong>Passing Criteria:</strong> Minimum 12 marks in Section A AND minimum 28 marks in Section B
              <br />• No negative marking
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!confirm('This will update all existing RSCIT exams with new structure: Section A first (15 min, 15 questions, min 12 marks), Section B second (60 min, 35 questions, min 28 marks). Continue?')) return;
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/update-rscit-exams-structure', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Success! Updated ${data.exams.length} RSCIT exams with new structure.`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to update exams'));
                    }
                  } catch (error) {
                    console.error('Error updating exams:', error);
                    alert('Failed to update exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Updating...' : 'Update Existing RSCIT Exams'}
              </button>
              <button
                onClick={async () => {
                  const examNumbers = prompt('Enter exam numbers to import questions for (e.g., 1,2,3,4,5 or just press OK for all):');
                  if (examNumbers === null) return; // User cancelled
                  
                  let examNums = [];
                  if (examNumbers.trim()) {
                    examNums = examNumbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                  }
                  
                  if (!confirm(`This will import REAL questions from question bank for RSCIT Exam${examNums.length > 0 ? 's ' + examNums.join(', ') : 's (all)'}.\n\nThis will REPLACE existing placeholder questions with real questions.\n\nContinue?`)) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-rscit-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: examNums.length > 0 ? examNums : undefined })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Imported real questions for ${data.imported || 0} exam(s).\n\n${data.message || ''}`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import Real RSCIT Questions'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will import REAL questions from question bank for RSCIT Exams 1, 2, 3, 4, and 5.\n\nThis will REPLACE existing placeholder questions with real questions.\n\nContinue?')) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-rscit-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [1, 2, 3, 4, 5] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Imported real questions for exams 1-5.\n\n${data.message || ''}\n\nImported: ${data.imported || 0} exam(s)`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import Real Questions (Exams 1-5)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will import REAL questions from question bank for RSCIT Exams 6, 7, 8, 9, and 10.\n\nThis will REPLACE existing placeholder questions with real questions.\n\nContinue?')) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-rscit-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [6, 7, 8, 9, 10] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Imported real questions for exams 6-10.\n\n${data.message || ''}\n\nImported: ${data.imported || 0} exam(s)`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import Real Questions (Exams 6-10)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will import REAL questions from question bank for RSCIT Exams 11, 12, 13, 14, 15, 16, 17, 18, 19, and 20.\n\nThis will REPLACE existing placeholder questions with real questions.\n\nContinue?')) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-rscit-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Imported real questions for exams 11-20.\n\n${data.message || ''}\n\nImported: ${data.imported || 0} exam(s)`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Importing...' : 'Import Real Questions (Exams 11-20)'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will remove [V51], [V52], etc. tags from ALL RSCIT questions.\n\nThis will clean question text, options, and explanations.\n\nContinue?')) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/clean-rscit-questions', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Cleaned ${data.updated} questions out of ${data.totalQuestions} total questions.`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to clean questions'));
                    }
                  } catch (error) {
                    console.error('Error cleaning questions:', error);
                    alert('Failed to clean questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Cleaning...' : 'Remove [V51] Tags from All Questions'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will RE-IMPORT questions for ALL RSCIT exams (1-20) with improved duplicate prevention.\n\nThis will:\n- Check for duplicates across all exams\n- Ensure each exam gets unique questions\n- Clean question text (remove tags)\n\nContinue?')) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/import-rscit-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ examNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Re-imported questions for all 20 exams.\n\n${data.message || ''}\n\nImported: ${data.imported || 0} exam(s)`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import questions'));
                    }
                  } catch (error) {
                    console.error('Error importing questions:', error);
                    alert('Failed to import questions: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Re-importing...' : 'Re-import All Questions (Exams 1-20) - No Duplicates'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('This will create/update 20 RSCIT exams with the following structure:\n\n' +
                    'Each exam has:\n' +
                    '• Section A: 15 questions, 15 min timer, 2 marks each, minimum 12 marks to proceed\n' +
                    '• Section B: 35 questions, 60 min timer (fresh, not remaining from A), 2 marks each, minimum 28 marks to pass\n' +
                    '• Total: 50 questions per exam\n' +
                    '• Passing: Must pass both sections (A >= 12 AND B >= 28)\n\n' +
                    'This will DELETE and RECREATE all sections, parts, and questions for existing exams.\n\n' +
                    'Continue?')) return;
                  
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/create-20-rscit-exams', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Created/updated ${data.created.length} RSCIT exams.\n\n` +
                        `Summary:\n` +
                        `• Total exams: ${data.summary.totalExams}\n` +
                        `• Total questions: ${data.summary.totalQuestions}\n` +
                        `• Section A questions: ${data.summary.sectionAQuestions}\n` +
                        `• Section B questions: ${data.summary.sectionBQuestions}\n\n` +
                        (data.errors && data.errors.length > 0 ? `Errors: ${data.errors.length}\n` : ''));
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to create exams'));
                    }
                  } catch (error) {
                    console.error('Error creating exams:', error);
                    alert('Failed to create exams: ' + error.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Creating...' : 'Create 20 RSCIT Exams'}
              </button>
            </div>
          </div>

          {/* CPCT Typing Content Management */}
          <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 mb-3 font-bold">
              <strong>⌨️ Manage CPCT Typing Content:</strong>
            </p>
            <p className="text-xs text-purple-700 mb-3">
              Select a CPCT exam and paste English/Hindi typing content. This will update or create typing questions in Section B (English) and Section C (Hindi).
              <br />If content already exists, it will be overwritten.
            </p>
            
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select CPCT Exam:</label>
                <select
                  value={cpctTypingExamId}
                  onChange={(e) => {
                    setCpctTypingExamId(e.target.value);
                    // Load existing content if exam is selected
                    if (e.target.value) {
                      loadExistingTypingContent(e.target.value);
                    } else {
                      setCpctEnglishTypingContent('');
                      setCpctHindiTypingContent('');
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="">-- Select Exam --</option>
                  {exams.filter(e => e.key === 'CPCT').map(exam => (
                    <option key={exam._id} value={exam._id}>{exam.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">English Typing Content (Section B):</label>
                <textarea
                  value={cpctEnglishTypingContent}
                  onChange={(e) => setCpctEnglishTypingContent(e.target.value)}
                  placeholder="Paste English typing content here..."
                  className="w-full h-32 border border-gray-300 rounded p-2 text-sm font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hindi Typing Content (Section C):</label>
                <HindiTextarea
                  layout="remington"
                  value={cpctHindiTypingContent}
                  onChange={(e) => setCpctHindiTypingContent(e.target.value)}
                  placeholder="Type or paste Hindi content (type in English to convert to Devanagari)"
                  className="w-full h-32 border border-gray-300 rounded p-2 text-sm font-mono"
                />
              </div>
            </div>
            
            <button
              onClick={async () => {
                if (!cpctTypingExamId) {
                  alert('Please select an exam first!');
                  return;
                }
                
                if (!cpctEnglishTypingContent.trim() && !cpctHindiTypingContent.trim()) {
                  alert('Please enter at least one typing content (English or Hindi)!');
                  return;
                }
                
                if (!confirm('This will update/overwrite typing content for the selected exam. Continue?')) {
                  return;
                }
                
                setCpctTypingSaving(true);
                try {
                  const res = await fetch('/api/admin/update-cpct-typing-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      examId: cpctTypingExamId,
                      englishContent: cpctEnglishTypingContent.trim() || null,
                      hindiContent: cpctHindiTypingContent.trim() || null
                    })
                  });
                  
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ ${data.message}\n\nEnglish: ${data.results.english}\nHindi: ${data.results.hindi}`);
                    // Refresh questions if exam is selected
                    if (selectedExam === cpctTypingExamId && selectedSection) {
                      fetchQuestions(selectedExam, selectedSection, selectedPart);
                    }
                  } else {
                    alert('Failed: ' + (data.error || 'Unknown error'));
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setCpctTypingSaving(false);
                }
              }}
              disabled={cpctTypingSaving || !cpctTypingExamId}
              className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 text-sm font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {cpctTypingSaving ? 'Saving...' : '💾 Save Typing Content'}
            </button>
          </div>

          {/* CPCT Question Bank Management - Unified Interface like CCC */}
          <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-indigo-900 mb-3 font-bold">
              <strong>📚 CPCT Question Bank Management (5 Parts):</strong>
            </p>
            <p className="text-xs text-indigo-700 mb-3">
              This system allows you to import questions into a question bank for each part, then automatically distribute them across all CPCT exams.
              <br />• <strong>Step 1:</strong> Select a part below and paste questions (you can paste in parts - each import will ADD to the bank, not replace)
              <br />• <strong>Step 2:</strong> Click "Import to Question Bank" - you can do this multiple times with different batches
              <br />• <strong>Step 3:</strong> Click "Remove Current Questions" to clear existing questions from all CPCT exams (optional)
              <br />• <strong>Step 4:</strong> Click "Distribute Questions to All Exams" to assign questions to the selected part in all CPCT exams
            </p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Part:
              </label>
              <select
                value={cpctSelectedPart}
                onChange={(e) => {
                  setCpctSelectedPart(e.target.value);
                  setCpctQuestionBankText(''); // Clear text when switching parts
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={cpctQuestionBankImporting || cpctDistributing || cpctClearing}
              >
                {['IT SKILLS', 'READING COMPREHENSION', 'QUANTITATIVE APTITUDE', 'GENERAL MENTAL ABILITY AND REASONING', 'GENERAL AWARENESS'].map((partName) => {
                  const partCount = cpctAvailablePartNames.find(p => p.name === partName)?.count || 0;
                  return (
                    <option key={partName} value={partName}>
                      {partName} {partCount > 0 && `(${partCount} questions in bank)`}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Questions for {cpctSelectedPart}:
              </label>
              <textarea
                value={cpctQuestionBankText}
                onChange={(e) => setCpctQuestionBankText(e.target.value)}
                placeholder={`Paste ${cpctSelectedPart} questions here in the format:\nQuestion text (Hindi text) A. Option1 (Hindi1) B. Option2 (Hindi2) C. Option3 (Hindi3) D. Option4 (Hindi4) Ans: A. Answer\n\nNext question...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                rows={15}
                disabled={cpctQuestionBankImporting || cpctDistributing || cpctClearing}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  if (!cpctQuestionBankText.trim()) {
                    alert('Please paste questions first');
                    return;
                  }
                  if (!confirm(`This will ADD questions to the CPCT question bank for "${cpctSelectedPart}" (existing questions will remain). Continue?`)) return;
                  
                  try {
                    setCpctQuestionBankImporting(true);
                    const res = await fetch('/api/admin/import-cpct-question-bank', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        questionText: cpctQuestionBankText.trim(),
                        partName: cpctSelectedPart
                      })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      const partCount = data.partCount !== undefined ? data.partCount : 0;
                      let message = `✅ Success! Imported ${data.imported} new questions for ${cpctSelectedPart}`;
                      if (data.updated > 0) {
                        message += `, updated ${data.updated} existing questions`;
                      }
                      message += `\n\nProcessed: ${data.total} questions`;
                      message += `\n\n📊 Total questions in bank for ${cpctSelectedPart}: ${partCount}`;
                      if (data.errors > 0) {
                        message += `\n\n⚠️ ${data.errors} errors occurred`;
                      }
                      alert(message);
                      setCpctQuestionBankText('');
                      await fetchCpctPartNames();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to import question bank'));
                    }
                  } catch (error) {
                    console.error('Error importing CPCT question bank:', error);
                    alert('Failed to import question bank: ' + error.message);
                  } finally {
                    setCpctQuestionBankImporting(false);
                  }
                }}
                disabled={cpctQuestionBankImporting || cpctDistributing || cpctClearing || !cpctQuestionBankText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <span>💾</span>
                {cpctQuestionBankImporting ? 'Importing...' : 'Import to Question Bank'}
              </button>

              <button
                onClick={async () => {
                  const partCount = cpctAvailablePartNames.find(p => p.name === cpctSelectedPart)?.count || 0;
                  if (partCount === 0) {
                    alert(`No questions found in the question bank for "${cpctSelectedPart}".`);
                    return;
                  }
                  
                  if (!confirm(`⚠️ WARNING: This will DELETE ALL ${partCount} questions from the question bank for "${cpctSelectedPart}".\n\nThis will NOT delete questions from the exams.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?`)) return;
                  
                  try {
                    setCpctClearing(true);
                    const res = await fetch('/api/admin/clear-cpct-question-bank', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        partName: cpctSelectedPart
                      })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Cleared ${data.deleted} questions from "${cpctSelectedPart}" question bank.`);
                      await fetchCpctPartNames();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to clear question bank'));
                    }
                  } catch (error) {
                    alert('Error: ' + error.message);
                  } finally {
                    setCpctClearing(false);
                  }
                }}
                disabled={cpctQuestionBankImporting || cpctDistributing || cpctClearing}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <span>🗑️</span>
                {cpctClearing ? 'Clearing...' : 'Clear Question Bank'}
              </button>

              <button
                onClick={async () => {
                  if (!confirm('⚠️ WARNING: This will DELETE ALL questions from ALL CPCT exams!\n\nThis will NOT delete questions from the question bank.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) return;
                  if (!confirm('⚠️ FINAL CONFIRMATION: This will permanently delete all questions from all CPCT exams.\n\nThis is your last chance to cancel.\n\nContinue?')) return;
                  
                  try {
                    setCpctClearing(true);
                    const res = await fetch('/api/admin/clear-all-cpct-mcq-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({})
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      alert(`✅ Success! Removed ${data.deleted.mcqQuestions || data.deleted} MCQ questions from all CPCT exams.`);
                      await fetchExams();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to remove questions'));
                    }
                  } catch (error) {
                    alert('Error: ' + error.message);
                  } finally {
                    setCpctClearing(false);
                  }
                }}
                disabled={cpctQuestionBankImporting || cpctDistributing || cpctClearing}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <span>🗑️</span>
                {cpctClearing ? 'Removing...' : 'Remove Current Questions'}
              </button>

              <button
                onClick={async () => {
                  if (!confirm(`⚠️ This will distribute "${cpctSelectedPart}" questions from the question bank to ALL CPCT exams.\n\nQuestions will be distributed to the "${cpctSelectedPart}" part only.\n\nContinue?`)) return;
                  
                  try {
                    setCpctDistributing(true);
                    const res = await fetch('/api/admin/distribute-cpct-questions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        partName: cpctSelectedPart
                      })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      const partCount = cpctAvailablePartNames.find(p => p.name === cpctSelectedPart)?.count || 0;
                      let message = `✅ Success! Distributed ${cpctSelectedPart} questions to ${data.results.length} CPCT exams.\n\n`;
                      data.results.forEach(r => {
                        message += `• ${r.examTitle}: ${r.questionsAdded} questions\n`;
                      });
                      message += `\nTotal questions in bank for ${cpctSelectedPart}: ${partCount}`;
                      if (data.errors && data.errors.length > 0) {
                        message += `\n\n⚠️ ${data.errors.length} errors occurred`;
                      }
                      alert(message);
                      await fetchExams();
                      await fetchCpctPartNames();
                    } else {
                      alert('Error: ' + (data.error || 'Failed to distribute questions'));
                    }
                  } catch (error) {
                    alert('Error: ' + error.message);
                  } finally {
                    setCpctDistributing(false);
                  }
                }}
                disabled={cpctQuestionBankImporting || cpctDistributing || cpctClearing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <span>🚀</span>
                {cpctDistributing ? 'Distributing...' : 'Distribute Questions to All Exams'}
              </button>
            </div>
            
            <div className="mt-4 bg-gray-100 border border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Total questions in bank:</strong> {cpctTotalQuestionsInBank} | 
                <button 
                  onClick={fetchCpctPartNames}
                  className="text-blue-600 hover:underline ml-1"
                >
                  Refresh Counts
                </button>
              </p>
            </div>
          </div>

          {/* CPCT Text Questions Import - Part Specific */}
          <div className="bg-teal-50 border-2 border-teal-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-900 mb-3 font-bold">
              <strong>📝 Import CPCT Questions by Part (Text Format):</strong>
            </p>
            <p className="text-xs text-teal-700 mb-3">
              Select exam, part, enter paper name, and paste questions in the format shown below.
              <br />Supports both regular MCQ questions and Reading Comprehension passages with sub-questions.
              <br />Questions should include both English and Hindi versions with options.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select CPCT Exam:</label>
                <select
                  value={cpctTextExamId}
                  onChange={async (e) => {
                    setCpctTextExamId(e.target.value);
                    setCpctTextPartId(''); // Reset part when exam changes
                    setCpctTextParts([]); // Reset parts
                    if (e.target.value) {
                      await fetchSections(e.target.value);
                      // Fetch parts for Section A
                      const sectionsData = await fetch(`/api/admin/sections?examId=${e.target.value}`).then(r => r.json());
                      const sectionA = sectionsData.sections?.find(s => s.name === 'Section A');
                      if (sectionA) {
                        const partsRes = await fetch(`/api/admin/parts?examId=${e.target.value}&sectionId=${sectionA._id}`).then(r => r.json());
                        setCpctTextParts(partsRes.parts || []);
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Select Exam --</option>
                  {exams.filter(e => e.key === 'CPCT').map(exam => (
                    <option key={exam._id} value={exam._id}>{exam.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Part (Section A):</label>
                <select
                  value={cpctTextPartId}
                  onChange={(e) => setCpctTextPartId(e.target.value)}
                  disabled={!cpctTextExamId || cpctTextParts.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="">-- Select Part --</option>
                  {cpctTextParts.map(part => (
                    <option key={part._id} value={part._id}>{part.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Name:</label>
                <input
                  type="text"
                  value={cpctTextPaperName}
                  onChange={(e) => setCpctTextPaperName(e.target.value)}
                  placeholder="e.g., 21st Nov 2025 Shift2 QP1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paste Questions (English + Hindi):</label>
              <textarea
                value={cpctTextQuestions}
                onChange={(e) => setCpctTextQuestions(e.target.value)}
                placeholder={`Paste questions in this format:

REGULAR MCQ:
Question Number : 1 Question Id : 2549896609 Question Type : MCQ
A thread in an OS is a/an ______.
Options :
1.  heavy weight process
2.  multi-process
3.  inter thread process
4.  light weight process
OS में, थ्रेड एक ______ होती है।
Options :
1.  भारी प्रक्रिया (Heavy weight process)
...

READING COMPREHENSION (NEW FORMAT):
Big Data and Analytics (बिग डेटा और एनालिटिक्स)

English: Big Data refers to massive volumes...
Hindi: बिग डेटा का तात्पर्य...

What cannot process Big Data? (बिग डेटा को कौन प्रोसेस नहीं कर सकता?) A. Humans B. Traditional software C. Supercomputers D. Modern AI Ans: B

READING COMPREHENSION (OLD FORMAT):
[Passage in English]
The Turner kids were not used to snow...
[Passage in Hindi]
टनर के बच्चे बर्फ के अभ्यस्त नहीं थे...
Question Type : COMPREHENSION
Sub questions

Question Number : 53 Question Id : 25498921464 Question Type : MCQ
The Turner kids were not used to snow because:
Options :
1.  it had never snowed there
2.  it snowed only sparsely
3.  they always stayed indoors
4.  schools remained shut
टनर के बच्चे बर्फ के अभ्यस्त क्यों नहीं थे?
Options :
1.  क्योंकि वहां कभी भी बर्फबारी नहीं हुई थी
2.  क्योंकि वहां बहुत कम बर्फबारी होती थी
...`}
                className="w-full h-60 border border-gray-300 rounded-lg p-3 text-sm font-mono text-xs"
                disabled={cpctTextImporting}
              />
            </div>
            
            <button
              onClick={async () => {
                if (!cpctTextExamId) {
                  alert('Please select an exam first!');
                  return;
                }
                
                if (!cpctTextPartId) {
                  alert('Please select a part first!');
                  return;
                }
                
                if (!cpctTextQuestions.trim()) {
                  alert('Please paste questions text first!');
                  return;
                }
                
                if (!confirm('This will import questions to the selected part.\n\nAll questions will be set as FREE.\n\nContinue?')) return;
                
                setCpctTextImporting(true);
                try {
                  const res = await fetch('/api/admin/import-cpct-text-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      examId: cpctTextExamId,
                      partId: cpctTextPartId,
                      paperName: cpctTextPaperName.trim(),
                      questionsText: cpctTextQuestions.trim()
                    })
                  });
                  
                  const data = await res.json();
                  if (res.ok) {
                    let successMsg = `✅ Success! Imported ${data.imported} questions.`;
                    if (data.extraQuestionsIgnored && data.extraQuestionsIgnored > 0) {
                      successMsg += `\n\n📝 Note: ${data.extraQuestionsIgnored} extra question${data.extraQuestionsIgnored > 1 ? 's were' : ' was'} ignored as backup (only first 5 questions imported for Reading Comprehension).`;
                    }
                    successMsg += `\n\nErrors: ${data.errors || 0}`;
                    alert(successMsg);
                    setCpctTextQuestions('');
                    setCpctTextPaperName('');
                    // Refresh questions if this part is selected
                    if (selectedPart === cpctTextPartId) {
                      fetchQuestions(cpctTextExamId, sections.find(s => parts.find(p => p._id === cpctTextPartId)?.sectionId === s._id)?._id, cpctTextPartId);
                    }
                  } else {
                    alert('Failed: ' + (data.error || 'Unknown error'));
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setCpctTextImporting(false);
                }
              }}
              disabled={cpctTextImporting || !cpctTextExamId || !cpctTextPartId || !cpctTextQuestions.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {cpctTextImporting ? 'Importing...' : '📥 Import Questions'}
            </button>
          </div>

          {/* Reading Comprehension - New Format */}
          <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 mb-3 font-bold">
              <strong>📖 Import Reading Comprehension (New Format):</strong>
            </p>
            <p className="text-xs text-purple-700 mb-3">
              Paste reading comprehension content in the new format with title, English/Hindi passages, and questions.
              <br />Format: Title (Hindi Title) → English: [passage] → Hindi: [passage] → Questions with options
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select CPCT Exam:</label>
                <select
                  value={cpctTextExamId}
                  onChange={async (e) => {
                    setCpctTextExamId(e.target.value);
                    setCpctTextPartId(''); // Reset part when exam changes
                    setCpctTextParts([]); // Reset parts
                    if (e.target.value) {
                      // Fetch parts for this exam and auto-select READING COMPREHENSION part
                      try {
                        // Get all parts for this exam directly
                        const partsRes = await fetch(`/api/admin/parts?examId=${e.target.value}`, {
                          credentials: 'include'
                        });
                        
                        if (partsRes.ok) {
                          const partsData = await partsRes.json();
                          const allParts = partsData.parts || [];
                          
                          // Filter for READING COMPREHENSION part - try multiple variations
                          const readingParts = allParts.filter(p => {
                            if (!p.name) return false;
                            const nameUpper = p.name.toUpperCase().trim();
                            return nameUpper.includes('READING') || 
                                   nameUpper.includes('COMPREHENSION') ||
                                   nameUpper === 'READING COMPREHENSION' ||
                                   nameUpper.startsWith('READING');
                          });
                          
                          console.log('🔍 All parts found:', allParts.map(p => ({ id: p._id, name: p.name })));
                          console.log('📖 Reading parts found:', readingParts.map(p => ({ id: p._id, name: p.name })));
                          
                          setCpctTextParts(readingParts);
                          // Auto-select the first READING COMPREHENSION part
                          if (readingParts.length > 0) {
                            const selectedPartId = readingParts[0]._id;
                            setCpctTextPartId(selectedPartId);
                            console.log('✅ Auto-selected part:', selectedPartId, readingParts[0].name);
                          } else {
                            console.warn('⚠️ No reading comprehension part found. Available parts:', allParts.map(p => p.name));
                            setCpctTextPartId(''); // Clear part ID if not found
                          }
                        } else {
                          console.error('Failed to fetch parts:', partsRes.status, partsRes.statusText);
                          setCpctTextPartId('');
                        }
                      } catch (error) {
                        console.error('Failed to fetch parts:', error);
                        setCpctTextPartId(''); // Clear on error
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Select Exam --</option>
                  {exams.filter(e => e.key === 'CPCT').map(exam => (
                    <option key={exam._id} value={exam._id}>{exam.title}</option>
                  ))}
                </select>
                {cpctTextPartId && cpctTextParts.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Auto-selected: {cpctTextParts.find(p => p._id === cpctTextPartId)?.name || 'Reading Comprehension'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Name (Optional):</label>
                <input
                  type="text"
                  value={cpctTextPaperName}
                  onChange={(e) => setCpctTextPaperName(e.target.value)}
                  placeholder="e.g., 21st Nov 2025 Shift2 QP1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paste Reading Comprehension Content:</label>
              <textarea
                value={cpctTextQuestions}
                onChange={(e) => setCpctTextQuestions(e.target.value)}
                placeholder={`Paste reading comprehension in this format:

Big Data and Analytics (बिग डेटा और एनालिटिक्स)

English: Big Data refers to massive volumes of structured and unstructured data that cannot be processed by traditional software. Companies use data analytics to identify patterns and trends, helping them make better business decisions.

Hindi: बिग डेटा का तात्पर्य डेटा की उन विशाल मात्राओं से है जिन्हें पारंपरिक सॉफ़्टवेयर द्वारा संसाधित नहीं किया जा सकता है। कंपनियां पैटर्न और रुझानों की पहचान करने के लिए डेटा एनालिटिक्स का उपयोग करती हैं।

What cannot process Big Data? (बिग डेटा को कौन प्रोसेस नहीं कर सकता?) A. Humans B. Traditional software C. Supercomputers D. Modern AI Ans: B

What do companies identify using analytics? (एनालिटिक्स का उपयोग करके कंपनियां क्या पहचानती हैं?) A. Employee names B. Patterns and trends C. Office address D. Computer brand Ans: B`}
                className="w-full h-60 border border-gray-300 rounded-lg p-3 text-sm font-mono text-xs"
                disabled={cpctTextImporting}
              />
            </div>
            
            <button
              onClick={async () => {
                if (!cpctTextExamId) {
                  alert('Please select an exam first!');
                  return;
                }
                
                if (!cpctTextPartId) {
                  alert('⚠️ No Reading Comprehension part found in the selected exam.\n\nPlease ensure the exam has a "READING COMPREHENSION" part.');
                  return;
                }
                
                if (!cpctTextQuestions.trim()) {
                  alert('Please paste reading comprehension content first!');
                  return;
                }
                
                const partName = cpctTextParts.find(p => p._id === cpctTextPartId)?.name || 'Reading Comprehension';
                if (!confirm(`This will import reading comprehension questions to:\n\nExam: ${exams.find(e => e._id === cpctTextExamId)?.title}\nPart: ${partName}\n\nAll questions will be set as FREE.\n\nContinue?`)) return;
                
                setCpctTextImporting(true);
                try {
                  const res = await fetch('/api/admin/import-cpct-text-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      examId: cpctTextExamId,
                      partId: cpctTextPartId,
                      paperName: cpctTextPaperName.trim(),
                      questionsText: cpctTextQuestions.trim()
                    })
                  });
                  
                  const data = await res.json();
                  if (res.ok) {
                    let successMsg = `✅ Success! Imported ${data.imported} reading comprehension questions.`;
                    if (data.extraQuestionsIgnored && data.extraQuestionsIgnored > 0) {
                      successMsg += `\n\n📝 Note: ${data.extraQuestionsIgnored} extra question${data.extraQuestionsIgnored > 1 ? 's were' : ' was'} ignored as backup (only first 5 questions imported).`;
                    }
                    successMsg += `\n\nErrors: ${data.errors || 0}`;
                    alert(successMsg);
                    setCpctTextQuestions('');
                    setCpctTextPaperName('');
                    // Refresh questions if this part is selected
                    if (selectedPart === cpctTextPartId) {
                      fetchQuestions(cpctTextExamId, sections.find(s => parts.find(p => p._id === cpctTextPartId)?.sectionId === s._id)?._id, cpctTextPartId);
                    }
                  } else {
                    let errorMsg = data.error || 'Unknown error';
                    if (data.requiresExactly5) {
                      errorMsg = `❌ ${errorMsg}\n\nFound: ${data.found || 0} questions\nRequired: Exactly 5 questions\n\nNo questions were imported.`;
                    }
                    alert('Failed: ' + errorMsg);
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setCpctTextImporting(false);
                }
              }}
              disabled={cpctTextImporting || !cpctTextExamId || !cpctTextPartId || !cpctTextQuestions.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={
                !cpctTextExamId ? 'Please select an exam first' : 
                !cpctTextPartId ? `Reading Comprehension part not found. Check console for available parts.` : 
                !cpctTextQuestions.trim() ? 'Please paste reading comprehension content' : 
                'Click to import reading comprehension questions'
              }
            >
              {cpctTextImporting ? 'Importing...' : '📖 Import Reading Comprehension'}
            </button>
            {cpctTextExamId && !cpctTextPartId && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                <p className="text-yellow-800 font-semibold">⚠️ Reading Comprehension part not found</p>
                <p className="text-yellow-700 mt-1">
                  The selected exam doesn't have a part with "READING" or "COMPREHENSION" in its name.
                  <br />Please check the exam structure or open browser console (F12) to see available parts.
                </p>
              </div>
            )}
            
            {/* Delete Reading Comprehension Questions from Exam 1 */}
            {cpctTextExamId && exams.find(e => e._id === cpctTextExamId)?.title?.includes('Exam 1') && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded">
                <p className="text-sm text-red-800 font-semibold mb-2">🗑️ Delete Reading Comprehension Questions from Exam 1</p>
                <p className="text-xs text-red-700 mb-2">
                  This will delete all reading comprehension questions from CPCT Exam 1's Reading Comprehension part.
                </p>
                <button
                  onClick={async () => {
                    if (!confirm('⚠️ WARNING: This will delete ALL reading comprehension questions from CPCT Exam 1.\n\nThis action cannot be undone!\n\nContinue?')) {
                      return;
                    }
                    
                    try {
                      // Find Exam 1
                      const exam1 = exams.find(e => e.title?.includes('Exam 1') && e.key === 'CPCT');
                      if (!exam1) {
                        alert('CPCT Exam 1 not found');
                        return;
                      }
                      
                      // Find Reading Comprehension part
                      const partsRes = await fetch(`/api/admin/parts?examId=${exam1._id}`, {
                        credentials: 'include'
                      });
                      
                      if (partsRes.ok) {
                        const partsData = await partsRes.json();
                        const readingParts = partsData.parts?.filter(p => 
                          p.name && (p.name.toUpperCase().includes('READING') || p.name.toUpperCase().includes('COMPREHENSION'))
                        ) || [];
                        
                        if (readingParts.length === 0) {
                          alert('No Reading Comprehension part found in Exam 1');
                          return;
                        }
                        
                        // Delete questions from all reading comprehension parts
                        let deletedCount = 0;
                        for (const part of readingParts) {
                          const deleteRes = await fetch('/api/admin/clear-part-questions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              examId: exam1._id,
                              partId: part._id
                            })
                          });
                          
                          if (deleteRes.ok) {
                            const deleteData = await deleteRes.json();
                            deletedCount += deleteData.deletedCount || 0;
                          }
                        }
                        
                        alert(`✅ Deleted ${deletedCount} reading comprehension questions from CPCT Exam 1`);
                        
                        // Refresh if this part is selected
                        if (selectedPart && readingParts.some(p => p._id === selectedPart)) {
                          const section = sections.find(s => parts.find(p => p._id === selectedPart)?.sectionId === s._id);
                          if (section) {
                            fetchQuestions(exam1._id, section._id, selectedPart);
                          }
                        }
                      }
                    } catch (error) {
                      alert('Error: ' + error.message);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  🗑️ Delete All Reading Comprehension Questions from Exam 1
                </button>
              </div>
            )}
          </div>

          {/* Auto Import 10 Pre-defined Passages to 20 Exams */}
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-900 mb-3 font-bold">
              <strong>🚀 Auto Import 10 Pre-defined Passages to All 20 CPCT Exams:</strong>
            </p>
            <p className="text-xs text-orange-700 mb-3">
              This will automatically:
              <br />• Import 10 pre-defined reading comprehension passages
              <br />• Shuffle and duplicate them to create 20 passages (each appears twice)
              <br />• Distribute one passage (5 questions) to each of the 20 CPCT exams
              <br />• Each exam will get exactly 5 questions from one passage
            </p>
            
            <button
              onClick={async () => {
                if (!confirm(`⚠️ This will:\n\n1. Import 10 pre-defined reading comprehension passages\n2. Shuffle and duplicate them to create 20 passages\n3. Distribute one passage (5 questions) to each of the 20 CPCT exams\n\nThis will replace existing reading comprehension questions in all exams.\n\nContinue?`)) return;
                
                setAutoImporting(true);
                try {
                  const res = await fetch('/api/admin/auto-import-10-passages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                  });
                  
                  const data = await res.json();
                  if (res.ok) {
                    let successMsg = `✅ Success! Auto import completed.\n\n`;
                    successMsg += `📊 Summary:\n`;
                    successMsg += `• Passages imported: ${data.passagesImported || 0}\n`;
                    successMsg += `• Questions imported: ${data.questionsImported || 0}\n`;
                    successMsg += `• Exams updated: ${data.examsUpdated || 0}\n`;
                    
                    if (data.distributionResults && data.distributionResults.length > 0) {
                      successMsg += `\n📋 Distribution:\n`;
                      data.distributionResults.forEach((result, idx) => {
                        successMsg += `${idx + 1}. ${result.examTitle}: ${result.passageTitle} (${result.questionsAdded} questions)\n`;
                      });
                    }
                    
                    if (data.errors && data.errors.length > 0) {
                      successMsg += `\n⚠️ Errors (${data.errors.length}):\n`;
                      data.errors.slice(0, 5).forEach(err => {
                        successMsg += `• ${err}\n`;
                      });
                      if (data.errors.length > 5) {
                        successMsg += `... and ${data.errors.length - 5} more errors\n`;
                      }
                    }
                    
                    alert(successMsg);
                    await fetchExams();
                  } else {
                    alert('Error: ' + (data.error || 'Failed to auto import passages'));
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setAutoImporting(false);
                }
              }}
              disabled={autoImporting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {autoImporting ? '⏳ Importing and Distributing...' : '🚀 Auto Import 10 Passages to All 20 Exams'}
            </button>
          </div>

          {/* Bulk Import All 20 Reading Comprehension Passages */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-900 mb-3 font-bold">
              <strong>📚 Bulk Import All 20 Reading Comprehension Passages:</strong>
            </p>
            <p className="text-xs text-green-700 mb-3">
              Paste all 20 reading comprehension passages at once. The system will automatically:
              <br />• Parse all 20 passages (each with 5 questions)
              <br />• Import them to the question bank
              <br />• Distribute one passage (5 questions) to each of the 20 CPCT exams
              <br />• Each exam will get exactly 5 questions from one passage
            </p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paste All 20 Passages Here:</label>
              <textarea
                value={bulkReadingComprehensionText}
                onChange={(e) => setBulkReadingComprehensionText(e.target.value)}
                placeholder={`Paste all 20 reading comprehension passages here. Each passage should have:
- Title (Hindi Title)
- English: [passage text]
- Hindi: [passage text]
- 5 questions with options and answers

Example:
Digital Payments and E-Wallets (डिजिटल भुगतान और ई-वॉलेट)
English: Digital payments have revolutionized...
Hindi: डिजिटल भुगतान ने...
What has enabled cashless transactions? A. Barter B. Digital payments C. Physical Banks D. Gold Ans: B
...`}
                className="w-full h-96 border border-gray-300 rounded-lg p-3 text-sm font-mono text-xs"
                disabled={bulkReadingComprehensionImporting}
              />
            </div>
            
            <button
              onClick={async () => {
                if (!bulkReadingComprehensionText.trim()) {
                  alert('Please paste all 20 reading comprehension passages first!');
                  return;
                }
                
                if (!confirm(`⚠️ This will:\n\n1. Parse all 20 reading comprehension passages\n2. Import them to the question bank\n3. Distribute one passage (5 questions) to each of the 20 CPCT exams\n\nMake sure you have pasted all 20 passages correctly.\n\nContinue?`)) return;
                
                setBulkReadingComprehensionImporting(true);
                try {
                  const res = await fetch('/api/admin/bulk-import-reading-comprehension', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      passagesText: bulkReadingComprehensionText.trim()
                    })
                  });
                  
                  const data = await res.json();
                  if (res.ok) {
                    let successMsg = `✅ Success! Bulk import completed.\n\n`;
                    successMsg += `📊 Summary:\n`;
                    successMsg += `• Passages parsed: ${data.passagesParsed || 0}\n`;
                    successMsg += `• Questions imported: ${data.questionsImported || 0}\n`;
                    successMsg += `• Exams updated: ${data.examsUpdated || 0}\n`;
                    
                    if (data.distributionResults && data.distributionResults.length > 0) {
                      successMsg += `\n📋 Distribution:\n`;
                      data.distributionResults.forEach((result, idx) => {
                        successMsg += `${idx + 1}. ${result.examTitle}: ${result.questionsAdded} questions\n`;
                      });
                    }
                    
                    if (data.errors && data.errors.length > 0) {
                      successMsg += `\n⚠️ Errors (${data.errors.length}):\n`;
                      data.errors.slice(0, 5).forEach(err => {
                        successMsg += `• ${err}\n`;
                      });
                      if (data.errors.length > 5) {
                        successMsg += `... and ${data.errors.length - 5} more errors\n`;
                      }
                    }
                    
                    alert(successMsg);
                    setBulkReadingComprehensionText('');
                    await fetchExams();
                  } else {
                    alert('Error: ' + (data.error || 'Failed to import passages'));
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                } finally {
                  setBulkReadingComprehensionImporting(false);
                }
              }}
              disabled={bulkReadingComprehensionImporting || !bulkReadingComprehensionText.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {bulkReadingComprehensionImporting ? '⏳ Importing and Distributing...' : '🚀 Import All 20 Passages & Distribute to Exams'}
            </button>
          </div>

          {/* CPCT Real Paper Import - One Time Import */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-3 font-bold">
              <strong>📥 Import Real CPCT Paper (21st Nov 2025 Shift 2 QP1):</strong>
            </p>
            <p className="text-xs text-blue-700 mb-3">
              Paste the complete exam paper text below. All questions will be imported and set as FREE.
              <br />You can edit questions and add images after import through the admin panel.
            </p>
            <textarea
              id="cpctPaperText"
              placeholder="Paste the complete CPCT exam paper text here..."
              className="w-full h-40 border border-gray-300 rounded p-2 text-sm mb-3 font-mono text-xs"
            />
            <button
              onClick={async () => {
                const textarea = document.getElementById('cpctPaperText');
                const examData = textarea?.value?.trim();
                
                if (!examData) {
                  alert('Please paste the exam paper text first!');
                  return;
                }
                
                if (!confirm('This will import the complete CPCT exam paper with all questions.\n\nAll questions will be set as FREE.\n\nContinue?')) return;
                
                try {
                  const res = await fetch('/api/admin/import-cpct-real-paper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ examData })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ ${data.message}\n\nImported: ${data.imported} questions\nErrors: ${data.errors}\n\n${data.note}`);
                    if (textarea) textarea.value = '';
                    await fetchExams();
                    // Select the CPCT exam if it exists
                    const cpctExam = exams.find(e => e.key === 'CPCT');
                    if (cpctExam) {
                      setSelectedExam(cpctExam._id);
                      fetchSections(cpctExam._id);
                    }
                  } else {
                    alert('Failed: ' + (data.error || 'Unknown error'));
                  }
                } catch (error) {
                  alert('Error: ' + error.message);
                }
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 text-sm font-bold"
            >
              📥 Import Real CPCT Paper
            </button>
          </div>

          {/* Four Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Exams Column */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Exams</h3>
                <button 
                  onClick={() => setShowExamForm(true)} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Exam
                </button>
              </div>
              <div className="p-4">
                {exams.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No exams yet. Click "+ Add Exam" to create one.</p>
                ) : (
                  <ul className="space-y-2">
            {exams.map(exam => (
              <li key={exam._id}>
                        <div className={`w-full rounded-lg border transition-colors ${
                            selectedExam === exam._id 
                              ? 'bg-[#290c52] text-white border-[#290c52]' 
                              : 'bg-white border-gray-200'
                          }`}>
                        <button 
                          className={`w-full text-left px-4 py-3 ${
                            selectedExam === exam._id 
                              ? 'text-white' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => { 
                            setSelectedExam(exam._id); 
                            setSelectedSection(null);
                            setSelectedPart(null);
                            fetchSections(exam._id);
                            setParts([]);
                            setQuestions([]);
                          }}
                        >
                          <div className="font-medium">{exam.title}</div>
                          <div className={`text-xs mt-1 ${selectedExam === exam._id ? 'text-gray-200' : 'text-gray-500'}`}>
                            Type: {exam.key} • {exam.totalQuestions} questions • {exam.totalTime} min
                          </div>
                        </button>
                        <div className={`px-4 pb-2 flex gap-2 flex-wrap ${selectedExam === exam._id ? 'border-t border-purple-300 pt-2' : ''}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingExam(exam);
                              setShowExamForm(true);
                            }}
                            className={`text-xs px-2 py-1 rounded ${
                              selectedExam === exam._id
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`⚠️ This will delete ALL questions for "${exam.title}". This action cannot be undone!\n\nAre you sure you want to continue?`)) return;
                              try {
                                setSaving(true);
                                const res = await fetch('/api/admin/clear-exam-questions', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ examId: exam._id })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  const msg = `Success! Cleared all questions for "${exam.title}":\n\n` +
                                    (data.deletedData.questions > 0 ? `• ${data.deletedData.questions} questions deleted\n` : '') +
                                    (data.deletedData.topicWiseMCQs > 0 ? `• ${data.deletedData.topicWiseMCQs} topic-wise MCQs deleted\n` : '') +
                                    (data.deletedData.parts > 0 ? `• ${data.deletedData.parts} parts deleted\n` : '');
                                  alert(msg);
                                  // Refresh questions if this exam is selected
                                  if (selectedExam === exam._id) {
                                    setSelectedSection(null);
                                    setSelectedPart(null);
                                    setQuestions([]);
                                    fetchSections(exam._id);
                                  }
                                } else {
                                  alert('Error: ' + (data.error || 'Failed to clear questions'));
                                }
                              } catch (error) {
                                console.error('Error clearing questions:', error);
                                alert('Failed to clear questions: ' + error.message);
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className={`text-xs px-2 py-1 rounded ${
                              selectedExam === exam._id
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            } disabled:bg-gray-400`}
                          >
                            Clear Questions
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExam(exam._id);
                            }}
                            className={`text-xs px-2 py-1 rounded ${
                              selectedExam === exam._id
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                        </div>
              </li>
            ))}
          </ul>
                )}
              </div>
        </div>

            {/* Sections Column */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Sections</h3>
                <button 
                  onClick={() => {
                    if (!selectedExam) {
                      alert('Please select an exam first');
                      return;
                    }
                    setShowSectionForm(true);
                  }} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
                  disabled={!selectedExam}
                >
                  + Add Section
                </button>
          </div>
              <div className="p-4">
                {!selectedExam ? (
                  <p className="text-gray-500 text-center py-8">Select an exam to view sections</p>
                ) : sections.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sections yet. Click "+ Add Section" to create one.</p>
                ) : (
                  <ul className="space-y-2">
            {sections.map(sec => (
              <li key={sec._id}>
                        <button 
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            selectedSection === sec._id 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`} 
                          onClick={() => { 
                            setSelectedSection(sec._id);
                            setSelectedPart(null);
                            fetchParts(selectedExam, sec._id);
                            setQuestions([]);
                          }}
                        >
                          <div className="font-medium">{sec.name}</div>
                        </button>
              </li>
            ))}
          </ul>
                )}
              </div>
        </div>

            {/* Parts Column */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Parts</h3>
                <button 
                  onClick={() => {
                    if (!selectedExam || !selectedSection) {
                      alert('Please select an exam and section first');
                      return;
                    }
                    setShowPartForm(true);
                  }} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
                  disabled={!selectedExam || !selectedSection}
                >
                  + Add Part
                </button>
          </div>
              <div className="p-4">
                {!selectedSection ? (
                  <p className="text-gray-500 text-center py-8">Select a section to view parts</p>
                ) : parts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No parts yet. Click "+ Add Part" to create one.</p>
                ) : (
                  <ul className="space-y-2">
            {parts.map(part => (
              <li key={part._id} className="flex gap-2">
                        <button 
                          className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors ${
                            selectedPart === part._id 
                              ? 'bg-purple-600 text-white border-purple-600' 
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`} 
                          onClick={() => { 
                            setSelectedPart(part._id);
                            fetchQuestions(selectedExam, selectedSection, part._id);
                          }}
                        >
                          <div className="font-medium">{part.name}</div>
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`⚠️ This will delete ALL questions from part "${part.name}". This action cannot be undone!\n\nAre you sure you want to continue?`)) return;
                            try {
                              setSaving(true);
                              const res = await fetch('/api/admin/clear-part-questions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ partId: part._id })
                              });
                              const data = await res.json();
                              if (res.ok) {
                                alert(`✅ Success! Cleared ${data.deletedCount} questions from part "${part.name}"`);
                                // Refresh questions if this part is selected
                                if (selectedPart === part._id) {
                                  setQuestions([]);
                                  fetchQuestions(selectedExam, selectedSection, part._id);
                                }
                              } else {
                                alert('Failed: ' + (data.error || 'Unknown error'));
                              }
                            } catch (error) {
                              alert('Error: ' + error.message);
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          title="Clear all questions from this part"
                        >
                          🗑️
                        </button>
              </li>
            ))}
          </ul>
                )}
              </div>
        </div>

            {/* Questions Column */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
                <button 
                  onClick={() => {
                    if (!selectedExam || !selectedSection || !selectedPart) {
                      alert('Please select an exam, section, and part first');
                      return;
                    }
                    setShowQuestionForm(true);
                  }} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
                  disabled={!selectedExam || !selectedSection || !selectedPart}
                >
                  + Add Question
                </button>
          </div>
              <div className="p-4">
                {!selectedPart ? (
                  <p className="text-gray-500 text-center py-8">Select a part to view questions</p>
                ) : questions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No questions yet. Click "+ Add Question" to create one.</p>
                ) : (
                  <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {questions.map(q => {
                      const questionType = q.questionType || 'MCQ';
                      const isTyping = questionType === 'TYPING';
                      
                      // Handle both options and options_en (for backward compatibility)
                      const options = q.options_en || q.options || [];
                      const options_hi = q.options_hi || [];
                      const questionText = q.question_en || q.question || '';
                      const questionTextHi = q.question_hi || '';
                      
                      // Typing question content
                      const typingContent = isTyping ? (
                        q.typingLanguage === 'English' 
                          ? q.typingContent_english 
                          : (q.typingScriptType === 'Ramington Gail' ? q.typingContent_hindi_ramington : q.typingContent_hindi_inscript)
                      ) : '';
                      
                      return (
                        <li key={q._id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              isTyping ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isTyping ? 'TYPING' : 'MCQ'}
                            </span>
                            {isTyping && q.typingLanguage && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                                {q.typingLanguage}
                                {q.typingLanguage === 'Hindi' && q.typingScriptType && ` - ${q.typingScriptType}`}
                              </span>
                            )}
                          </div>
                          
                          {isTyping ? (
                            <>
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Content:</strong> 
                                <div className="mt-1 p-2 bg-white border rounded font-serif text-sm max-h-32 overflow-y-auto">
                                  {typingContent || 'No content'}
                                </div>
                              </div>
                              {q.typingDuration && (
                                <div className="text-xs text-gray-600 mb-2">
                                  Duration: {q.typingDuration} minutes | Backspace: {q.typingBackspaceEnabled ? 'ON' : 'OFF'}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-gray-800 mb-2">{questionText}</div>
                              {questionTextHi && <div className="text-sm text-gray-600 mb-2">{questionTextHi}</div>}
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Options:</strong> {options.length > 0 ? options.map((opt, idx) => (
                                  <span key={idx} className={idx === q.correctAnswer ? 'font-bold text-green-700' : ''}>
                                    {opt}{idx < options.length - 1 ? ', ' : ''}
                                  </span>
                                )) : 'No options'}
                              </div>
                              {options_hi?.length > 0 ? (
                                <div className="text-sm text-gray-600 mb-2">
                                  <strong>Options (Hindi):</strong> {options_hi.join(', ')}
                                </div>
                              ) : null}
                            </>
                          )}
                          
                        <div className="flex justify-between items-center mt-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            q.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                    {q.isFree ? 'FREE' : 'PAID'}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => { 
                        console.log('✏️ Edit button clicked. Question data from list:', {
                          _id: q._id,
                          question_en: q.question_en,
                          imageUrl: q.imageUrl,
                          imageUrlType: typeof q.imageUrl,
                          hasImageUrl: !!q.imageUrl,
                          allKeys: Object.keys(q),
                          fullQuestion: JSON.parse(JSON.stringify(q))
                        });
                        
                        // Use the question from list directly - it should have imageUrl from fetchQuestions
                        // But also verify and log what we have
                        if (!q.imageUrl && q.question_en === '[Image Question]') {
                          console.warn('⚠️ WARNING: Image question without imageUrl in list! Fetching from API...');
                          // Fetch the full question data from API to ensure we have imageUrl
                          try {
                            const res = await fetch(`/api/admin/questions?examId=${selectedExam}&sectionId=${selectedSection}`);
                            const data = await res.json();
                            const fullQuestion = data.questions?.find(qq => qq._id === q._id);
                            if (fullQuestion) {
                              console.log('📥 Fetched full question from API:', {
                                _id: fullQuestion._id,
                                question_en: fullQuestion.question_en,
                                imageUrl: fullQuestion.imageUrl,
                                imageUrlType: typeof fullQuestion.imageUrl,
                                hasImageUrl: !!fullQuestion.imageUrl,
                                allKeys: Object.keys(fullQuestion)
                              });
                              setEditingQuestion(fullQuestion);
                            } else {
                              console.warn('⚠️ Full question not found in API response, using question from list');
                              setEditingQuestion(q);
                            }
                          } catch (error) {
                            console.error('❌ Error fetching full question:', error);
                            setEditingQuestion(q); // Fallback to question from list
                          }
                        } else {
                          // Question has imageUrl or is not an image question - use it directly
                          console.log('✅ Using question from list (has imageUrl or not image question)');
                          setEditingQuestion(q);
                        }
                        setShowQuestionForm(true); 
                      }}
                      className="text-xs px-3 py-1 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Edit
                    </button>
                  <button 
                    onClick={() => toggleFreeStatus(q._id, q.isFree)}
                            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                              q.isFree 
                                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                  >
                    Make {q.isFree ? 'Paid' : 'Free'}
                  </button>
                  </div>
                </div>
              </li>
                      );
                    })}
          </ul>
                )}
        </div>
      </div>
          </div>

          {/* Forms Modals */}
          {showExamForm && (
            <ExamFormModal 
              exam={editingExam}
              examTypes={examTypes}
              onSave={handleSaveExam} 
              onClose={() => { setShowExamForm(false); setEditingExam(null); }} 
              saving={saving}
            />
          )}
          {showSectionForm && (
            <SectionFormModal 
              onSave={handleSaveSection} 
              onClose={() => setShowSectionForm(false)} 
              saving={saving}
            />
          )}
          {showPartForm && (
            <PartFormModal 
              onSave={handleSavePart} 
              onClose={() => setShowPartForm(false)} 
              saving={saving}
            />
          )}
          {showQuestionForm && (
            <QuestionFormModal 
              question={editingQuestion}
              onSave={handleSaveQuestion} 
              onClose={() => { setShowQuestionForm(false); setEditingQuestion(null); }} 
              saving={saving}
            />
          )}
        </>
      )}

      {activeTab==='examTypes' && (
        <ExamTypesAdmin
          examTypes={examTypes}
          loading={examTypesLoading}
          onRefresh={fetchExamTypes}
          showForm={showExamTypeForm}
          setShowForm={setShowExamTypeForm}
          editingExamType={editingExamType}
          setEditingExamType={setEditingExamType}
        />
      )}

      {activeTab==='learning' && (
        <LearningAdmin />
      )}

      {activeTab==='skill' && (
        <SkillAdmin />
      )}

      {activeTab==='subscriptions' && (
        <SubscriptionsAdmin />
      )}

      {activeTab==='downloads' && (
        <DownloadsAdmin />
      )}

      {activeTab==='topicwise' && (
        <TopicWiseMCQAdmin />
      )}

      {activeTab==='pricing' && (
        <PricingAdmin />
      )}

      {activeTab==='tips' && (
        <TipsAdmin />
      )}

      {activeTab==='users' && (
        <UsersAdmin />
      )}

      {activeTab==='backspace' && (
        <BackspaceSettingsAdmin />
      )}
      </div>
    </div>
  );
}

function ExamTypesAdmin({ examTypes, loading, onRefresh, showForm, setShowForm, editingExamType, setEditingExamType }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSaveExamType = async (data) => {
    setError("");
    setSaving(true);
    try {
      const url = "/api/admin/exam-types";
      if (editingExamType?._id) {
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ _id: editingExamType._id, label: data.label, order: data.order, isTopicWise: data.isTopicWise }),
        });
        const out = await res.json();
        if (!res.ok) {
          setError(out.error || "Update failed");
          return;
        }
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ key: data.key, label: data.label, order: data.order, isTopicWise: data.isTopicWise }),
        });
        const out = await res.json();
        if (!res.ok) {
          setError(out.error || "Create failed");
          return;
        }
      }
      setShowForm(false);
      setEditingExamType(null);
      onRefresh();
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExamType = async (id, key) => {
    if (!confirm(`Delete exam type "${key}"? This will remove the tab from the Exam page. You cannot delete if any exams use this type.`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/exam-types?_id=${id}`, { method: "DELETE", credentials: "include" });
      const out = await res.json();
      if (!res.ok) {
        alert(out.error || "Delete failed");
        return;
      }
      onRefresh();
    } catch (e) {
      alert(e.message || "Request failed");
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Exam Types (Exam Mode Tabs)</h2>
        <button
          onClick={() => { setEditingExamType(null); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Exam Type
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        These are the tabs shown on the Exam page (e.g. CPCT, RSCIT, CCC, Topic Wise MCQ). Add new types so admins can create exams under them.
      </p>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b px-4 py-2 text-left">Order</th>
                <th className="border-b px-4 py-2 text-left">Key</th>
                <th className="border-b px-4 py-2 text-left">Label</th>
                <th className="border-b px-4 py-2 text-left">Topic Wise</th>
                <th className="border-b px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {examTypes.map((t) => (
                <tr key={t._id} className="border-b border-gray-100">
                  <td className="px-4 py-2">{t.order}</td>
                  <td className="px-4 py-2 font-mono text-sm">{t.key}</td>
                  <td className="px-4 py-2">{t.label}</td>
                  <td className="px-4 py-2">{t.isTopicWise ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => { setEditingExamType(t); setShowForm(true); }}
                      className="text-blue-600 hover:underline text-sm mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExamType(t._id, t.key)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <ExamTypeFormModal
          examType={editingExamType}
          onSave={handleSaveExamType}
          onClose={() => { setShowForm(false); setEditingExamType(null); setError(""); }}
          saving={saving}
          error={error}
        />
      )}
    </div>
  );
}

function ExamTypeFormModal({ examType, onSave, onClose, saving, error }) {
  const [key, setKey] = useState(examType?.key ?? "");
  const [label, setLabel] = useState(examType?.label ?? "");
  const [order, setOrder] = useState(examType?.order ?? 0);
  const [isTopicWise, setIsTopicWise] = useState(!!examType?.isTopicWise);

  useEffect(() => {
    if (examType) {
      setKey(examType.key ?? "");
      setLabel(examType.label ?? "");
      setOrder(examType.order ?? 0);
      setIsTopicWise(!!examType.isTopicWise);
    } else {
      setKey("");
      setLabel("");
      setOrder(0);
      setIsTopicWise(false);
    }
  }, [examType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const keyTrim = String(key).trim().toUpperCase().replace(/\s+/g, "_");
    if (!keyTrim && !examType) {
      return;
    }
    onSave({
      key: keyTrim || examType?.key,
      label: label.trim() || keyTrim || examType?.label,
      order: Number(order) || 0,
      isTopicWise,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{examType ? "Edit Exam Type" : "Add Exam Type"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-2">Key (unique) *</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. SSC, BANK"
              className="w-full border rounded-lg px-4 py-2"
              required={!examType}
              disabled={!!examType}
            />
            {examType && <p className="text-xs text-gray-500 mt-1">Key cannot be changed after creation.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Label (display name) *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. SSC, Banking"
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Order (tab order)</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTopicWise}
                onChange={(e) => setIsTopicWise(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-medium">Topic Wise MCQ (shows topic list instead of exam list)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400">
              {saving ? "Saving..." : (examType ? "Update" : "Create")}
            </button>
            <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TipsAdmin() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTipForm, setShowTipForm] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    fetchTips();
    fetchLessons();
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tips');
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
      }
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/learning');
      if (res.ok) {
        const data = await res.json();
        const allLessons = [];
        (data.sections || []).forEach(section => {
          (section.lessons || []).forEach(lesson => {
            allLessons.push({
              id: lesson.id,
              title: lesson.title,
              sectionName: section.name
            });
          });
        });
        setLessons(allLessons);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleSaveTip = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingTip ? 'PUT' : 'POST';
      const body = {
        ...formData,
        steps_en: formData.steps_en ? formData.steps_en.split('\n').filter(s => s.trim()) : [],
        steps_hi: formData.steps_hi ? formData.steps_hi.split('\n').filter(s => s.trim()) : [],
      };
      if (editingTip) {
        body._id = editingTip._id;
      }

      const res = await fetch('/api/admin/tips', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (res.ok) {
        await fetchTips();
        setShowTipForm(false);
        setEditingTip(null);
      } else {
        setSaveError(result.error || 'Failed to save tip');
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
      console.error('Save tip error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!confirm('Are you sure you want to delete this tip?')) return;
    try {
      const res = await fetch(`/api/admin/tips?_id=${tipId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTips();
      }
    } catch (error) {
      console.error('Error deleting tip:', error);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Tips Management</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => { setEditingTip(null); setShowTipForm(true); }} 
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
          >
            + Add Tip
          </button>
          <button onClick={fetchTips} className="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading tips...</p>
        </div>
      ) : tips.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">No tips yet. Click "+ Add Tip" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map(tip => (
            <div key={tip._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{tip.title_en}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Lesson: {tip.lessonId}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {tip.paragraph_en || 'No paragraph'}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setEditingTip(tip); setShowTipForm(true); }}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTip(tip._id)}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTipForm && (
        <Modal onClose={() => { setShowTipForm(false); setEditingTip(null); setSaveError(''); }}>
          <TipForm
            tip={editingTip}
            lessons={lessons}
            onSave={handleSaveTip}
            onCancel={() => { setShowTipForm(false); setEditingTip(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}
    </div>
  );
}

function TipForm({ tip, lessons, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    lessonId: tip?.lessonId || '',
    title_en: tip?.title_en || '',
    title_hi: tip?.title_hi || '',
    paragraph_en: tip?.paragraph_en || '',
    paragraph_hi: tip?.paragraph_hi || '',
    steps_en: tip?.steps_en?.join('\n') || '',
    steps_hi: tip?.steps_hi?.join('\n') || '',
    tip_en: tip?.tip_en || '',
    tip_hi: tip?.tip_hi || '',
    imageUrl: tip?.imageUrl || '/homefinger.jpg',
    cancelText_en: tip?.cancelText_en || 'Cancel',
    cancelText_hi: tip?.cancelText_hi || 'रद्द करें',
    nextText_en: tip?.nextText_en || 'Next',
    nextText_hi: tip?.nextText_hi || 'आगे',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">{tip ? 'Edit Tip' : 'Add New Tip'}</h3>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Lesson ID *</label>
          <select
            value={formData.lessonId}
            onChange={(e) => setFormData({...formData, lessonId: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Select a lesson</option>
            {lessons.map(lesson => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.sectionName} - {lesson.title} ({lesson.id})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title (English) *</label>
            <input
              type="text"
              value={formData.title_en}
              onChange={(e) => setFormData({...formData, title_en: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title (Hindi)</label>
            <input
              type="text"
              value={formData.title_hi}
              onChange={(e) => setFormData({...formData, title_hi: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Paragraph (English)</label>
            <textarea
              value={formData.paragraph_en}
              onChange={(e) => setFormData({...formData, paragraph_en: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paragraph (Hindi)</label>
            <textarea
              value={formData.paragraph_hi}
              onChange={(e) => setFormData({...formData, paragraph_hi: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              rows="3"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Steps (English) - One per line</label>
            <textarea
              value={formData.steps_en}
              onChange={(e) => setFormData({...formData, steps_en: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              rows="4"
              placeholder="Step 1&#10;Step 2&#10;Step 3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Steps (Hindi) - One per line</label>
            <textarea
              value={formData.steps_hi}
              onChange={(e) => setFormData({...formData, steps_hi: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              rows="4"
              placeholder="चरण 1&#10;चरण 2&#10;चरण 3"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tip (English)</label>
            <textarea
              value={formData.tip_en}
              onChange={(e) => setFormData({...formData, tip_en: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tip (Hindi)</label>
            <textarea
              value={formData.tip_hi}
              onChange={(e) => setFormData({...formData, tip_hi: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
              rows="2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="text"
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="/homefinger.jpg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cancel Button Text (English)</label>
            <input
              type="text"
              value={formData.cancelText_en}
              onChange={(e) => setFormData({...formData, cancelText_en: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cancel Button Text (Hindi)</label>
            <input
              type="text"
              value={formData.cancelText_hi}
              onChange={(e) => setFormData({...formData, cancelText_hi: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Next Button Text (English)</label>
            <input
              type="text"
              value={formData.nextText_en}
              onChange={(e) => setFormData({...formData, nextText_en: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Next Button Text (Hindi)</label>
            <input
              type="text"
              value={formData.nextText_hi}
              onChange={(e) => setFormData({...formData, nextText_hi: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMembershipOnly, setShowMembershipOnly] = useState(false);
  const [userFiles, setUserFiles] = useState([]);
  const [userTopics, setUserTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ fileType: 'pdf_notes', file: null, description: '' });
  const [topicForm, setTopicForm] = useState({ topicId: '', topicName: '', description: '' });
  const [assigningTopic, setAssigningTopic] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchAllTopics();
  }, []);

  useEffect(() => {
    if (selectedUser && selectedUser.activeSubscriptions > 0) {
      fetchUserFiles(selectedUser._id);
      fetchUserTopics(selectedUser._id);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTopics = async () => {
    try {
      const res = await fetch('/api/admin/topicwise/topics', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAllTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchUserFiles = async (userId) => {
    try {
      const res = await fetch(`/api/admin/user-files?userId=${userId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUserFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch user files:', error);
    }
  };

  const fetchUserTopics = async (userId) => {
    try {
      const res = await fetch(`/api/admin/user-topics?userId=${userId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUserTopics(data.assignments || []);
      }
    } catch (error) {
      console.error('Failed to fetch user topics:', error);
    }
  };

  const handleFileChange = (e) => {
    setUploadForm({ ...uploadForm, file: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !selectedUser) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('userId', selectedUser._id);
      formData.append('fileType', uploadForm.fileType);
      formData.append('description', uploadForm.description);

      const res = await fetch('/api/admin/upload-user-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (res.ok) {
        await fetchUserFiles(selectedUser._id);
        setUploadForm({ fileType: 'pdf_notes', file: null, description: '' });
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('PDF uploaded successfully!');
      } else {
        const data = await res.json();
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTopicSelect = (e) => {
    const topicId = e.target.value;
    const topic = allTopics.find(t => t.topicId === topicId);
    if (topic) {
      setTopicForm({
        topicId: topic.topicId,
        topicName: topic.topicName,
        description: topicForm.description
      });
    }
  };

  const handleAssignTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.topicId || !selectedUser) return;

    setAssigningTopic(true);
    try {
      const res = await fetch('/api/admin/user-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser._id,
          topicId: topicForm.topicId,
          topicName: topicForm.topicName,
          description: topicForm.description
        }),
        credentials: 'include'
      });

      if (res.ok) {
        await fetchUserTopics(selectedUser._id);
        setTopicForm({ topicId: '', topicName: '', description: '' });
        alert('Topic assigned successfully!');
      } else {
        const data = await res.json();
        alert('Assignment failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Topic assignment error:', error);
      alert('Assignment failed: ' + error.message);
    } finally {
      setAssigningTopic(false);
    }
  };

  const handleRemoveTopic = async (assignmentId) => {
    if (!confirm('Are you sure you want to remove this topic assignment?')) return;

    try {
      const res = await fetch(`/api/admin/user-topics?assignmentId=${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        await fetchUserTopics(selectedUser._id);
        alert('Topic assignment removed successfully!');
      } else {
        alert('Failed to remove topic assignment');
      }
    } catch (error) {
      console.error('Topic removal error:', error);
      alert('Failed to remove topic assignment');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phoneNumber?.includes(searchTerm) ||
      user.referralCode?.toLowerCase().includes(searchLower)
    );
    
    if (showMembershipOnly) {
      return matchesSearch && user.activeSubscriptions > 0;
    }
    return matchesSearch;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">All Users</h2>
        <div className="mb-4 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search by name, email, phone, or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md border rounded-lg px-4 py-2"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMembershipOnly}
              onChange={(e) => setShowMembershipOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Show Membership Users Only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City/State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscriptions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedUser(selectedUser?._id === user._id ? null : user)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {user.role === 'admin' && (
                          <span className="text-xs text-purple-600 font-semibold">Admin</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.city}, {user.states}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{user.referralCode || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className={`font-semibold ${user.activeSubscriptions > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {user.activeSubscriptions}
                          </span>
                          <span className="text-gray-500"> / {user.totalSubscriptions}</span>
                          {user.activeSubscriptions > 0 && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Member</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-semibold text-blue-600">{user.referralsGiven}</span>
                          <span className="text-gray-500"> given</span>
                          {user.referralsReceived > 0 && (
                            <span className="text-gray-500">, {user.referralsReceived} received</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="border-t bg-gray-50 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">User Details: {selectedUser.name}</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Account details (as created)</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Name</p>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="font-medium text-gray-900">{selectedUser.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">State</p>
                    <p className="font-medium text-gray-900">{selectedUser.states || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">City</p>
                    <p className="font-medium text-gray-900">{selectedUser.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Role</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedUser.role || 'user'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Referral Code</p>
                    <p className="font-medium font-mono text-gray-900">{selectedUser.referralCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Referral Rewards</p>
                    <p className="font-medium text-gray-900">{selectedUser.referralRewards ?? 0} months earned</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Referred by (user ID)</p>
                    <p className="font-medium font-mono text-gray-900 text-xs">{selectedUser.referredBy ? String(selectedUser.referredBy) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Profile photo</p>
                    {selectedUser.profileUrl ? (
                      <a href={selectedUser.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View URL</a>
                    ) : (
                      <p className="font-medium text-gray-500">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Joined (created)</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Last updated</p>
                    <p className="font-medium text-gray-900">{selectedUser.updatedAt ? formatDate(selectedUser.updatedAt) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Subscriptions</p>
                    <p className="font-medium text-gray-900">{selectedUser.totalSubscriptions} total ({selectedUser.activeSubscriptions} active)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Referrals</p>
                    <p className="font-medium text-gray-900">{selectedUser.referralsGiven} given, {selectedUser.referralsReceived ?? 0} received</p>
                  </div>
                </div>
              </div>

              {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Active Subscriptions:</p>
                  <div className="space-y-2">
                    {selectedUser.subscriptions.map((sub) => (
                      <div key={sub._id} className="bg-white border rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">{sub.type} - {sub.plan}</span>
                          <span className="text-sm text-gray-600">
                            Expires: {formatDate(sub.endDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Membership Operations - Only show for users with active subscriptions */}
              {selectedUser && selectedUser.activeSubscriptions > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-700">Individual User File Upload</h3>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This uploads files to <strong>this specific user only</strong>. 
                      For membership-based notes (available to ALL members), use the <strong>"Downloads"</strong> tab instead.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* PDF Notes Upload Section */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-semibold mb-3 text-blue-800">📄 Upload PDF Notes (Individual User)</h4>
                      <form onSubmit={handleUpload} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">File Type</label>
                          <select
                            value={uploadForm.fileType}
                            onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                          >
                            <option value="pdf_notes">PDF Notes</option>
                            <option value="syllabus_pdf">Syllabus PDF</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Select PDF File</label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="w-full border rounded px-3 py-2 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                          <textarea
                            placeholder="Add a description for this PDF..."
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            rows="2"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={uploading || !uploadForm.file}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          {uploading ? 'Uploading...' : 'Upload PDF'}
                        </button>
                      </form>

                      {/* Uploaded PDFs List */}
                      {userFiles.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <h5 className="text-sm font-semibold mb-2">Uploaded PDFs:</h5>
                          <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {userFiles.map(file => (
                              <li key={file._id} className="bg-white border rounded p-2 text-xs">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium">{file.fileName}</div>
                                    <div className="text-gray-600 text-xs mt-1">
                                      {file.fileType === 'pdf_notes' ? 'PDF Notes' : 'Syllabus PDF'}
                                    </div>
                                    {file.description && (
                                      <div className="text-gray-500 text-xs mt-1">{file.description}</div>
                                    )}
                                  </div>
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
                                  >
                                    View
                                  </a>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Topic-wise MCQ Assignment Section */}
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h4 className="font-semibold mb-3 text-purple-800">📚 Assign Topic-wise MCQ</h4>
                      <form onSubmit={handleAssignTopic} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Select Topic</label>
                          <select
                            value={topicForm.topicId}
                            onChange={handleTopicSelect}
                            className="w-full border rounded px-3 py-2 text-sm"
                            required
                          >
                            <option value="">-- Select a topic --</option>
                            {allTopics
                              .filter(topic => !userTopics.some(ut => ut.topicId === topic.topicId))
                              .map(topic => (
                                <option key={topic.topicId} value={topic.topicId}>
                                  {topic.topicName}
                                </option>
                              ))}
                          </select>
                        </div>
                        {topicForm.topicId && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                            <textarea
                              placeholder="Add notes about this topic assignment..."
                              value={topicForm.description}
                              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm"
                              rows="2"
                            />
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={assigningTopic || !topicForm.topicId}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          {assigningTopic ? 'Assigning...' : 'Assign Topic'}
                        </button>
                      </form>

                      {/* Assigned Topics List */}
                      {userTopics.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <h5 className="text-sm font-semibold mb-2">Assigned Topics:</h5>
                          <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {userTopics.map(assignment => (
                              <li key={assignment._id} className="bg-white border rounded p-2 text-xs">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium">{assignment.topicName}</div>
                                    {assignment.description && (
                                      <div className="text-gray-500 text-xs mt-1">{assignment.description}</div>
                                    )}
                                    <div className="text-gray-400 text-xs mt-1">
                                      Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveTopic(assignment._id)}
                                    className="text-red-600 hover:text-red-800 ml-2 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Form Modal Components
function ExamFormModal({ exam, examTypes = [], onSave, onClose, saving }) {
  const defaultKey = examTypes.length > 0 ? (examTypes.find((t) => !t.isTopicWise)?.key || examTypes[0].key) : 'CPCT';
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    key: exam?.key || defaultKey,
    totalTime: exam?.totalTime || 75,
    totalQuestions: exam?.totalQuestions || 75,
    isFree: exam?.isFree !== undefined ? exam.isFree : false
  });

  useEffect(() => {
    const keyDefault = examTypes.length > 0 ? (examTypes.find((t) => !t.isTopicWise)?.key || examTypes[0].key) : 'CPCT';
    if (exam) {
      setFormData({
        title: exam.title || '',
        key: exam.key || keyDefault,
        totalTime: exam.totalTime || 75,
        totalQuestions: exam.totalQuestions || 75,
        isFree: exam.isFree !== undefined ? exam.isFree : false
      });
    } else {
      setFormData({
        title: '',
        key: keyDefault,
        totalTime: 75,
        totalQuestions: 75,
        isFree: false
      });
    }
  }, [exam, examTypes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{exam ? 'Edit Exam' : 'Add New Exam'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Exam Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="e.g., May 2025 - Paper 1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Exam Type *</label>
            <select
              value={formData.key}
              onChange={(e) => setFormData({...formData, key: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              required
              disabled={!!exam}
            >
              {examTypes.filter((t) => !t.isTopicWise).map((t) => (
                <option key={t._id} value={t.key}>{t.label} ({t.key})</option>
              ))}
              {examTypes.length === 0 && (
                <>
                  <option value="CPCT">CPCT</option>
                  <option value="RSCIT">RSCIT</option>
                  <option value="CCC">CCC</option>
                  <option value="CUSTOM">TOPIC WISE (CUSTOM)</option>
                </>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {exam ? 'Exam type cannot be changed after creation' : 'This determines which exam mode it appears in. Add more types under Exam Types tab.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total Time (minutes) *</label>
              <input
                type="number"
                value={formData.totalTime}
                onChange={(e) => setFormData({...formData, totalTime: parseInt(e.target.value) || 75})}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Questions *</label>
              <input
                type="number"
                value={formData.totalQuestions}
                onChange={(e) => setFormData({...formData, totalQuestions: parseInt(e.target.value) || 75})}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Free Exam (Users can take without membership)</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              {formData.isFree 
                ? '✓ This exam is free - all users can access it' 
                : 'This exam requires a membership/subscription to access'}
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : (exam ? 'Update Exam' : 'Create Exam')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PartFormModal({ onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    order: ''
  });

  // Auto-generate ID from name
  const handleNameChange = (name) => {
    const generatedId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({...formData, name, id: generatedId});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add New Part</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Part Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="e.g., Part 1, Part A"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Name of the part within this section</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Part ID</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Auto-generated from name"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated from name if left empty</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Display order (optional)</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Create Part'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionFormModal({ onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    lessonNumber: '',
    order: '',
    typingTime: ''
  });

  // Auto-generate ID from name
  const handleNameChange = (name) => {
    const autoId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({...formData, name, id: autoId || formData.id});
  };

  const handleSubmit = (e) => { 
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add New Section</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Section Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="e.g., General IT Skills & Networking"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Name of the section (e.g., Reading Comprehension, Aptitude)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Section ID *</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Auto-generated from name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier (auto-generated, but you can edit it)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Order Number</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Auto"
              />
              <p className="text-xs text-gray-500 mt-1">Display order (optional)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lesson Number *</label>
              <input
                type="number"
                value={formData.lessonNumber}
                onChange={(e) => setFormData({...formData, lessonNumber: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required field</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Typing Time (minutes)</label>
            <input
              type="number"
              value={formData.typingTime}
              onChange={(e) => setFormData({...formData, typingTime: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Leave empty if not a typing section"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">If set, this section will have separate timing (doesn't count towards main exam time). Leave empty for regular sections.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Create Section'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionFormModal({ question, onSave, onClose, saving }) {
  console.log('📋 QuestionFormModal rendered with question:', {
    _id: question?._id,
    question_en: question?.question_en,
    imageUrl: question?.imageUrl,
    imageUrlType: typeof question?.imageUrl,
    hasImageUrl: !!question?.imageUrl,
    allKeys: question ? Object.keys(question) : []
  });
  
  // Initialize formData - will be updated by useEffect when question prop changes
  const [formData, setFormData] = useState({
    questionType: question?.questionType || 'MCQ',
    // MCQ fields
    question: question?.question_en === '[Image Question]' ? '' : (question?.question_en || ''),
    question_hi: question?.question_hi || '',
    options: question?.options_en?.join(', ') || '',
    options_hi: question?.options_hi?.join(', ') || '',
    correctAnswer: question?.correctAnswer || 0,
    marks: question?.marks || 1,
    negativeMarks: question?.negativeMarks || 0,
    imageUrl: (question?.imageUrl && question.imageUrl.trim() !== '') ? question.imageUrl : '',
    imageWidth: question?.imageWidth || '',
    imageHeight: question?.imageHeight || '',
    useImageForQuestion: question?.question_en === '[Image Question]' || !!(question?.imageUrl && question.imageUrl.trim() !== ''), // Check if question uses image
    // Typing fields
    typingLanguage: question?.typingLanguage || 'English',
    typingScriptType: question?.typingScriptType || 'Ramington Gail',
    typingContent_english: question?.typingContent_english || '',
    typingContent_hindi_ramington: question?.typingContent_hindi_ramington || '',
    typingContent_hindi_inscript: question?.typingContent_hindi_inscript || '',
    typingDuration: question?.typingDuration || 5,
    typingBackspaceEnabled: question?.typingBackspaceEnabled || false,
    isFree: question?.isFree || false,
    solutionVideoLink: question?.solutionVideoLink || '',
    explanation_en: question?.explanation_en || '',
    explanation_hi: question?.explanation_hi || ''
  });

  // Update formData when question prop changes (for editing)
  useEffect(() => {
    if (question) {
      // Check if it's an image question: either has imageUrl OR question_en is '[Image Question]'
      const imageUrlValue = (question.imageUrl && typeof question.imageUrl === 'string' && question.imageUrl.trim() !== '') 
        ? question.imageUrl.trim() 
        : '';
      const isImageQuestion = question.question_en === '[Image Question]' || imageUrlValue !== '';
      const hasImage = imageUrlValue !== '';
      
      console.log('📝 Loading question for editing:', {
        _id: question._id,
        question_en: question.question_en,
        imageUrl_raw: question.imageUrl,
        imageUrl_processed: imageUrlValue,
        imageUrlType: typeof question.imageUrl,
        isImageQuestion: isImageQuestion,
        hasImage: hasImage,
        allQuestionKeys: Object.keys(question)
      });
      
      setFormData({
        questionType: question.questionType || 'MCQ',
        question: question.question_en === '[Image Question]' ? '' : (question.question_en || ''), // Don't show '[Image Question]' as text
        question_hi: question.question_hi || '',
        options: question.options_en?.join(', ') || '',
        options_hi: question.options_hi?.join(', ') || '',
        correctAnswer: question.correctAnswer || 0,
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0,
        imageUrl: imageUrlValue, // Keep the imageUrl value (even if empty string)
        imageWidth: question.imageWidth || '',
        imageHeight: question.imageHeight || '',
        useImageForQuestion: isImageQuestion, // Set to true if marked as image question OR has imageUrl
        typingLanguage: question.typingLanguage || 'English',
        typingScriptType: question.typingScriptType || 'Ramington Gail',
        typingContent_english: question.typingContent_english || '',
        typingContent_hindi_ramington: question.typingContent_hindi_ramington || '',
        typingContent_hindi_inscript: question.typingContent_hindi_inscript || '',
        typingDuration: question.typingDuration || 5,
        typingBackspaceEnabled: question.typingBackspaceEnabled || false,
        isFree: question.isFree || false,
        solutionVideoLink: question.solutionVideoLink || '',
        explanation_en: question.explanation_en || '',
        explanation_hi: question.explanation_hi || ''
      });
    } else {
      // Reset form when creating new question
      setFormData({
        questionType: 'MCQ',
    question: '',
    question_hi: '',
    options: '',
    options_hi: '',
    correctAnswer: 0,
        marks: 1,
        negativeMarks: 0,
        imageUrl: '',
        imageWidth: '',
        imageHeight: '',
        useImageForQuestion: false,
    typingLanguage: 'English',
    typingScriptType: 'Ramington Gail',
    typingContent_english: '',
    typingContent_hindi_ramington: '',
    typingContent_hindi_inscript: '',
    typingDuration: 5,
    typingBackspaceEnabled: false,
    isFree: false,
    solutionVideoLink: '',
    explanation_en: '',
    explanation_hi: ''
  });
    }
  }, [question]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">Add New Question</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Question Type Selection */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-semibold mb-2 text-gray-800">Question Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded cursor-pointer border-2 transition-all ${
                formData.questionType === 'MCQ' 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white border-gray-300 hover:bg-blue-50'
              }`}>
                <input
                  type="radio"
                  name="questionType"
                  value="MCQ"
                  checked={formData.questionType === 'MCQ'}
                  onChange={(e) => setFormData({...formData, questionType: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="font-medium">MCQ (Multiple Choice)</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded cursor-pointer border-2 transition-all ${
                formData.questionType === 'TYPING' 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white border-gray-300 hover:bg-blue-50'
              }`}>
                <input
                  type="radio"
                  name="questionType"
                  value="TYPING"
                  checked={formData.questionType === 'TYPING'}
                  onChange={(e) => setFormData({...formData, questionType: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="font-medium">Typing Test</span>
              </label>
            </div>
          </div>

          {/* MCQ Fields */}
          {formData.questionType === 'MCQ' && (
            <>
              {/* Question Format Selection: Text or Image */}
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Question Format *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded cursor-pointer border-2 transition-all ${
                    !formData.useImageForQuestion 
                      ? 'bg-yellow-600 text-white border-yellow-700' 
                      : 'bg-white border-gray-300 hover:bg-yellow-50'
                  }`}>
                    <input
                      type="radio"
                      name="questionFormat"
                      checked={!formData.useImageForQuestion}
                      onChange={() => setFormData({...formData, useImageForQuestion: false, imageUrl: ''})}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Text Question</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded cursor-pointer border-2 transition-all ${
                    formData.useImageForQuestion 
                      ? 'bg-yellow-600 text-white border-yellow-700' 
                      : 'bg-white border-gray-300 hover:bg-yellow-50'
                  }`}>
                    <input
                      type="radio"
                      name="questionFormat"
                      checked={formData.useImageForQuestion}
                      onChange={() => setFormData({...formData, useImageForQuestion: true, question: '', question_hi: ''})}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Image Question</span>
                  </label>
                </div>
              </div>

              {/* Text Question Fields */}
              {!formData.useImageForQuestion && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Question (English) *</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="3"
                  placeholder="Enter the question in English"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Question (Hindi) - Optional</label>
                <textarea
                  value={formData.question_hi}
                  onChange={(e) => setFormData({...formData, question_hi: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="3"
                  placeholder="Enter the question in Hindi (optional)"
                />
              </div>
                </>
              )}

              {/* Image Question Field */}
              {formData.useImageForQuestion && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <label className="block text-sm font-semibold mb-2 text-gray-800">Upload Question Image *</label>
                  <p className="text-xs text-gray-600 mb-3">Upload an image that contains the question. The question text will be in the image.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);
                        formDataUpload.append('type', 'question-image');
                        try {
                          console.log('📤 Uploading image file:', file.name, file.size, 'bytes');
                          const res = await fetch('/api/admin/upload-question-image', {
                            method: 'POST',
                            credentials: 'include',
                            body: formDataUpload
                          });
                          const data = await res.json();
                          console.log('📥 Image upload response:', {
                            ok: res.ok,
                            status: res.status,
                            imageUrl: data.imageUrl,
                            error: data.error,
                            fullResponse: data
                          });
                          if (res.ok && data.imageUrl) {
                            console.log('✅ Image uploaded successfully. Setting formData.imageUrl to:', data.imageUrl);
                            setFormData(prev => {
                              const updated = {...prev, imageUrl: data.imageUrl};
                              console.log('✅ Updated formData.imageUrl:', updated.imageUrl);
                              return updated;
                            });
                          } else {
                            console.error('❌ Image upload failed:', data.error || 'Unknown error');
                            alert('Failed to upload image: ' + (data.error || 'Unknown error'));
                          }
                        } catch (error) {
                          console.error('❌ Image upload error:', error);
                          alert('Failed to upload image: ' + error.message);
                        }
                      }
                    }}
                    className="w-full border rounded-lg px-4 py-2"
                    required={formData.useImageForQuestion}
                  />
                  {/* Always show current imageUrl value for debugging */}
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <strong>Debug Info:</strong> formData.imageUrl = <code>"{formData.imageUrl || '(empty)'}"</code> 
                    <br />
                    <strong>Type:</strong> {typeof formData.imageUrl} | 
                    <strong> Length:</strong> {formData.imageUrl ? formData.imageUrl.length : 0}
                  </div>
                  
                  {formData.imageUrl && formData.imageUrl.trim() !== '' ? (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Current Image URL: <code className="bg-gray-100 px-2 py-1 rounded">{formData.imageUrl}</code></p>
                      <img 
                        src={formData.imageUrl} 
                        alt="Question preview" 
                        className="max-w-full h-auto rounded border shadow-sm"
                        onError={(e) => {
                          console.error('❌ Image preview failed to load:', formData.imageUrl);
                          console.error('   Attempted URL:', e.target.src);
                          e.target.style.border = '2px solid red';
                          e.target.alt = 'Image failed to load: ' + formData.imageUrl;
                        }}
                        onLoad={(e) => {
                          console.log('✅ Image preview loaded successfully:', formData.imageUrl);
                          // Auto-fill width/height if not set
                          if (!formData.imageWidth && !formData.imageHeight) {
                            const img = e.target;
                            setFormData(prev => ({
                              ...prev,
                              imageWidth: img.naturalWidth || '',
                              imageHeight: img.naturalHeight || ''
                            }));
                          }
                        }}
                      />
                      {/* Width and Height Adjustment */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-700">Image Width (px)</label>
                          <input
                            type="number"
                            value={formData.imageWidth}
                            onChange={(e) => setFormData({...formData, imageWidth: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="Auto"
                            min="1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Leave empty for auto (responsive)</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-700">Image Height (px)</label>
                          <input
                            type="number"
                            value={formData.imageHeight}
                            onChange={(e) => setFormData({...formData, imageHeight: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="Auto"
                            min="1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Leave empty for auto (responsive)</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🗑️ Removing image. Current imageUrl:', formData.imageUrl);
                          setFormData({...formData, imageUrl: '', imageWidth: '', imageHeight: ''});
                        }}
                        className="mt-2 text-red-600 text-sm hover:underline"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : formData.useImageForQuestion ? (
                    <p className="mt-2 text-xs text-yellow-600">⚠️ No image uploaded yet. Please upload an image.</p>
                  ) : null}
                </div>
              )}

              {/* Options (same for both text and image questions) */}
              <div>
                <label className="block text-sm font-medium mb-2">Options (English) *</label>
                <input
                  type="text"
                  value={formData.options}
                  onChange={(e) => setFormData({...formData, options: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Option 1, Option 2, Option 3, Option 4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Options (Hindi) - Optional</label>
                <input
                  type="text"
                  value={formData.options_hi}
                  onChange={(e) => setFormData({...formData, options_hi: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="विकल्प 1, विकल्प 2, विकल्प 3, विकल्प 4"
                />
                <p className="text-xs text-gray-500 mt-1">Separate options with commas (optional)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Correct Answer Index *</label>
                <input
                  type="number"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({...formData, correctAnswer: parseInt(e.target.value) || 0})}
                  className="w-full border rounded-lg px-4 py-2"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">0 = first option, 1 = second option, etc.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Marks per Question *</label>
                  <input
                    type="number"
                    value={formData.marks || 1}
                    onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value) || 1})}
                    className="w-full border rounded-lg px-4 py-2"
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 1 mark</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Negative Marks</label>
                  <input
                    type="number"
                    value={formData.negativeMarks || 0}
                    onChange={(e) => setFormData({...formData, negativeMarks: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded-lg px-4 py-2"
                    min="0"
                    step="0.25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Marks deducted for wrong answer (e.g., 0.25)</p>
                </div>
              </div>
              
              {/* Solution Video Link */}
              <div>
                <label className="block text-sm font-medium mb-2">Solution Video Link (Optional)</label>
                <input
                  type="url"
                  value={formData.solutionVideoLink || ''}
                  onChange={(e) => setFormData({...formData, solutionVideoLink: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-xs text-gray-500 mt-1">Enter Google Drive link or any video URL for solution. This will be shown in the result page.</p>
              </div>
              
              {/* Explanation Fields */}
              <div>
                <label className="block text-sm font-medium mb-2">Explanation (English) - Optional</label>
                <textarea
                  value={formData.explanation_en || ''}
                  onChange={(e) => setFormData({...formData, explanation_en: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="3"
                  placeholder="Enter a brief explanation for the correct answer"
                />
                <p className="text-xs text-gray-500 mt-1">A one-liner explanation that will be shown in the result page below the options.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Explanation (Hindi) - Optional</label>
                <textarea
                  value={formData.explanation_hi || ''}
                  onChange={(e) => setFormData({...formData, explanation_hi: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="3"
                  placeholder="सही उत्तर के लिए एक संक्षिप्त व्याख्या दर्ज करें"
                />
                <p className="text-xs text-gray-500 mt-1">विकल्पों के नीचे परिणाम पृष्ठ पर दिखाई जाने वाली एक-पंक्ति व्याख्या।</p>
              </div>
            </>
          )}

          {/* Typing Fields */}
          {formData.questionType === 'TYPING' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Typing Language *</label>
                  <select
                    value={formData.typingLanguage}
                    onChange={(e) => setFormData({...formData, typingLanguage: e.target.value, typingScriptType: e.target.value === 'Hindi' ? 'Ramington Gail' : ''})}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                {formData.typingLanguage === 'Hindi' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Script Type *</label>
                    <select
                      value={formData.typingScriptType}
                      onChange={(e) => setFormData({...formData, typingScriptType: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2"
                      required
                    >
                      <option value="Ramington Gail">Ramington Gail</option>
                      <option value="Inscript">Inscript</option>
                    </select>
                  </div>
                )}
              </div>
              
              {formData.typingLanguage === 'English' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Typing Content (English) *</label>
                  <textarea
                    value={formData.typingContent_english}
                    onChange={(e) => setFormData({...formData, typingContent_english: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 font-serif"
                    rows="8"
                    placeholder="Enter the text that users need to type (e.g., zinc next back zinc next back...)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This is the text that users will type during the test</p>
                </div>
              )}

              {formData.typingLanguage === 'Hindi' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Typing Content (Hindi - Ramington Gail) *</label>
                    <HindiTextarea
                      layout="remington"
                      value={formData.typingContent_hindi_ramington}
                      onChange={(e) => setFormData({...formData, typingContent_hindi_ramington: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 font-serif"
                      rows="8"
                      placeholder="Enter the Hindi text in Ramington Gail script (type in English to convert)"
                      required={formData.typingScriptType === 'Ramington Gail'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Typing Content (Hindi - Inscript) *</label>
                    <HindiTextarea
                      layout="inscript"
                      value={formData.typingContent_hindi_inscript}
                      onChange={(e) => setFormData({...formData, typingContent_hindi_inscript: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 font-serif"
                      rows="8"
                      placeholder="Enter the Hindi text in Inscript script (type in English to convert)"
                      required={formData.typingScriptType === 'Inscript'}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (Minutes) *</label>
                  <select
                    value={formData.typingDuration}
                    onChange={(e) => setFormData({...formData, typingDuration: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  >
                    <option value="2">2 Minutes</option>
                    <option value="5">5 Minutes</option>
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes</option>
                  </select>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.typingBackspaceEnabled}
                      onChange={(e) => setFormData({...formData, typingBackspaceEnabled: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">Enable Backspace</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Common Fields */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Make this question FREE</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Create Question'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LearningAdmin(){
  const [data, setData] = useState({ sections: [], lessons: [] });
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/learning');
      const d = await res.json();
      const newData = { sections: d.sections||[], lessons: d.lessons||[] };
      setData(newData);
      // Re-select the section if it was selected
      if (selectedSection) {
        const updatedSection = newData.sections.find(s => s.id === selectedSection.id);
        if (updatedSection) {
          setSelectedSection(updatedSection);
        } else {
          setSelectedSection(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ refresh(); },[]);

  const handleDeleteSection = async (sectionId) => {
    setShowDeleteConfirm({ type: 'section', id: sectionId });
  };

  const handleDeleteLesson = async (lessonId) => {
    setShowDeleteConfirm({ type: 'lesson', id: lessonId });
  };

  const handleDeleteAllSections = async () => {
    setShowDeleteConfirm({ type: 'section', deleteAll: true });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    const { type, id, deleteAll } = showDeleteConfirm;
    
    if (deleteAll && type === 'section') {
      const res = await fetch(`/api/admin/learning?type=${type}&deleteAll=true`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        setSelectedSection(null);
        setShowDeleteConfirm(null);
      }
    } else {
      const res = await fetch(`/api/admin/learning?type=${type}&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        if (type === 'section') setSelectedSection(null);
        setShowDeleteConfirm(null);
      }
    }
  };

  const handleSaveSection = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingSection ? 'PUT' : 'POST';
      const body = {
        type: 'section',
        id: formData.id,
        name: formData.name,
        description: formData.description || '',
        lessonNumber: parseInt(formData.lessonNumber) || 0
      };
      if (editingSection) {
        body._id = editingSection._id;
      }
      const res = await fetch('/api/admin/learning', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      let result;
      const text = await res.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setSaveError(`Server error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 100)}`);
        return;
      }
      
      if (res.ok) {
        await refresh();
        setShowSectionForm(false);
        setEditingSection(null);
      } else {
        setSaveError(result.error || `Failed to save section (${res.status})`);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
      console.error('Save section error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingLesson ? 'PUT' : 'POST';
      const lessonTypeValue = formData.lessonType === 'word' ? 'word' : 'alpha';
      const body = {
        type: 'lesson',
        sectionId: formData.sectionId,
        id: formData.id,
        title: formData.title,
        title_hindi: formData.title_hindi || '',
        description: formData.description || '',
        description_hindi: formData.description_hindi || '',
        difficulty: formData.difficulty || 'beginner',
        estimatedTime: formData.estimatedTime || '5 minutes',
        lessonType: lessonTypeValue,
        content: {
          english: formData.content_english || '',
          hindi_ramington: formData.content_hindi_ramington || '',
          hindi_inscript: formData.content_hindi_inscript || ''
        },
        isFree: formData.isFree === true || formData.isFree === 'true'
      };
      if (editingLesson) {
        body._id = editingLesson._id;
      }
      console.log('[Admin Save Lesson] formData.lessonType:', formData.lessonType, '-> body.lessonType:', body.lessonType, 'method:', editingLesson ? 'PUT' : 'POST', 'body._id:', body._id);
      const res = await fetch('/api/admin/learning', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      let result;
      const text = await res.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setSaveError(`Server error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 100)}`);
        return;
      }
      
      if (res.ok) {
        console.log('[Admin Save Lesson] API success, result.lesson.lessonType:', result?.lesson?.lessonType);
        await refresh();
        setShowLessonForm(false);
        setEditingLesson(null);
        // Re-select the section if it was selected
        if (selectedSection) {
          const updatedSection = data.sections.find(s => s.id === selectedSection.id);
          if (updatedSection) setSelectedSection(updatedSection);
        }
      } else {
        setSaveError(result.error || `Failed to save lesson (${res.status})`);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
      console.error('Save lesson error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDemoWordLesson = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/learning/demo-word-lesson', { method: 'POST' });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success) {
        await refresh();
        setSaveError('');
        alert(result.message || 'Demo word lesson added to Home (order 1).');
      } else {
        setSaveError(result.error || 'Failed to add demo word lesson.');
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleLessonFree = async (lessonId, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await fetch(`/api/admin/learning/lesson/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFree: newStatus })
    });
    if (res.ok) refresh();
  };

  const filteredLessons = selectedSection 
    ? data.lessons.filter(l => l.sectionId === selectedSection.id)
    : [];

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Learning Management</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => { setEditingSection(null); setShowSectionForm(true); }} 
            className="bg-green-600 text-white px-2 py-1 rounded text-sm"
          >
            + Section
          </button>
          <button 
            onClick={() => { setEditingLesson(null); setShowLessonForm(true); }} 
            className="bg-green-600 text-white px-2 py-1 rounded text-sm"
          >
            + Lesson
          </button>
          <button 
            onClick={handleAddDemoWordLesson}
            disabled={saving || data.sections.length === 0}
            className="bg-amber-600 text-white px-2 py-1 rounded text-sm hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title="Add a demo word typing lesson in Home (order 1)"
          >
            Add demo word lesson
          </button>
          <button 
            onClick={handleDeleteAllSections}
            className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
            disabled={data.sections.length === 0}
          >
            Delete All Sections
          </button>
          <button onClick={refresh} className="bg-gray-200 px-2 py-1 rounded text-sm">Refresh</button>
        </div>
      </div>

      {/* Modal Overlays */}
      {showSectionForm && (
        <Modal onClose={() => { setShowSectionForm(false); setEditingSection(null); setSaveError(''); }}>
          <SectionForm
            section={editingSection}
            onSave={handleSaveSection}
            onCancel={() => { setShowSectionForm(false); setEditingSection(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      {showLessonForm && (
        <Modal onClose={() => { setShowLessonForm(false); setEditingLesson(null); setSaveError(''); }}>
          <LessonForm
            lesson={editingLesson}
            sections={data.sections}
            onSave={handleSaveLesson}
            onCancel={() => { setShowLessonForm(false); setEditingLesson(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)}>
          <div className="p-4">
            <h3 className="font-semibold mb-3">Confirm Delete</h3>
            <p className="mb-4">
              {showDeleteConfirm.deleteAll && showDeleteConfirm.type === 'section' 
                ? `Are you sure you want to delete ALL learning sections? This will delete ${data.sections.length} section(s) and all their lessons. This action cannot be undone.`
                : `Are you sure you want to delete this ${showDeleteConfirm.type}? ${showDeleteConfirm.type === 'section' ? ' This will also delete all lessons in this section.' : ''}`
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {loading ? (
        <div className="mt-2">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-semibold mb-3 text-lg">Sections</h4>
            <ul className="space-y-2 max-h-[65vh] overflow-y-auto">
              {data.sections.map(s => (
                <li key={s._id} className={`border rounded p-3 cursor-pointer transition ${selectedSection?._id === s._id ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}`}>
                  <div onClick={() => setSelectedSection(s)}>
                    <div className="font-semibold text-base">{s.name}</div>
                    <div className="text-sm text-gray-600 mt-1">Order: {s.lessonNumber}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setEditingSection(s); setShowSectionForm(true); }}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSection(s.id)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-semibold mb-3 text-lg">
              Lessons {selectedSection ? `- ${selectedSection.name}` : '(Select a Section)'}
            </h4>
            <ul className="space-y-2 max-h-[65vh] overflow-y-auto">
              {filteredLessons.map(l => (
                <li key={l._id} className="border rounded p-3 bg-white">
                  <div className="font-semibold text-base">{l.title}</div>
                  {l.title_hindi && <div className="text-sm text-gray-600 mt-1">{l.title_hindi}</div>}
                  <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-1 items-center">
                    <span>{l.difficulty}</span>
                    <span>•</span>
                    <span>{l.estimatedTime}</span>
                    {l.lessonType === 'word' && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Word</span>
                    )}
                    {(!l.lessonType || l.lessonType === 'alpha') && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Alphabet</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${l.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {l.isFree ? 'FREE' : 'PAID'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingLesson(l); setShowLessonForm(true); }}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(l.id)}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => toggleLessonFree(l._id, l.isFree)}
                        className={`text-sm px-3 py-1 rounded ${l.isFree ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      >
                        {l.isFree ? 'Make Paid' : 'Make Free'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {selectedSection && filteredLessons.length === 0 && (
                <li className="text-gray-500 text-center py-8">No lessons in this section</li>
              )}
              {!selectedSection && (
                <li className="text-gray-500 text-center py-8">Select a section to view lessons</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h3 className="font-semibold"></h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionForm({ section, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    id: section?.id || '',
    name: section?.name || '',
    description: section?.description || '',
    lessonNumber: section?.lessonNumber || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{section ? 'Edit Section' : 'Add New Section'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Section ID * 
            <span className="text-xs text-gray-500 font-normal ml-1">(Unique identifier)</span>
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., home, upper, lower (lowercase, no spaces)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            A unique short identifier (used in URLs and code)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Section Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Home Row"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Optional description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Order Number *</label>
          <input
            type="number"
            value={formData.lessonNumber}
            onChange={(e) => setFormData({...formData, lessonNumber: parseInt(e.target.value) || 0})}
            className="w-full border rounded px-3 py-2"
            placeholder="1, 2, 3..."
            required
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={saving}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function LessonForm({ lesson, sections, onSave, onCancel, saving, error }) {
  const initialLessonType = lesson?.lessonType === 'word' ? 'word' : 'alpha';
  const [formData, setFormData] = useState({
    sectionId: lesson?.sectionId || '',
    id: lesson?.id || '',
    title: lesson?.title || '',
    title_hindi: lesson?.title_hindi || '',
    description: lesson?.description || '',
    description_hindi: lesson?.description_hindi || '',
    difficulty: lesson?.difficulty || 'beginner',
    estimatedTime: lesson?.estimatedTime || '5 minutes',
    lessonType: initialLessonType,
    content_english: lesson?.content?.english || '',
    content_hindi_ramington: lesson?.content?.hindi_ramington || '',
    content_hindi_inscript: lesson?.content?.hindi_inscript || '',
    isFree: lesson?.isFree || false
  });
  console.log('[LessonForm] lesson?.lessonType:', lesson?.lessonType, 'initialLessonType:', initialLessonType, 'formData.lessonType:', formData.lessonType);

  // Auto-generate lesson ID when section changes (only for new lessons)
  const handleSectionChange = (sectionId) => {
    if (!lesson && sectionId) {
      const selectedSection = sections.find(s => s.id === sectionId);
      if (selectedSection) {
        // Auto-suggest format: sectionNumber.1 (admin can change the lesson number part)
        const suggestedId = `${selectedSection.lessonNumber}.1`;
        setFormData({...formData, sectionId, id: suggestedId});
      } else {
        setFormData({...formData, sectionId});
      }
    } else {
      setFormData({...formData, sectionId});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{lesson ? 'Edit Lesson' : 'Add New Lesson'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Section *</label>
            <select
              value={formData.sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Section</option>
              {sections.map(s => (
                <option key={s._id} value={s.id}>{s.name} (Order: {s.lessonNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Lesson Number * 
              <span className="text-xs text-gray-500 font-normal ml-1">(Auto-suggested)</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({...formData, id: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 1.1, 1.2, 2.1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: SectionOrder.LessonNumber (e.g., 1.1 = Section 1, Lesson 1)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title (English) *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title (Hindi)</label>
            <input
              type="text"
              value={formData.title_hindi}
              onChange={(e) => setFormData({...formData, title_hindi: e.target.value})}
              lang="hi"
              inputMode="text"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description (English)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded px-3 py-2"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (Hindi)</label>
            <textarea
              value={formData.description_hindi}
              onChange={(e) => setFormData({...formData, description_hindi: e.target.value})}
              className="w-full border rounded px-3 py-2"
              rows="2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty *</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Time *</label>
            <input
              type="text"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="5 minutes"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select
            value={formData.lessonType}
            onChange={(e) => {
            const v = e.target.value;
            console.log('[LessonForm] Type dropdown changed to:', v);
            setFormData({...formData, lessonType: v});
          }}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="alpha">Alphabet (character typing)</option>
            <option value="word">Word typing</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Alphabet for character-by-character lessons; Word for word typing lessons.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content (English) *</label>
          <textarea
            value={formData.content_english}
            onChange={(e) => setFormData({...formData, content_english: e.target.value})}
            className="w-full border rounded px-3 py-2 font-mono text-sm"
            rows="4"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Content (Hindi - Ramington)</label>
            <HindiTextarea
              layout="remington"
              value={formData.content_hindi_ramington}
              onChange={(e) => setFormData({...formData, content_hindi_ramington: e.target.value})}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows="4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content (Hindi - Inscript)</label>
            <HindiTextarea
              layout="inscript"
              value={formData.content_hindi_inscript}
              onChange={(e) => setFormData({...formData, content_hindi_inscript: e.target.value})}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows="4"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Free Lesson</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={saving}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SkillAdmin(){
  const [data, setData] = useState({ exercises: [], exams: [], settings: null });
  const [loading, setLoading] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lessons, setLessons] = useState([]); // For linking exercises to lessons
  const [selectedExercise, setSelectedExercise] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/skill-test');
      const d = await res.json();
      setData({ exercises: d.exercises||[], exams: d.exams||[], settings: d.settings||null });
      
      // Also fetch lessons for exercise linking
      try {
        const learningRes = await fetch('/api/admin/learning');
        const learningData = await learningRes.json();
        const allLessons = [];
        (learningData.sections || []).forEach(section => {
          (learningData.lessons || []).forEach(lesson => {
            if (lesson.sectionId === section.id) {
              allLessons.push({ ...lesson, sectionName: section.name });
            }
          });
        });
        setLessons(allLessons);
      } catch (e) {
        console.error('Failed to fetch lessons:', e);
      }
    } catch (error) {
      console.error('Failed to fetch skill test data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ refresh(); },[]);

  const handleDeleteExercise = async (exerciseId) => {
    setShowDeleteConfirm({ type: 'exercise', id: exerciseId });
  };

  const handleDeleteExam = async (examId) => {
    setShowDeleteConfirm({ type: 'exam', id: examId });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    const { type, id } = showDeleteConfirm;
    const exercise = data.exercises.find(e => e.id === id);
    const exam = data.exams.find(e => e.id === id);
    const _id = exercise?._id || exam?._id;
    
    const res = await fetch(`/api/admin/skill-test?type=${type}&_id=${_id}`, { method: 'DELETE' });
    if (res.ok) {
      refresh();
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveExercise = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingExercise ? 'PUT' : 'POST';
      const body = {
        type: 'exercise',
        id: formData.id,
        name: formData.name,
        lessonId: formData.lessonId || '',
        content: {
          english: formData.content_english || '',
          hindi_ramington: formData.content_hindi_ramington || '',
          hindi_inscript: formData.content_hindi_inscript || ''
        },
        difficulty: formData.difficulty || 'beginner',
        isFree: formData.isFree === true || formData.isFree === 'true',
        order: parseInt(formData.order) || 0
      };
      if (editingExercise) {
        body._id = editingExercise._id;
      }
      const res = await fetch('/api/admin/skill-test', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      let result;
      const text = await res.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setSaveError(`Server error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 100)}`);
        return;
      }
      
      if (res.ok) {
        await refresh();
        setShowExerciseForm(false);
        setEditingExercise(null);
      } else {
        setSaveError(result.error || `Failed to save exercise (${res.status})`);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
      console.error('Save exercise error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExam = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingExam ? 'PUT' : 'POST';
      const body = {
        type: 'exam',
        id: formData.id,
        name: formData.name,
        description: formData.description || '',
        description_hindi: formData.description_hindi || '',
        isFree: formData.isFree === true || formData.isFree === 'true',
        order: parseInt(formData.order) || 0
      };
      if (editingExam) {
        body._id = editingExam._id;
      }
      const res = await fetch('/api/admin/skill-test', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      let result;
      const text = await res.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setSaveError(`Server error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 100)}`);
        return;
      }
      
      if (res.ok) {
        await refresh();
        setShowExamForm(false);
        setEditingExam(null);
      } else {
        setSaveError(result.error || `Failed to save exam (${res.status})`);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
      console.error('Save exam error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const body = {
        type: 'settings',
        mainLanguages: formData.mainLanguages.split(',').map(s => s.trim()).filter(s => s),
        subLanguages: formData.subLanguages.split(',').map(s => s.trim()).filter(s => s),
        backspaceOptions: formData.backspaceOptions.split(',').map(s => s.trim()).filter(s => s),
        durations: formData.durations.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
        description: formData.description || '',
        description_hindi: formData.description_hindi || ''
      };
      
      const res = await fetch('/api/admin/skill-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      let result;
      const text = await res.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setSaveError(`Server error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 100)}`);
        return;
      }
      
      if (res.ok) {
        await refresh();
        setShowSettingsForm(false);
      } else {
        setSaveError(result.error || `Failed to save settings (${res.status})`);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
      console.error('Save settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get selected exercise data
  const selectedExerciseData = data.exercises.find(e => e._id === selectedExercise);
  
  // Get content to display (prefer English, fallback to Hindi)
  const getDisplayContent = () => {
    if (!selectedExerciseData) return '';
    const content = selectedExerciseData.content || {};
    return content.english || content.hindi_ramington || content.hindi_inscript || '';
  };

  return (
    <div className="mt-4">
      {/* Create 20 Exercise Lessons */}
      <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 mb-6">
        <p className="text-sm text-indigo-900 mb-3 font-bold">
          <strong>🚀 Create 20 Exercise Lessons:</strong>
        </p>
        <p className="text-xs text-indigo-700 mb-3">
          This will create 20 Exercise lessons (Lesson 1, Lesson 2, ... Lesson 20) in Skill Test:
          <br />• Each exercise has placeholder content that can be edited later
          <br />• First exercise (Lesson 1) is FREE, others are PAID
          <br />• Exercises are ordered from 1 to 20
        </p>
        <button
          onClick={async () => {
            if (!confirm('This will create/update 20 Exercise lessons in Skill Test. Continue?')) return;
            try {
              setSaving(true);
              const res = await fetch('/api/admin/create-skill-test-exercises', {
                method: 'POST',
                credentials: 'include'
              });
              const data = await res.json();
              if (res.ok) {
                alert(`Success! Created/updated ${data.exercises.length} exercises. ${data.summary.free} free, ${data.summary.paid} paid.`);
                await refresh();
              } else {
                alert('Error: ' + (data.error || 'Failed to create exercises'));
              }
            } catch (error) {
              console.error('Error creating exercises:', error);
              alert('Failed to create exercises: ' + error.message);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
        >
          {saving ? 'Creating...' : 'Create 20 Exercise Lessons'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 min-h-[70vh]">
        {/* Left Side: Exercise List */}
        <div className="w-full md:w-1/3 border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h4 className="font-semibold text-lg text-gray-800">Select Exercise</h4>
            <button 
              onClick={() => { setEditingExercise(null); setShowExerciseForm(true); }} 
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 font-medium"
            >
              + Add Exercise
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading exercises...</p>
            </div>
          ) : data.exercises.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No exercises yet. Click "+ Add Exercise" to create one.</p>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-2">
              {data.exercises.map(e => (
                <div 
                  key={e._id} 
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedExercise === e._id 
                      ? 'bg-blue-100 border-blue-500 shadow-md' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedExercise(e._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800">{e.name}</div>
                      {selectedExercise === e._id && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingExercise(e);
                              setShowExerciseForm(true);
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteExercise(e.id);
                            }}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Exercise Content Preview */}
        <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
          <div className="mb-4 pb-3 border-b">
            <h4 className="font-semibold text-lg text-gray-800">
              {selectedExerciseData ? selectedExerciseData.name : 'Exercise Content'}
            </h4>
          </div>
          
          {selectedExerciseData ? (
            <div className="h-[65vh] overflow-y-auto">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 font-serif text-base md:text-lg leading-relaxed whitespace-pre-wrap text-gray-800">
                {getDisplayContent() || (
                  <div className="text-gray-400 text-center py-20">
                    <p className="text-lg mb-2">No content available</p>
                    <p className="text-sm">Click "Edit" to add content for this exercise</p>
                  </div>
                )}
              </div>
              {getDisplayContent() && (
                <div className="mt-4 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded">
                  <span className="font-semibold">Characters:</span> {getDisplayContent().length} | 
                  <span className="font-semibold ml-2">Words:</span> {getDisplayContent().trim().split(/\s+/).filter(w => w).length}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[65vh] flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">No exercise selected</p>
                <p className="text-sm">Select an exercise from the left to view its content</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlays */}
      {showExerciseForm && (
        <Modal onClose={() => { setShowExerciseForm(false); setEditingExercise(null); setSaveError(''); }}>
          <ExerciseForm
            exercise={editingExercise}
            lessons={lessons}
            onSave={handleSaveExercise}
            onCancel={() => { setShowExerciseForm(false); setEditingExercise(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      {showExamForm && (
        <Modal onClose={() => { setShowExamForm(false); setEditingExam(null); setSaveError(''); }}>
          <ExamForm
            exam={editingExam}
            onSave={handleSaveExam}
            onCancel={() => { setShowExamForm(false); setEditingExam(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      {showSettingsForm && (
        <Modal onClose={() => { setShowSettingsForm(false); setEditingSettings(false); setSaveError(''); }}>
          <SettingsForm
            settings={data.settings}
            onSave={handleSaveSettings}
            onCancel={() => { setShowSettingsForm(false); setEditingSettings(false); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)}>
          <div className="p-4">
            <h3 className="font-semibold mb-3">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this {showDeleteConfirm.type}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

function ExerciseForm({ exercise, lessons, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    id: exercise?.id || '',
    name: exercise?.name || '',
    lessonId: exercise?.lessonId || '',
    content_english: exercise?.content?.english || '',
    content_hindi_ramington: exercise?.content?.hindi_ramington || '',
    content_hindi_inscript: exercise?.content?.hindi_inscript || '',
    difficulty: exercise?.difficulty || 'beginner',
    isFree: exercise?.isFree || false,
    order: exercise?.order || 0
  });

  // Auto-generate ID from name (only for new exercises)
  const handleNameChange = (name) => {
    const autoId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Only auto-generate ID if this is a new exercise (no existing exercise)
    if (!exercise && autoId) {
      setFormData({...formData, name, id: autoId});
    } else {
      setFormData({...formData, name});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{exercise ? 'Edit Exercise' : 'Add New Exercise'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
          <label className="block text-sm font-medium mb-1">Exercise Name *</label>
              <input
                type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g., Exercise 103"
                required
              />
          <p className="text-xs text-gray-500 mt-1">Exercise ID will be auto-generated from name</p>
            </div>

            <div>
          <label className="block text-sm font-medium mb-1">Exercise ID *</label>
              <input
                type="text"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
            placeholder="exercise-103"
                required
              />
        </div>

          <div>
            <label className="block text-sm font-medium mb-1">Link to Lesson (Optional)</label>
            <select
              value={formData.lessonId}
              onChange={(e) => setFormData({...formData, lessonId: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            >
            <option value="">None - Use custom content</option>
              {lessons.map(l => (
              <option key={l._id} value={l.id}>{l.title}</option>
              ))}
            </select>
          <p className="text-xs text-gray-500 mt-1">If linked, uses lesson content. Otherwise add custom content below.</p>
        </div>

        {!formData.lessonId && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Content (English) *</label>
              <textarea
                value={formData.content_english}
                onChange={(e) => setFormData({...formData, content_english: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                rows="4"
                placeholder="Type the exercise content in English..."
                required={!formData.lessonId}
              />
            </div>
              <div>
              <label className="block text-sm font-medium mb-1">Content (Hindi - Ramington) - Optional</label>
                <HindiTextarea
                  layout="remington"
                  value={formData.content_hindi_ramington}
                  onChange={(e) => setFormData({...formData, content_hindi_ramington: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                rows="4"
                  placeholder="Hindi Ramington content..."
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Content (Hindi - Inscript) - Optional</label>
                <HindiTextarea
                  layout="inscript"
                  value={formData.content_hindi_inscript}
                  onChange={(e) => setFormData({...formData, content_hindi_inscript: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                rows="4"
                  placeholder="Hindi Inscript content..."
                />
              </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Make this exercise FREE</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={saving}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ExamForm({ exam, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    id: exam?.id || '',
    name: exam?.name || '',
    description: exam?.description || '',
    description_hindi: exam?.description_hindi || '',
    isFree: exam?.isFree || false,
    order: exam?.order || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{exam ? 'Edit Exam' : 'Add New Exam'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Exam Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g., CPCT Typing Exam"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Exam ID *</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="cpct-typing"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (English) - Optional</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
            placeholder="Enter exam description in English..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Hindi) - Optional</label>
          <textarea
            value={formData.description_hindi}
            onChange={(e) => setFormData({...formData, description_hindi: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
            placeholder="Enter exam description in Hindi..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Make this exam FREE</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={saving}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingsForm({ settings, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    mainLanguages: settings?.mainLanguages?.join(', ') || 'Hindi, English',
    subLanguages: settings?.subLanguages?.join(', ') || 'Ramington Gail, Inscript',
    backspaceOptions: settings?.backspaceOptions?.join(', ') || 'OFF, ON',
    durations: settings?.durations?.join(', ') || '2, 5, 10, 15, 20, 30',
    description: settings?.description || 'Matter to type is given on upper half part of screen. Word to type is highlighted. Back space is allowed till current word. Wrong typed word makes bold. So user can identify such mistakes. One or more word afterwards the highlighted word can be skipped, if needed. Skipped word will not added as mistakes.',
    description_hindi: settings?.description_hindi || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">Skill Test Settings</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Main Languages *</label>
          <input
            type="text"
            value={formData.mainLanguages}
            onChange={(e) => setFormData({...formData, mainLanguages: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Comma-separated: Hindi, English"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple languages with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sub Languages</label>
          <input
            type="text"
            value={formData.subLanguages}
            onChange={(e) => setFormData({...formData, subLanguages: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Comma-separated: Ramington Gail, Inscript"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Backspace Options *</label>
          <input
            type="text"
            value={formData.backspaceOptions}
            onChange={(e) => setFormData({...formData, backspaceOptions: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Comma-separated: OFF, ON"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Durations (minutes) *</label>
          <input
            type="text"
            value={formData.durations}
            onChange={(e) => setFormData({...formData, durations: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Comma-separated numbers: 2, 5, 10, 15, 20, 30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (English)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded px-3 py-2"
            rows="4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Hindi)</label>
          <textarea
            value={formData.description_hindi}
            onChange={(e) => setFormData({...formData, description_hindi: e.target.value})}
            className="w-full border rounded px-3 py-2"
            rows="4"
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={saving}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SubscriptionsAdmin(){
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ fileType: 'pdf_notes', file: null, description: '' });

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        credentials: 'include' // Include cookies
      });
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFiles = async (userId) => {
    try {
      const res = await fetch(`/api/admin/user-files?userId=${userId}`, {
        credentials: 'include' // Include cookies
      });
      const data = await res.json();
      setUserFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch user files:', error);
    }
  };

  const handleUserClick = (sub) => {
    setSelectedUser(sub);
    fetchUserFiles(sub.userId._id || sub.userId);
  };

  const handleFileChange = (e) => {
    setUploadForm({ ...uploadForm, file: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !selectedUser) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('userId', selectedUser.userId._id || selectedUser.userId);
      formData.append('fileType', uploadForm.fileType);
      formData.append('description', uploadForm.description);

      const res = await fetch('/api/admin/upload-user-file', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies
      });

      if (res.ok) {
        await fetchUserFiles(selectedUser.userId._id || selectedUser.userId);
        setUploadForm({ fileType: 'pdf_notes', file: null, description: '' });
        alert('File uploaded successfully!');
      } else {
        const data = await res.json();
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Subscriptions Management</h3>
        <button onClick={refresh} className="bg-gray-200 px-2 py-1 rounded">Refresh</button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h4 className="font-medium mb-2">Active Subscriptions</h4>
          {loading ? (
            <div>Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <p className="text-gray-500">No subscriptions found</p>
          ) : (
            <ul className="space-y-2 max-h-[600px] overflow-y-auto">
              {subscriptions.map(sub => {
                const user = sub.userId;
                const userName = user?.name || user?.phoneNumber || 'Unknown User';
                return (
                  <li 
                    key={sub._id} 
                    className={`border rounded p-3 cursor-pointer transition-colors ${
                      selectedUser?._id === sub._id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleUserClick(sub)}
                  >
                    <div className="text-sm font-semibold text-blue-600 mb-1">{userName}</div>
                    <div className="text-xs text-gray-600">
                      <div><strong>Type:</strong> {sub.type} • <strong>Plan:</strong> {sub.plan}</div>
                      <div><strong>Status:</strong> {sub.status} • <strong>Expires:</strong> {new Date(sub.endDate).toLocaleDateString()}</div>
                      {user?.email && <div><strong>Email:</strong> {user.email}</div>}
                      {user?.phoneNumber && <div><strong>Phone:</strong> {user.phoneNumber}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedUser && (
          <div className="border rounded p-3">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">
                Files for: {selectedUser.userId?.name || selectedUser.userId?.phoneNumber || 'User'}
              </h4>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUpload} className="mb-4 p-3 bg-gray-50 rounded border">
              <h5 className="text-sm font-semibold mb-2">Upload File</h5>
              <div className="space-y-2">
                <select
                  value={uploadForm.fileType}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="pdf_notes">PDF Notes</option>
                  <option value="syllabus_pdf">Syllabus PDF</option>
                </select>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full border rounded px-2 py-1 text-sm"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                  rows="2"
                />
                <button
                  type="submit"
                  disabled={uploading || !uploadForm.file}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>

            {/* User Files List */}
            <div className="border-t pt-3">
              <h5 className="text-sm font-semibold mb-2">Uploaded Files</h5>
              {userFiles.length === 0 ? (
                <p className="text-xs text-gray-500">No files uploaded yet</p>
              ) : (
                <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                  {userFiles.map(file => (
                    <li key={file._id} className="border rounded p-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{file.fileName}</div>
                          <div className="text-gray-600">
                            Type: {file.fileType === 'pdf_notes' ? 'PDF Notes' : 'Syllabus PDF'}
                          </div>
                          {file.description && (
                            <div className="text-gray-500 mt-1">{file.description}</div>
                          )}
                          <div className="text-gray-400 mt-1">
                            Uploaded: {new Date(file.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 ml-2"
                        >
                          View
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PricingAdmin() {
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Removed selectedType - single unified pricing for all sections
  const [features, setFeatures] = useState([]);
  const [editingFeature, setEditingFeature] = useState(null);
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  useEffect(() => {
    fetchPricing();
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const res = await fetch('/api/admin/features', { credentials: 'include' });
      const data = await res.json();
      const fetchedFeatures = data.features || [];
      
      // Auto-initialize default features if none exist
      if (fetchedFeatures.length === 0) {
        await initializeDefaultFeatures();
        // Fetch again after initialization
        const res2 = await fetch('/api/admin/features', { credentials: 'include' });
        const data2 = await res2.json();
        setFeatures((data2.features || []).sort((a, b) => a.order - b.order));
      } else {
        setFeatures(fetchedFeatures.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    }
  };

  const initializeDefaultFeatures = async () => {
    try {
      const res = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'initialize' })
      });
      const result = await res.json();
      if (res.ok) {
        console.log('Default features initialized successfully');
      } else {
        console.error('Failed to initialize default features:', result.error);
      }
    } catch (error) {
      console.error('Failed to initialize default features:', error);
    }
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        credentials: 'include'
      });
      const data = await res.json();
      // Get learning pricing as unified pricing (applies to all sections)
      const learningPricing = data.pricing?.find(p => p.type === 'learning') || data.pricing?.[0];
      if (learningPricing) {
        setPricing({ unified: learningPricing });
      } else {
        // Set default if no pricing exists
        setPricing({
          unified: {
            type: 'learning',
            plans: {
              oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
              threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
              sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type, plans) => {
    setSaving(true);
    try {
      // Save as 'learning' type which applies to all sections
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'learning', plans }),
        credentials: 'include'
      });
      if (res.ok) {
        await fetchPricing();
        alert('Pricing updated successfully! This pricing applies to all sections (Learning, Skill Test, Exam).');
      } else {
        const data = await res.json();
        alert('Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (planKey, field, value) => {
    setPricing(prev => {
      const newPricing = { ...prev };
      if (!newPricing.unified) {
        newPricing.unified = {
          type: 'learning',
          plans: {
            oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
            threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
            sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
          }
        };
      }
      newPricing.unified.plans[planKey][field] = parseInt(value) || 0;
      // Recalculate discount
      const plan = newPricing.unified.plans[planKey];
      if (plan.originalPrice > 0) {
        plan.discount = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
      }
      return newPricing;
    });
  };

  const getCurrentPricing = () => {
    if (!pricing.unified || !pricing.unified.plans) {
      return {
        oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
        threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
        sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
      };
    }
    return pricing.unified.plans;
  };

  const handleSaveFeature = async (formData) => {
    try {
      const method = editingFeature ? 'PUT' : 'POST';
      const body = {
        title: formData.title,
        description: formData.description,
        icon: formData.icon || '✓',
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive !== false,
        showTick: formData.showTick !== false,
        showWrong: formData.showWrong === true
      };
      if (editingFeature) {
        body._id = editingFeature._id;
      }

      const res = await fetch('/api/admin/features', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (res.ok) {
        await fetchFeatures();
        setShowFeatureForm(false);
        setEditingFeature(null);
        alert('Feature saved successfully!');
      } else {
        alert(result.error || 'Failed to save feature');
      }
    } catch (error) {
      console.error('Failed to save feature:', error);
      alert('Failed to save feature');
    }
  };

  const handleDeleteFeature = async (featureId) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      const res = await fetch(`/api/admin/features?id=${featureId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchFeatures();
        alert('Feature deleted successfully!');
      } else {
        alert('Failed to delete feature');
      }
    } catch (error) {
      console.error('Failed to delete feature:', error);
      alert('Failed to delete feature');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pricing Management</h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>Unified Pricing:</strong> This pricing applies to all sections (Learning, Skill Test, Exam). 
            A single subscription unlocks access to all three sections.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading pricing...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {['oneMonth', 'threeMonths', 'sixMonths'].map(planKey => {
            const plan = getCurrentPricing()[planKey];
            const planNames = {
              oneMonth: '1 Month',
              threeMonths: '3 Months',
              sixMonths: '6 Months'
            };
            return (
              <div key={planKey} className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">{planNames[planKey]}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePlan(planKey, 'price', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      value={plan.originalPrice}
                      onChange={(e) => updatePlan(planKey, 'originalPrice', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={plan.duration}
                      onChange={(e) => updatePlan(planKey, 'duration', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Discount</div>
                    <div className="text-2xl font-bold text-green-600">{plan.discount}%</div>
                    <div className="text-xs text-gray-500">
                      Save ₹{plan.originalPrice - plan.price}
                    </div>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => handleSave('learning', getCurrentPricing())}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>

      {/* Features Section - Global for all plans */}
      <div className="mt-8 bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold">Subscription Features</h3>
            <p className="text-sm text-gray-600 mt-1">Features apply to all plans (Learning, Skill Test, Exam)</p>
          </div>
          <button
            onClick={() => {
              setEditingFeature(null);
              setShowFeatureForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + Add Feature
          </button>
        </div>
        <div className="space-y-3">
          {features.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No features yet. Click "+ Add Feature" to create one.</p>
          ) : (
            features.map(f => (
              <div key={f._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{f.icon || '✓'}</span>
                  <div className="flex gap-1">
                    {f.showWrong ? (
                      <span className="text-red-600 text-lg font-bold">✗</span>
                    ) : (
                      <span className="text-green-600 text-lg font-bold">✓</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{f.title}</div>
                  <div className="text-sm text-gray-600">{f.description}</div>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Order: {f.order}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {f.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      f.showWrong ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {f.showWrong ? '✗ Wrong' : '✓ Tick'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingFeature(f);
                      setShowFeatureForm(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFeature(f._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feature Form Modal */}
      {showFeatureForm && (
        <Modal onClose={() => { setShowFeatureForm(false); setEditingFeature(null); }}>
          <FeatureForm
            feature={editingFeature}
            onSave={handleSaveFeature}
            onCancel={() => { setShowFeatureForm(false); setEditingFeature(null); }}
            saving={false}
            error=""
          />
        </Modal>
      )}
    </div>
  );
}

function DownloadsAdmin(){
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDownload, setEditingDownload] = useState(null);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [selectedType, setSelectedType] = useState('video_notes');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/downloads?type=${selectedType}`);
      const data = await res.json();
      setDownloads(data.downloads || []);
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [selectedType]);

  const handleSaveDownload = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingDownload ? 'PUT' : 'POST';
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const downloadId = editingDownload?.id || `download-${selectedType}-${timestamp}-${random}`;
      
      const body = {
        type: selectedType,
        id: downloadId,
        title: formData.title,
        title_hi: formData.title_hi || '',
        description: formData.description || '',
        description_hi: formData.description_hi || '',
        fileUrl: formData.fileUrl,
        thumbnailUrl: formData.thumbnailUrl || '',
        fileSize: formData.fileSize || '',
        duration: formData.duration || '',
        category: formData.category || '',
        order: parseInt(formData.order) || 0,
        isFree: formData.isFree === true || formData.isFree === 'true'
      };
      if (editingDownload) {
        body._id = editingDownload._id;
      }
      const res = await fetch('/api/admin/downloads', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      let result;
      const text = await res.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setSaveError(`Server error: ${res.status} ${res.statusText}`);
        return;
      }
      
      if (res.ok) {
        await refresh();
        setShowDownloadForm(false);
        setEditingDownload(null);
        setSaveError('');
      } else {
        setSaveError(result.error || `Failed to save download (${res.status})`);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDownload = async (downloadId) => {
    if (!confirm('Are you sure you want to delete this download?')) return;
    try {
      const res = await fetch(`/api/admin/downloads?_id=${downloadId}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
      }
    } catch (error) {
      console.error('Failed to delete download:', error);
    }
  };

  const typeLabels = {
    video_notes: 'Video Notes',
    pdf_notes: 'PDF Notes',
    syllabus_pdf: 'Syllabus PDF'
  };

  return (
    <div className="mt-4">
      <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 rounded">
        <p className="text-sm text-green-800">
          <strong>✓ Recommended:</strong> Upload notes here to make them available to <strong>ALL students with active membership</strong>. 
          One upload serves all members - no need to upload individually!
        </p>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Downloads Management (For All Members)</h3>
        <button 
          onClick={() => { setEditingDownload(null); setShowDownloadForm(true); }} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Add Download (For All Members)
        </button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium mb-2">Select Download Type</label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(typeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedType === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-semibold mb-3">{typeLabels[selectedType]}</h4>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No downloads yet. Click "+ Add Download" to create one.</div>
        ) : (
          <div className="space-y-3">
            {downloads.map(d => (
              <div key={d._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{d.title}</div>
                    {d.title_hi && <div className="text-sm text-gray-600 mt-1">{d.title_hi}</div>}
                    {d.description && <div className="text-sm text-gray-500 mt-2">{d.description}</div>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      {d.fileSize && <span>Size: {d.fileSize}</span>}
                      {d.duration && <span>Duration: {d.duration}</span>}
                      <span className={d.isFree ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {d.isFree ? 'FREE' : 'PAID'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        View File →
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingDownload(d); setShowDownloadForm(true); }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDownload(d._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDownloadForm && (
        <Modal onClose={() => { 
          setShowDownloadForm(false); 
          setEditingDownload(null); 
          setSaveError(''); 
        }}>
          <DownloadForm
            key={editingDownload?._id || 'new'} // Force re-render when switching between edit/new
            download={editingDownload}
            type={selectedType}
            onSave={handleSaveDownload}
            onCancel={() => { 
              setShowDownloadForm(false); 
              setEditingDownload(null); 
              setSaveError('');
              refresh(); // Refresh list when closing
            }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}
    </div>
  );
}

function TopicWiseMCQAdmin(){
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportTopicId, setBulkImportTopicId] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  const refreshTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/topicwise/topics', {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch topics: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      alert('Failed to load topics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshQuestions = async (topicId) => {
    if (!topicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/topicwise/questions?topicId=${topicId}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error('Failed to fetch questions:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Refreshed questions:', data.questions?.length || 0, 'questions found');
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshTopics(); }, []);
  useEffect(() => { if (selectedTopic) refreshQuestions(selectedTopic); }, [selectedTopic]);

  const handleSaveTopic = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const topicId = editingTopic ? editingTopic.topicId : (formData.topicId || `topic-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      
      const body = {
        topicId: topicId,
        topicName: formData.topicName,
        topicName_hi: formData.topicName_hi || '',
        isFree: formData.isFree || false
      };
      const res = await fetch('/api/admin/topicwise/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        await refreshTopics();
        setShowTopicForm(false);
        setEditingTopic(null);
      } else {
        const result = await res.json();
        setSaveError(result.error || 'Failed to save topic');
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestion = async (formData) => {
    if (!selectedTopic) {
      alert('Please select a topic first');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const options = formData.options.split(',').map(s => s.trim()).filter(s => s);
      const options_hi = formData.options_hi ? formData.options_hi.split(',').map(s => s.trim()).filter(s => s) : [];
      
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const questionId = editingQuestion?.id || `topic-${selectedTopic}-${timestamp}-${random}`;
      
      // Validate required fields
      if (!formData.question || !formData.question.trim()) {
        setSaveError('Question (English) is required');
        setSaving(false);
        return;
      }
      
      if (!formData.options || !formData.options.trim()) {
        setSaveError('Options are required');
        setSaving(false);
        return;
      }
      
      if (options.length < 2) {
        setSaveError('At least 2 options are required');
        setSaving(false);
        return;
      }
      
      const selectedTopicData = topics.find(t => t.topicId === selectedTopic);
      if (!selectedTopicData || !selectedTopicData.topicName) {
        setSaveError('Topic not found. Please select a valid topic.');
        setSaving(false);
        return;
      }
      
      const body = {
        id: questionId,
        topicId: selectedTopic,
        topicName: selectedTopicData.topicName,
        topicName_hi: selectedTopicData.topicName_hi || '',
        question_en: formData.question.trim(),
        question_hi: formData.question_hi?.trim() || '',
        options_en: options,
        options_hi: options_hi,
        correctAnswer: parseInt(formData.correctAnswer) || 0,
        marks: parseInt(formData.marks) || 1,
        negativeMarks: parseFloat(formData.negativeMarks) || 0,
        imageUrl: formData.imageUrl || '',
        explanation_en: formData.explanation_en?.trim() || '',
        explanation_hi: formData.explanation_hi?.trim() || '',
        difficulty: formData.difficulty || 'medium',
        order: parseInt(formData.order) || 0,
        isFree: formData.isFree === true || formData.isFree === 'true',
        solutionVideoLink: formData.solutionVideoLink?.trim() || ''
      };
      
      if (editingQuestion) {
        body._id = editingQuestion._id;
      }
      
      const res = await fetch('/api/admin/topicwise/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      let result;
      try {
        result = await res.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        setSaveError('Invalid response from server');
        setSaving(false);
        return;
      }
      
      if (res.ok) {
        console.log('Question saved successfully:', result.question);
        setSaveError('');
        // Refresh questions immediately
        await refreshQuestions(selectedTopic);
        // Close form after refresh
        setShowQuestionForm(false);
        setEditingQuestion(null);
      } else {
        const errorMsg = result.error || 'Failed to save question';
        setSaveError(errorMsg);
        console.error('Save question error:', errorMsg, result);
        alert('Error: ' + errorMsg);
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/topicwise/questions?_id=${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshQuestions(selectedTopic);
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete all questions in this topic.')) return;
    try {
      const res = await fetch(`/api/admin/topicwise/topics?topicId=${topicId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshTopics();
        if (selectedTopic === topicId) {
          setSelectedTopic(null);
          setQuestions([]);
        }
        alert('Topic deleted successfully');
      } else {
        const error = await res.json();
        alert('Error: ' + (error.error || 'Failed to delete topic'));
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      alert('Failed to delete topic: ' + error.message);
    }
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setShowTopicForm(true);
  };

  return (
    <div className="mt-4">
          {/* Create 10 Topic-Wise Exams */}
          <div className="bg-teal-50 border-2 border-teal-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-900 mb-3 font-bold">
              <strong>🚀 Create 10 Topic-Wise Exams:</strong>
            </p>
            <p className="text-xs text-teal-700 mb-3">
              This will create 10 topic-wise exams with the following configuration:
              <br />• Each exam: 100 questions, 90 minutes duration
              <br />• Passing marks: 50 marks (50%)
              <br />• First topic (Computers and their evolution and types) is FREE
              <br />• All other 9 topics are PAID
              <br />
              <br /><strong>Topics:</strong>
              <br />1. Computers and their evolution and types (FREE)
              <br />2. Computer generations & Printers (PAID)
              <br />3. All types of memory (PAID)
              <br />4. Software and its types and hardware, input and output devices (PAID)
              <br />5. All programming languages (PAID)
              <br />6. Data communication media (PAID)
              <br />7. Internet browsers and search engines, mail sites, viruses, and network media and topology (PAID)
              <br />8. Microsoft Office (Word, Excel, PowerPoint) (PAID)
              <br />9. All shortcut keys (PAID)
              <br />10. Important sorts of notes (PAID)
            </p>
            <button
              onClick={async () => {
                if (!confirm('This will create/update 10 topic-wise exams with proper structure. The first topic will be FREE, others will be PAID. Continue?')) return;
                try {
                  setSaving(true);
                  const res = await fetch('/api/admin/create-topicwise-exams', {
                    method: 'POST',
                    credentials: 'include'
                  });
                  const data = await res.json();
                  if (res.ok) {
                    const successMsg = `Success! Created ${data.createdExams.length} topic-wise exams.\n\n` +
                      data.createdExams.map((exam, idx) => 
                        `${idx + 1}. ${exam.topicName} (${exam.isFree ? 'FREE' : 'PAID'})`
                      ).join('\n');
                    alert(successMsg);
                    await refreshTopics();
                  } else {
                    alert('Error: ' + (data.error || 'Failed to create topic-wise exams'));
                  }
                } catch (error) {
                  console.error('Error creating topic-wise exams:', error);
                  alert('Failed to create topic-wise exams: ' + error.message);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Creating Exams...' : 'Create 10 Topic-Wise Exams'}
            </button>
      </div>

          {/* Bulk Import Questions */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-3 font-bold">
              <strong>📥 Bulk Import Questions:</strong>
            </p>
            <p className="text-xs text-blue-700 mb-3">
              Copy and paste questions in the following format:
              <br />• <strong>Format 1:</strong> Question text (Hindi text?) A. Option1 B. Option2 C. Option3 D. Option4 Ans: A. Answer
              <br />• <strong>Format 2:</strong> Question text (Hindi text?) A. Option1 (Hindi1) B. Option2 (Hindi2) C. Option3 (Hindi3) D. Option4 (Hindi4) Ans: A. Answer
              <br />• Each question on a new line (separated by blank lines)
              <br />• If you paste more than 100 questions, only the first 100 will be imported
              <br />• Questions will be automatically parsed and added to the selected topic
            </p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Topic:
              </label>
              <select
                value={bulkImportTopicId}
                onChange={(e) => setBulkImportTopicId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={bulkImporting || topics.length === 0}
              >
                <option value="">-- Select a Topic --</option>
                {topics.map(topic => (
                  <option key={topic.topicId} value={topic.topicId}>
                    {topic.topicName} {topic.isFree ? '(FREE)' : '(PAID)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Questions Here:
              </label>
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="Paste questions here in the format:&#10;Question text (Hindi text?) A. Option1 B. Option2 C. Option3 D. Option4 Ans: A. Answer&#10;&#10;Next question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={10}
                disabled={bulkImporting || !bulkImportTopicId}
              />
            </div>
            <button
              onClick={async () => {
                if (!bulkImportTopicId) {
                  alert('Please select a topic first');
                  return;
                }
                if (!bulkImportText.trim()) {
                  alert('Please paste questions first');
                  return;
                }
                if (!confirm(`This will import questions to "${topics.find(t => t.topicId === bulkImportTopicId)?.topicName}". Continue?`)) return;
                
                try {
                  setBulkImporting(true);
                  const res = await fetch('/api/admin/bulk-import-topicwise-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      questionsText: bulkImportText,
                      topicId: bulkImportTopicId
                    })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    let message = `Success! Imported ${data.imported} questions.\nTotal questions in topic: ${data.totalQuestions}`;
                    if (data.parsingStats) {
                      message += `\n\nParsing Stats:\n- Total blocks found: ${data.parsingStats.totalBlocks}\n- Successfully parsed: ${data.parsingStats.parsed}\n- Failed to parse: ${data.parsingStats.failed}`;
                      if (data.parsingStats.wasLimited) {
                        message += `\n- ⚠️ Limited to 100 questions (had ${data.parsingStats.totalBlocks} total)`;
                      }
                    }
                    if (data.warning) {
                      message += `\n\n⚠️ ${data.warning}`;
                    }
                    alert(message);
                    setBulkImportText('');
                    if (selectedTopic === bulkImportTopicId) {
                      await refreshQuestions(selectedTopic);
                    }
                  } else {
                    alert('Error: ' + (data.error || 'Failed to import questions'));
                  }
                } catch (error) {
                  console.error('Error importing questions:', error);
                  alert('Failed to import questions: ' + error.message);
                } finally {
                  setBulkImporting(false);
                }
              }}
              disabled={bulkImporting || !bulkImportTopicId || !bulkImportText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
            >
              {bulkImporting ? 'Importing Questions...' : 'Import Questions'}
            </button>
      </div>

          {/* Delete All Topic-Wise Questions & Papers */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-900 mb-3 font-bold">
              <strong>⚠️ Delete All Topic-Wise Questions & Papers:</strong>
            </p>
            <p className="text-xs text-red-700 mb-3">
              This will permanently delete:
              <br />• All topic-wise MCQ questions
              <br />• All topics
              <br />• All topic-wise exams (papers)
              <br />• All sections and parts related to topic-wise exams
              <br />• All questions related to topic-wise exams
              <br />
              <br /><strong>Warning:</strong> This action cannot be undone!
            </p>
            <button
              onClick={async () => {
                if (!confirm('⚠️ WARNING: This will permanently delete ALL topic-wise questions, topics, and papers. This action cannot be undone!\n\nAre you absolutely sure you want to continue?')) return;
                if (!confirm('This is your last chance. Click OK to permanently delete everything.')) return;
                try {
                  setSaving(true);
                  const res = await fetch('/api/admin/delete-all-topicwise', {
                    method: 'POST',
                    credentials: 'include'
                  });
                  const data = await res.json();
                  if (res.ok) {
                    const successMsg = `Success! Deleted all topic-wise data:\n\n` +
                      `• ${data.deletedData.topicWiseMCQs} MCQ questions\n` +
                      `• ${data.deletedData.topics} topics\n` +
                      `• ${data.deletedData.exams} exams\n` +
                      `• ${data.deletedData.sections} sections\n` +
                      `• ${data.deletedData.parts} parts\n` +
                      `• ${data.deletedData.questions} exam questions`;
                    alert(successMsg);
                    await refreshTopics();
                    setSelectedTopic(null);
                    setQuestions([]);
                  } else {
                    alert('Error: ' + (data.error || 'Failed to delete topic-wise data'));
                  }
                } catch (error) {
                  console.error('Error deleting topic-wise data:', error);
                  alert('Failed to delete topic-wise data: ' + error.message);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Deleting...' : 'Delete All Questions & Papers'}
            </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">Topics</h4>
            <button 
              onClick={() => { setEditingTopic(null); setShowTopicForm(true); }} 
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              + Add Topic
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No topics yet. Add a topic to get started.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {topics.map(topic => (
                <div
                  key={topic.topicId}
                  className={`p-3 rounded transition ${
                    selectedTopic === topic.topicId
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div 
                    onClick={() => setSelectedTopic(topic.topicId)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{topic.topicName}</div>
                        {topic.topicName_hi && <div className="text-xs text-gray-600 mt-1">{topic.topicName_hi}</div>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ml-2 ${
                        topic.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {topic.isFree ? 'FREE' : 'PAID'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTopic(topic);
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`⚠️ This will delete ALL questions for "${topic.topicName}". This action cannot be undone!\n\nAre you sure you want to continue?`)) return;
                        try {
                          setSaving(true);
                          const res = await fetch('/api/admin/clear-topic-questions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ topicId: topic.topicId })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            alert(`Success! Cleared all questions for "${topic.topicName}":\n\n• ${data.deletedCount} questions deleted`);
                            // Refresh questions if this topic is selected
                            if (selectedTopic === topic.topicId) {
                              await refreshQuestions(selectedTopic);
                            }
                          } else {
                            alert('Error: ' + (data.error || 'Failed to clear questions'));
                          }
                        } catch (error) {
                          console.error('Error clearing questions:', error);
                          alert('Failed to clear questions: ' + error.message);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs disabled:bg-gray-400"
                    >
                      Clear Questions
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic.topicId);
                      }}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">
              {selectedTopic ? `Questions - ${topics.find(t => t.topicId === selectedTopic)?.topicName || ''}` : 'Select a Topic'}
            </h4>
            {selectedTopic && (
              <button 
                onClick={() => { setEditingQuestion(null); setShowQuestionForm(true); }} 
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Add Question
              </button>
            )}
          </div>
          {!selectedTopic ? (
            <div className="text-center py-8 text-gray-500">Select a topic from the left to view questions</div>
          ) : loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No questions yet. Click "+ Add Question" to create one.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {questions.map(q => (
                <div key={q._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="font-medium mb-2">{q.question_en}</div>
                  {q.question_hi && <div className="text-sm text-gray-600 mb-2">{q.question_hi}</div>}
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Options:</strong> {q.options_en?.map((opt, idx) => (
                      <span key={idx} className={idx === q.correctAnswer ? 'font-bold text-green-700' : ''}>
                        {opt}{idx < q.options_en.length - 1 ? ', ' : ''}
                      </span>
                    )).join('')}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      q.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {q.isFree ? 'FREE' : 'PAID'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingQuestion(q); setShowQuestionForm(true); }}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTopicForm && (
        <Modal onClose={() => { setShowTopicForm(false); setEditingTopic(null); setSaveError(''); }}>
          <TopicForm
            topic={editingTopic}
            onSave={handleSaveTopic}
            onCancel={() => { setShowTopicForm(false); setEditingTopic(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      {showQuestionForm && (
        <Modal onClose={() => { setShowQuestionForm(false); setEditingQuestion(null); setSaveError(''); }}>
          <TopicWiseQuestionForm
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => { setShowQuestionForm(false); setEditingQuestion(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}
    </div>
  );
}

function DownloadForm({ download, type, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    title: download?.title || '',
    title_hi: download?.title_hi || '',
    description: download?.description || '',
    description_hi: download?.description_hi || '',
    fileUrl: download?.fileUrl || '',
    thumbnailUrl: download?.thumbnailUrl || '',
    fileSize: download?.fileSize || '',
    duration: download?.duration || '',
    category: download?.category || '',
    order: download?.order || 0,
    isFree: download?.isFree || false
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If it's a PDF type and user wants to upload a file
    if ((type === 'pdf_notes' || type === 'syllabus_pdf') && useFileUpload && uploadFile && !download) {
      setUploading(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadFile);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('title_hi', formData.title_hi);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('description_hi', formData.description_hi);
        uploadFormData.append('fileType', type);
        uploadFormData.append('isFree', formData.isFree);
        uploadFormData.append('order', formData.order);
        uploadFormData.append('fileSize', formData.fileSize);

        const res = await fetch('/api/admin/upload-download-file', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          alert('File uploaded successfully!');
          // Don't call onSave - the file is already saved via upload endpoint
          // Just close the form - parent component will refresh automatically
          onCancel();
        } else {
          const errorData = await res.json();
          alert('Upload failed: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
      } finally {
        setUploading(false);
      }
    } else {
      // Use URL method (existing behavior)
    onSave(formData);
    }
  };

  const typeLabels = {
    video_notes: 'Video Notes',
    pdf_notes: 'PDF Notes',
    syllabus_pdf: 'Syllabus PDF'
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{download ? 'Edit Download' : `Add New ${typeLabels[type]}`}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title (English) *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title (Hindi) - Optional</label>
          <input
            type="text"
            value={formData.title_hi}
            onChange={(e) => setFormData({...formData, title_hi: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        {/* File Upload or URL Input */}
        {download ? (
          // When editing, only show URL field (can't change file)
        <div>
          <label className="block text-sm font-medium mb-1">File URL *</label>
          <input
            type="url"
            value={formData.fileUrl}
            onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
              placeholder={type === 'video_notes' ? "https://drive.google.com/file/d/..." : "https://example.com/file.pdf"}
            required
          />
            {type === 'video_notes' && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Tip: Use Google Drive share link. Make sure the link is set to "Anyone with the link can view".
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Note: To change the file, delete this entry and create a new one.
            </p>
        </div>
        ) : (
          // When creating new, show upload option
          <>
            {(type === 'pdf_notes' || type === 'syllabus_pdf') && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useFileUpload}
                    onChange={(e) => setUseFileUpload(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">Upload PDF file (for all members)</span>
                </label>
                <p className="text-xs text-gray-600 mt-1 ml-7">
                  Check this to upload a file. Uncheck to use a URL instead.
                </p>
              </div>
            )}
            
            {((type === 'pdf_notes' || type === 'syllabus_pdf') && useFileUpload) ? (
              <div>
                <label className="block text-sm font-medium mb-1">Upload PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This file will be available to all students with active membership.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">File URL *</label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder={type === 'video_notes' ? "https://drive.google.com/file/d/..." : "https://example.com/file.pdf"}
                  required
                />
                {type === 'video_notes' && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Tip: Use Google Drive share link. Make sure the link is set to "Anyone with the link can view".
                  </p>
                )}
              </div>
            )}
          </>
        )}
        {type === 'video_notes' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail URL - Optional</label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration - Optional</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="10:30"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">File Size - Optional</label>
          <input
            type="text"
            value={formData.fileSize}
            onChange={(e) => setFormData({...formData, fileSize: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="5.2 MB"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description - Optional</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Make this download FREE</span>
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving || uploading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            disabled={saving || uploading}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function TopicForm({ topic, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    topicId: topic?.topicId || '',
    topicName: topic?.topicName || '',
    topicName_hi: topic?.topicName_hi || '',
    isFree: topic?.isFree || false
  });

  useEffect(() => {
    if (topic) {
      setFormData({
        topicId: topic.topicId || '',
        topicName: topic.topicName || '',
        topicName_hi: topic.topicName_hi || '',
        isFree: topic.isFree || false
      });
    } else {
      setFormData({
        topicId: '',
        topicName: '',
        topicName_hi: '',
        isFree: false
      });
    }
  }, [topic]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{topic ? 'Edit Topic' : 'Add New Topic'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Topic ID *</label>
          <input
            type="text"
            value={formData.topicId}
            onChange={(e) => setFormData({...formData, topicId: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="topic-1"
            required
            disabled={!!topic}
          />
          {topic && <p className="text-xs text-gray-500 mt-1">Topic ID cannot be changed when editing</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic Name (English) *</label>
          <input
            type="text"
            value={formData.topicName}
            onChange={(e) => setFormData({...formData, topicName: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic Name (Hindi) - Optional</label>
          <input
            type="text"
            value={formData.topicName_hi}
            onChange={(e) => setFormData({...formData, topicName_hi: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Make this topic FREE</span>
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function TopicWiseQuestionForm({ question, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    question: question?.question_en || '',
    question_hi: question?.question_hi || '',
    options: question?.options_en?.join(', ') || '',
    options_hi: question?.options_hi?.join(', ') || '',
    correctAnswer: question?.correctAnswer || 0,
    marks: question?.marks || 1,
    negativeMarks: question?.negativeMarks || 0,
    imageUrl: question?.imageUrl || '',
    explanation_en: question?.explanation_en || '',
    explanation_hi: question?.explanation_hi || '',
    difficulty: question?.difficulty || 'medium',
    order: question?.order || 0,
    isFree: question?.isFree || false,
    solutionVideoLink: question?.solutionVideoLink || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{question ? 'Edit Question' : 'Add New Question'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Question (English) *</label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData({...formData, question: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Question (Hindi) - Optional</label>
          <textarea
            value={formData.question_hi}
            onChange={(e) => setFormData({...formData, question_hi: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Options (English) *</label>
          <input
            type="text"
            value={formData.options}
            onChange={(e) => setFormData({...formData, options: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Option 1, Option 2, Option 3, Option 4"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Options (Hindi) - Optional</label>
          <input
            type="text"
            value={formData.options_hi}
            onChange={(e) => setFormData({...formData, options_hi: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="विकल्प 1, विकल्प 2, विकल्प 3, विकल्प 4"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correct Answer Index *</label>
          <input
            type="number"
            value={formData.correctAnswer}
            onChange={(e) => setFormData({...formData, correctAnswer: parseInt(e.target.value) || 0})}
            className="w-full border rounded px-3 py-2 text-sm"
            min="0"
            required
          />
          <p className="text-xs text-gray-500 mt-1">0 = first option, 1 = second option, etc.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Marks per Question *</label>
            <input
              type="number"
              value={formData.marks || 1}
              onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value) || 1})}
              className="w-full border rounded px-3 py-2 text-sm"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Default: 1 mark</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Negative Marks</label>
            <input
              type="number"
              value={formData.negativeMarks || 0}
              onChange={(e) => setFormData({...formData, negativeMarks: parseFloat(e.target.value) || 0})}
              className="w-full border rounded px-3 py-2 text-sm"
              min="0"
              step="0.25"
            />
            <p className="text-xs text-gray-500 mt-1">Marks deducted for wrong answer</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Question Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                formDataUpload.append('type', 'question-image');
                try {
                  const res = await fetch('/api/admin/upload-question-image', {
                    method: 'POST',
                    credentials: 'include',
                    body: formDataUpload
                  });
                  const data = await res.json();
                  if (res.ok && data.imageUrl) {
                    setFormData({...formData, imageUrl: data.imageUrl});
                  } else {
                    alert('Failed to upload image: ' + (data.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Image upload error:', error);
                  alert('Failed to upload image');
                }
              }
            }}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {formData.imageUrl && (
            <div className="mt-2">
              <img 
                src={formData.imageUrl} 
                alt="Question preview" 
                className="max-w-xs h-auto rounded border"
                onLoad={(e) => {
                  // Auto-fill width/height if not set
                  if (!formData.imageWidth && !formData.imageHeight) {
                    const img = e.target;
                    setFormData(prev => ({
                      ...prev,
                      imageWidth: img.naturalWidth || '',
                      imageHeight: img.naturalHeight || ''
                    }));
                  }
                }}
              />
              {/* Width and Height Adjustment */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">Image Width (px)</label>
                  <input
                    type="number"
                    value={formData.imageWidth}
                    onChange={(e) => setFormData({...formData, imageWidth: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Auto"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">Image Height (px)</label>
                  <input
                    type="number"
                    value={formData.imageHeight}
                    onChange={(e) => setFormData({...formData, imageHeight: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Auto"
                    min="1"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, imageUrl: '', imageWidth: '', imageHeight: ''})}
                className="mt-2 text-red-600 text-sm hover:underline"
              >
                Remove Image
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Upload an image for this question (optional)</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Solution Video Link (Optional)</label>
          <input
            type="url"
            value={formData.solutionVideoLink || ''}
            onChange={(e) => setFormData({...formData, solutionVideoLink: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="https://drive.google.com/file/d/..."
          />
          <p className="text-xs text-gray-500 mt-1">Enter Google Drive link or any video URL for solution. This will be shown in the result page.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Explanation (English) - Optional</label>
          <textarea
            value={formData.explanation_en || ''}
            onChange={(e) => setFormData({...formData, explanation_en: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
            placeholder="Enter a brief explanation for the correct answer"
          />
          <p className="text-xs text-gray-500 mt-1">A one-liner explanation that will be shown in the result page below the options.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Explanation (Hindi) - Optional</label>
          <textarea
            value={formData.explanation_hi || ''}
            onChange={(e) => setFormData({...formData, explanation_hi: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
            placeholder="सही उत्तर के लिए एक संक्षिप्त व्याख्या दर्ज करें"
          />
          <p className="text-xs text-gray-500 mt-1">विकल्पों के नीचे परिणाम पृष्ठ पर दिखाई जाने वाली एक-पंक्ति व्याख्या।</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFree}
              onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Make this question FREE</span>
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function BackspaceSettingsAdmin() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backspace-settings', { credentials: 'include' });
      const data = await res.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error('Failed to fetch backspace settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingSetting ? 'PUT' : 'POST';
      const body = {
        duration: parseInt(formData.duration),
        backspaceLimit: parseInt(formData.backspaceLimit),
        description: formData.description || `${formData.duration}min-${formData.backspaceLimit} backspace`,
        isActive: formData.isActive !== false
      };
      if (editingSetting) {
        body._id = editingSetting._id;
      }

      const res = await fetch('/api/admin/backspace-settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (res.ok) {
        await refresh();
        setShowForm(false);
        setEditingSetting(null);
      } else {
        setSaveError(result.error || 'Failed to save setting');
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (settingId) => {
    if (!confirm('Are you sure you want to delete this backspace setting?')) return;
    try {
      const res = await fetch(`/api/admin/backspace-settings?_id=${settingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await refresh();
      } else {
        alert('Failed to delete setting');
      }
    } catch (error) {
      console.error('Failed to delete setting:', error);
      alert('Failed to delete setting');
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 rounded">
        <p className="text-sm text-green-800">
          <strong>Backspace Control Settings:</strong> Set backspace limits for different test durations. 
          For example, "5min-10 backspace" means 10 backspaces allowed for 5-minute tests. 
          These settings apply across the entire website.
        </p>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Backspace Control Settings</h3>
        <button 
          onClick={() => { setEditingSetting(null); setShowForm(true); }} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Add Setting
        </button>
      </div>

      <div className="bg-white border rounded-lg p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No backspace settings yet. Click "+ Add Setting" to create one.</div>
        ) : (
          <div className="space-y-3">
            {settings.map(s => (
              <div key={s._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-lg">
                      {s.duration} Minute Test - {s.backspaceLimit} Backspace{s.backspaceLimit !== 1 ? 's' : ''} Allowed
                    </div>
                    {s.description && (
                      <div className="text-sm text-gray-600 mt-1">{s.description}</div>
                    )}
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingSetting(s); setShowForm(true); }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditingSetting(null); setSaveError(''); }}>
          <BackspaceSettingForm
            setting={editingSetting}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingSetting(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}
    </div>
  );
}

function BackspaceSettingForm({ setting, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    duration: setting?.duration || '',
    backspaceLimit: setting?.backspaceLimit || '',
    description: setting?.description || '',
    isActive: setting?.isActive !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">{setting ? 'Edit Backspace Setting' : 'Add New Backspace Setting'}</h4>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test Duration (Minutes) *</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="5"
            min="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Duration of the test in minutes (e.g., 5, 10, 15)</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Backspace Limit *</label>
          <input
            type="number"
            value={formData.backspaceLimit}
            onChange={(e) => setFormData({...formData, backspaceLimit: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="10"
            min="0"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Maximum number of backspaces allowed (0 = unlimited)</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="5min-10 backspace"
          />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Active (Enable this setting)</span>
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function FeaturesAdmin() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/features', { credentials: 'include' });
      const data = await res.json();
      setFeatures(data.features || []);
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      const method = editingFeature ? 'PUT' : 'POST';
      const body = {
        title: formData.title,
        description: formData.description,
        icon: formData.icon || '✓',
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive !== false
      };
      if (editingFeature) {
        body._id = editingFeature._id;
      }

      const res = await fetch('/api/admin/features', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (res.ok) {
        await refresh();
        setShowForm(false);
        setEditingFeature(null);
        alert('Feature saved successfully!');
      } else {
        setSaveError(result.error || 'Failed to save feature');
      }
    } catch (error) {
      setSaveError('Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (featureId) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      const res = await fetch(`/api/admin/features?id=${featureId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await refresh();
        alert('Feature deleted successfully!');
      } else {
        alert('Failed to delete feature');
      }
    } catch (error) {
      console.error('Failed to delete feature:', error);
      alert('Failed to delete feature');
    }
  };

  const handleToggleActive = async (feature) => {
    try {
      const res = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          _id: feature._id,
          isActive: !feature.isActive
        })
      });
      if (res.ok) {
        await refresh();
      } else {
        alert('Failed to update feature');
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      alert('Failed to update feature');
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('This will create default features. Continue?')) return;
    try {
      const res = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'initialize' })
      });
      const result = await res.json();
      if (res.ok) {
        await refresh();
        alert('Default features initialized successfully!');
      } else {
        alert(result.error || 'Failed to initialize features');
      }
    } catch (error) {
      console.error('Failed to initialize features:', error);
      alert('Failed to initialize features');
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Subscription Features:</strong> Manage features that are displayed to users on the payment page. 
          These features show what users get when they subscribe. Features are displayed in a popup on the payment page.
        </p>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Subscription Features</h3>
        <div className="flex gap-2">
          {features.length === 0 && (
            <button 
              onClick={handleInitializeDefaults} 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Initialize Default Features
            </button>
          )}
          <button 
            onClick={() => { setEditingFeature(null); setShowForm(true); }} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + Add Feature
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : features.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No features yet. Click "+ Add Feature" to create one.</div>
        ) : (
          <div className="space-y-3">
            {features.map(f => (
              <div key={f._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{f.icon || '✓'}</span>
                      <div className="font-medium text-lg">{f.title}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 ml-8">{f.description}</div>
                    <div className="mt-2 ml-8 flex gap-2">
                      <span className="text-xs text-gray-500">Order: {f.order}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {f.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(f)}
                      className={`px-3 py-1 rounded text-sm ${
                        f.isActive 
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {f.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => { setEditingFeature(f); setShowForm(true); }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(f._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditingFeature(null); setSaveError(''); }}>
          <FeatureForm
            feature={editingFeature}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingFeature(null); setSaveError(''); }}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}
    </div>
  );
}

function FeatureForm({ feature, onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    title: feature?.title || '',
    description: feature?.description || '',
    icon: feature?.icon || '✓',
    order: feature?.order || 0,
    isActive: feature?.isActive !== false,
    showTick: feature?.showTick !== false,
    showWrong: feature?.showWrong === true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-2">{feature ? 'Edit Feature' : 'Add New Feature'}</h4>
      <p className="text-sm text-gray-600 mb-4">This feature will apply to all plans (Learning, Skill Test, Exam)</p>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Feature Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g., Unlimited Learning"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g., Access to all learning materials"
            rows="3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Icon (Emoji or Symbol)</label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({...formData, icon: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="✓ or 📚 or 🎯"
          />
          <p className="text-xs text-gray-500 mt-1">Enter an emoji or symbol to display with this feature</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Display Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: e.target.value})}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="0"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Lower numbers appear first (0 = first)</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Active (Show on payment page)</span>
          </label>
          <div className="border-t pt-3">
            <label className="block text-sm font-medium mb-2">Display Indicator</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="indicator"
                  checked={!formData.showWrong}
                  onChange={() => setFormData({...formData, showWrong: false, showTick: true})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Show Tick (✓) - Feature Included</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="indicator"
                  checked={formData.showWrong}
                  onChange={() => setFormData({...formData, showWrong: true, showTick: false})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Show Wrong (✗) - Feature Not Included</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function CPCTImportModal({ examId, onClose }) {
  const [importing, setImporting] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  const sections = [
    { name: 'Computer Proficiency (52 questions)', number: 1, key: 'computer' },
    { name: 'Reading Comprehension (5 questions)', number: 2, key: 'reading' },
    { name: 'Quantitative Aptitude (6 questions)', number: 3, key: 'quantitative' },
    { name: 'General Mental Ability (6 questions)', number: 4, key: 'reasoning' },
    { name: 'General Awareness (6 questions)', number: 5, key: 'awareness' },
    { name: 'English Mock Typing', number: 2, key: 'english-mock' },
    { name: 'English Actual Typing', number: 3, key: 'english-actual' },
    { name: 'Hindi Mock Typing', number: 4, key: 'hindi-mock' },
    { name: 'Hindi Actual Typing', number: 5, key: 'hindi-actual' }
  ];

  const handleImportSection = async (section) => {
    if (!examId) {
      alert('Please select CPCT exam first');
      return;
    }

    setImporting(true);
    setCurrentSection(section.key);
    setProgress({ current: 0, total: 0, message: `Preparing to import ${section.name}...` });

    try {
      alert(`Import functionality for "${section.name}" will be implemented.\n\nFor now, please use the admin panel to manually add questions section by section.`);
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
      setCurrentSection('');
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  return (
    <Modal onClose={onClose}>
      <div>
        <h4 className="font-semibold text-lg mb-4">Import CPCT Exam Data</h4>
        <p className="text-sm text-gray-600 mb-4">
          Import exam data section by section. Each section will be imported separately.
        </p>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => handleImportSection(section)}
              disabled={importing || !examId}
              className={`w-full text-left p-3 rounded border transition-colors ${
                importing && currentSection === section.key
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${!examId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">{section.name}</div>
              {importing && currentSection === section.key && (
                <div className="text-xs text-blue-600 mt-1">{progress.message}</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Due to the large amount of data, questions need to be imported manually through the admin panel. 
            Select the exam, create sections, and add questions one by one or in batches.
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}


