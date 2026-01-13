"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
    }
  }, [isCheckingAuth]);

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
    setExams(data.exams || []);
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
        totalQuestions: parseInt(formData.totalQuestions) || 75 
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
          order: parseInt(formData.order) || newOrder
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
          console.log('💾 Saving image question with imageUrl:', body.imageUrl);
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
          } else {
            body.imageUrl = '';
          }
        }
        
        body.options_en = options;
        body.options_hi = options_hi;
        body.correctAnswer = parseInt(formData.correctAnswer) || 0;
        body.marks = parseInt(formData.marks) || 1;
        body.negativeMarks = parseFloat(formData.negativeMarks) || 0;
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
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>How to use:</strong> Select an Exam → Select a Section → Select a Part → View/Add Questions
            </p>
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
                        <div className={`px-4 pb-2 flex gap-2 ${selectedExam === exam._id ? 'border-t border-purple-300 pt-2' : ''}`}>
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
              <li key={part._id}>
                        <button 
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City/State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscriptions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
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
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedUser.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{selectedUser.city}, {selectedUser.states}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Referral Code</p>
                  <p className="font-medium font-mono">{selectedUser.referralCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Referral Rewards</p>
                  <p className="font-medium">{selectedUser.referralRewards || 0} months earned</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Subscriptions</p>
                  <p className="font-medium">{selectedUser.totalSubscriptions} ({selectedUser.activeSubscriptions} active)</p>
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
function ExamFormModal({ exam, onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    key: exam?.key || 'CPCT',
    totalTime: exam?.totalTime || 75,
    totalQuestions: exam?.totalQuestions || 75
  });

  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || '',
        key: exam.key || 'CPCT',
        totalTime: exam.totalTime || 75,
        totalQuestions: exam.totalQuestions || 75
      });
    } else {
      setFormData({
        title: '',
        key: 'CPCT',
        totalTime: 75,
        totalQuestions: 75
      });
    }
  }, [exam]);

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
              <option value="CPCT">CPCT</option>
              <option value="RSCIT">RSCIT</option>
              <option value="CCC">CCC</option>
              <option value="CUSTOM">TOPIC WISE (CUSTOM)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {exam ? 'Exam type cannot be changed after creation' : 'This determines which exam mode it appears in'}
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
    order: ''
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
    useImageForQuestion: question?.question_en === '[Image Question]' || !!(question?.imageUrl && question.imageUrl.trim() !== ''), // Check if question uses image
    // Typing fields
    typingLanguage: question?.typingLanguage || 'English',
    typingScriptType: question?.typingScriptType || 'Ramington Gail',
    typingContent_english: question?.typingContent_english || '',
    typingContent_hindi_ramington: question?.typingContent_hindi_ramington || '',
    typingContent_hindi_inscript: question?.typingContent_hindi_inscript || '',
    typingDuration: question?.typingDuration || 5,
    typingBackspaceEnabled: question?.typingBackspaceEnabled || false,
    isFree: question?.isFree || false
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
        useImageForQuestion: isImageQuestion, // Set to true if marked as image question OR has imageUrl
        typingLanguage: question.typingLanguage || 'English',
        typingScriptType: question.typingScriptType || 'Ramington Gail',
        typingContent_english: question.typingContent_english || '',
        typingContent_hindi_ramington: question.typingContent_hindi_ramington || '',
        typingContent_hindi_inscript: question.typingContent_hindi_inscript || '',
        typingDuration: question.typingDuration || 5,
        typingBackspaceEnabled: question.typingBackspaceEnabled || false,
        isFree: question.isFree || false
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
        useImageForQuestion: false,
    typingLanguage: 'English',
    typingScriptType: 'Ramington Gail',
    typingContent_english: '',
    typingContent_hindi_ramington: '',
    typingContent_hindi_inscript: '',
    typingDuration: 5,
    typingBackspaceEnabled: false,
    isFree: false
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
                        onLoad={() => {
                          console.log('✅ Image preview loaded successfully:', formData.imageUrl);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🗑️ Removing image. Current imageUrl:', formData.imageUrl);
                          setFormData({...formData, imageUrl: ''});
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
                    <textarea
                      value={formData.typingContent_hindi_ramington}
                      onChange={(e) => setFormData({...formData, typingContent_hindi_ramington: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 font-serif"
                      rows="8"
                      placeholder="Enter the Hindi text in Ramington Gail script"
                      required={formData.typingScriptType === 'Ramington Gail'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Typing Content (Hindi - Inscript) *</label>
                    <textarea
                      value={formData.typingContent_hindi_inscript}
                      onChange={(e) => setFormData({...formData, typingContent_hindi_inscript: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 font-serif"
                      rows="8"
                      placeholder="Enter the Hindi text in Inscript script"
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

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    const { type, id } = showDeleteConfirm;
    const res = await fetch(`/api/admin/learning?type=${type}&id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      refresh();
      if (type === 'section') setSelectedSection(null);
      setShowDeleteConfirm(null);
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
              Are you sure you want to delete this {showDeleteConfirm.type}? 
              {showDeleteConfirm.type === 'section' && ' This will also delete all lessons in this section.'}
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
                  <div className="text-sm text-gray-600 mt-1">
                    {l.difficulty} • {l.estimatedTime}
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
  const [formData, setFormData] = useState({
    sectionId: lesson?.sectionId || '',
    id: lesson?.id || '',
    title: lesson?.title || '',
    title_hindi: lesson?.title_hindi || '',
    description: lesson?.description || '',
    description_hindi: lesson?.description_hindi || '',
    difficulty: lesson?.difficulty || 'beginner',
    estimatedTime: lesson?.estimatedTime || '5 minutes',
    content_english: lesson?.content?.english || '',
    content_hindi_ramington: lesson?.content?.hindi_ramington || '',
    content_hindi_inscript: lesson?.content?.hindi_inscript || '',
    isFree: lesson?.isFree || false
  });

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
            <textarea
              value={formData.content_hindi_ramington}
              onChange={(e) => setFormData({...formData, content_hindi_ramington: e.target.value})}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows="4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content (Hindi - Inscript)</label>
            <textarea
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
                <textarea
                  value={formData.content_hindi_ramington}
                  onChange={(e) => setFormData({...formData, content_hindi_ramington: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                rows="4"
                  placeholder="Hindi Ramington content..."
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Content (Hindi - Inscript) - Optional</label>
                <textarea
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
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const refreshTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/topicwise/topics');
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
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
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const topicId = formData.topicId || `topic-${timestamp}-${random}`;
      
      const body = {
        topicId: topicId,
        topicName: formData.topicName,
        topicName_hi: formData.topicName_hi || ''
      };
      const res = await fetch('/api/admin/topicwise/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        await refreshTopics();
        setShowTopicForm(false);
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
        isFree: formData.isFree === true || formData.isFree === 'true'
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

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">Topics</h4>
            <button 
              onClick={() => { setShowTopicForm(true); }} 
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
                  onClick={() => setSelectedTopic(topic.topicId)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedTopic === topic.topicId
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="font-medium">{topic.topicName}</div>
                  {topic.topicName_hi && <div className="text-xs text-gray-600 mt-1">{topic.topicName_hi}</div>}
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
        <Modal onClose={() => { setShowTopicForm(false); setSaveError(''); }}>
          <TopicForm
            onSave={handleSaveTopic}
            onCancel={() => { setShowTopicForm(false); setSaveError(''); }}
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

function TopicForm({ onSave, onCancel, saving, error }) {
  const [formData, setFormData] = useState({
    topicId: '',
    topicName: '',
    topicName_hi: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">Add New Topic</h4>
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
          />
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
    isFree: question?.isFree || false
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
              <img src={formData.imageUrl} alt="Question preview" className="max-w-xs h-auto rounded border" />
              <button
                type="button"
                onClick={() => setFormData({...formData, imageUrl: ''})}
                className="mt-2 text-red-600 text-sm hover:underline"
              >
                Remove Image
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Upload an image for this question (optional)</p>
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


