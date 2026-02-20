"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TypingArea from "@/components/typing/TypingArea";
import ExamTypingInterface from "@/components/typing/ExamTypingInterface";

function ExamModeContent() {
  // Add landscape-specific styles to reduce sizes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Landscape ONLY - Fix UI breaking issues for MCQ QUESTIONS ONLY */
      /* Works for all mobile devices: iPhone SE, iPhone 12, etc. */
      /* COMPLETELY SEPARATED FROM TYPING - Only applies when data-exam-mode="mcq" */
      @media screen and (orientation: landscape) and (max-height: 500px),
             screen and (orientation: landscape) and (max-width: 1024px) and (max-height: 600px) {
        
        /* ALL RULES SCOPE TO MCQ ONLY - Prefix all selectors with [data-exam-mode="mcq"] */
        [data-exam-mode="mcq"] {
        /* Hide exam title completely in landscape */
        .landscape-reduce-title {
          display: none !important;
        }
        
        /* Hide section navigation (Section A, B, C tabs) in landscape */
        .landscape-hide-sections,
        .landscape-reduce-section-nav {
          display: none !important;
        }
        
        /* Hide desktop sidebar question palette in landscape (MCQ only) */
        div.hidden.lg\\:block.w-full.lg\\:w-60 {
          display: none !important;
        }
        
        /* Hide parts navigation in landscape */
        .landscape-hide-parts {
          display: none !important;
        }
        
        /* Hide subject tabs row in landscape */
        .landscape-hide-subject-tabs {
          display: none !important;
        }
        
        /* Hide mobile menu button in landscape */
        button.lg\\:hidden.fixed.top-1.left-2.z-50 {
          display: none !important;
        }
        
        /* Hide mobile sidebar in landscape */
        div.lg\\:hidden.fixed.inset-0.z-40.bg-white {
          display: none !important;
        }
        
        /* Show question slider in mobile landscape (MCQ only) - visible like portrait */
        /* The question navigation should behave the same in mobile portrait and landscape */
        /* Only desktop (lg and above) should hide it */
        .landscape-reduce-question-grid.flex {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 20 !important;
          width: 100% !important;
          max-width: 100vw !important;
          background: white !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        
        .landscape-reduce-question-grid,
        .landscape-reduce-question-grid.lg\\:hidden,
        div.lg\\:hidden.landscape-reduce-question-grid {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Timer is hidden by default - only show in landscape */
        .landscape-reduce-timer {
          display: none !important;
        }
        
        /* Show timer ONLY in landscape mode */
        .landscape-reduce-header .hidden.landscape-reduce-timer,
        .landscape-reduce-header .landscape-reduce-timer {
          display: flex !important;
          visibility: visible !important;
        }
        
        /* Increase button size a little and ensure at bottom */
        .landscape-reduce-buttons {
          padding: 0.35rem 0.6rem !important;
          font-size: 0.65rem !important;
          line-height: 1.2 !important;
        }
        
        /* Reduce header height to minimum (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-header {
          padding: 0.15rem 0.5rem !important;
          font-size: 0.55rem !important;
          min-height: 28px !important;
          max-height: 28px !important;
        }
        
        /* Ensure sound and timer are properly sized in header (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-header button,
        [data-exam-mode="mcq"] .landscape-reduce-header > div > div {
          flex-shrink: 0 !important;
        }
        
        /* Ensure timer is visible in header - force display in landscape */
        .landscape-reduce-timer {
          display: flex !important;
          visibility: visible !important;
          align-items: center !important;
        }
        
        /* Force timer to show in header for all question types in landscape */
        .landscape-reduce-header .landscape-reduce-timer,
        .landscape-reduce-header .landscape-reduce-timer > div,
        .landscape-reduce-header .landscape-reduce-timer span,
        .landscape-reduce-header .landscape-reduce-timer b {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Ensure timer container and all children are visible in landscape */
        .landscape-reduce-header > div.flex.gap-2.items-center > .landscape-reduce-timer {
          display: flex !important;
          visibility: visible !important;
          order: -1 !important;
          margin-right: 0.5rem !important;
        }
        
        /* Position main content area below fixed header (MCQ only) */
        [data-exam-mode="mcq"] div.flex-1.flex.flex-col.h-full.overflow-hidden {
          margin-top: 28px !important;
          padding-top: 0 !important;
        }
        
        /* Position question panel to touch top (MCQ only) */
        [data-exam-mode="mcq"] div.flex-1.flex.flex-col.overflow-hidden.bg-white-50 {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        
        /* Make Question Type bar touch the top (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-top-bar {
          margin-top: 0 !important;
          padding-top: 0.1rem !important;
          border-radius: 0 !important;
        }
        
        /* Add padding and margin to question content to account for fixed buttons at bottom (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content {
          padding-top: 0.5rem !important;
          padding-bottom: 70px !important;
          margin-top: 0.5rem !important;
        }
        
        /* Ensure question content area has proper spacing from top */
        .landscape-question-content > *:first-child {
          margin-top: 0.5rem !important;
        }
        
        /* Reduce question panel padding */
        .landscape-reduce-padding {
          padding: 0.1rem 0.25rem !important;
        }
        
        /* Reduce question number bar (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-question-bar {
          padding: 0.1rem 0.25rem !important;
          font-size: 0.55rem !important;
          min-height: 20px !important;
          max-height: 20px !important;
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Reduce top bar and make it touch top (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-top-bar {
          padding: 0.1rem 0.25rem !important;
          font-size: 0.55rem !important;
          min-height: 20px !important;
          max-height: 20px !important;
          margin-top: 0 !important;
          border-radius: 0 !important;
        }
        
        /* Hide section navigation (Section A, B, C tabs) in landscape */
        .landscape-hide-sections,
        .landscape-reduce-section-nav {
          display: none !important;
        }
        
        /* Hide parts navigation in landscape */
        .landscape-hide-parts {
          display: none !important;
        }
        
        /* Hide subject tabs row in landscape */
        .landscape-hide-subject-tabs {
          display: none !important;
        }
        
        /* Hide status bar (sound + timer) in landscape for questions ONLY */
        .landscape-hide-status-bar {
          display: none !important;
        }
        
        /* Reduce subject tabs */
        .landscape-reduce-subject-tabs {
          padding: 0.1rem 0.25rem !important;
          font-size: 0.55rem !important;
          min-height: 20px !important;
          max-height: 20px !important;
        }
        
        /* Question slider visibility is controlled by lg:hidden class in render logic */
        /* lg:hidden means: show on mobile/tablet (including landscape), hide on desktop */
        /* No need for orientation-based CSS - let Tailwind handle it via lg:hidden */
        
        /* Ensure question slider appears right after navbar in landscape (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-question-grid {
          position: relative !important;
          z-index: 20 !important;
          background: white !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        
        [data-exam-mode="mcq"] .landscape-reduce-question-grid > div,
        [data-exam-mode="mcq"] .landscape-reduce-question-grid button {
          padding: 0.2rem !important;
          font-size: 0.6rem !important;
          min-width: 1.75rem !important;
          min-height: 1.5rem !important;
          width: 1.75rem !important;
          height: 1.5rem !important;
          flex-shrink: 0 !important;
        }
        
        /* Show question navigation strip in mobile landscape (MCQ only) - same as portrait */
        /* The lg:hidden class in render logic already handles desktop hiding */
        /* No need to hide in landscape - it should show in mobile landscape like portrait */
        [data-exam-mode="mcq"] .landscape-reduce-question-grid.flex {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        [data-exam-mode="mcq"] .landscape-reduce-question-grid.flex > div {
          min-width: 1.75rem !important;
          height: 1.5rem !important;
          font-size: 0.6rem !important;
          flex-shrink: 0 !important;
        }
        
        /* Reduce passage height significantly */
        .landscape-reduce-passage {
          max-height: 10vh !important;
          font-size: 0.55rem !important;
          padding: 0.1rem !important;
        }
        
        /* Reduce question text (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-question-text {
          font-size: 0.55rem !important;
          padding: 0.1rem !important;
          margin-bottom: 0.2rem !important;
          line-height: 1.2 !important;
        }
        
        /* Reduce options (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-options {
          font-size: 0.55rem !important;
          padding: 0.2rem !important;
          margin-bottom: 0.2rem !important;
          line-height: 1.2 !important;
        }
        
        /* Reduce question text in general content area (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content p,
        [data-exam-mode="mcq"] .landscape-question-content div:not(.landscape-reduce-question-bar):not(.landscape-reduce-top-bar) {
          font-size: 0.55rem !important;
          line-height: 1.2 !important;
        }
        
        /* Reduce option labels and radio buttons (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content label {
          font-size: 0.55rem !important;
          line-height: 1.2 !important;
          padding: 0.2rem !important;
        }
        
        /* Reduce image max height */
        .landscape-reduce-image {
          max-height: 20vh !important;
        }
        
        .landscape-reduce-image img {
          max-height: 20vh !important;
        }
        
        /* Increase button size a little and ensure at bottom */
        .landscape-reduce-buttons {
          padding: 0.4rem 0.7rem !important;
          font-size: 0.7rem !important;
          line-height: 1.2 !important;
        }
        
        /* Force buttons to be in one line in landscape and fixed at bottom */
        .landscape-buttons-container {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 0.3rem !important;
          padding: 0.4rem !important;
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          background: white !important;
          border-top: 1px solid #e5e7eb !important;
          z-index: 25 !important;
          min-height: auto !important;
        }
        
        .landscape-buttons-container > button {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          padding: 0.4rem 0.7rem !important;
          font-size: 0.7rem !important;
        }
        
        /* Reduce timer */
        .landscape-reduce-timer {
          font-size: 0.55rem !important;
          padding: 0.1rem 0.25rem !important;
        }
        
        .landscape-reduce-timer b {
          font-size: 0.6rem !important;
          padding: 0.1rem 0.25rem !important;
        }
        
        /* Ensure question content area has maximum space and is visible (MCQ only) - Main screen */
        [data-exam-mode="mcq"] .flex-1.flex.flex-col.overflow-hidden {
          min-height: 0 !important;
          height: auto !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 100vw !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Make sure scrollable content area is visible and optimized (MCQ only) - Main screen display */
        [data-exam-mode="mcq"] .landscape-question-content {
          min-height: 0 !important;
          height: auto !important;
          max-height: calc(100vh - 200px) !important;
          overflow-y: auto !important;
          display: flex !important;
          flex-direction: column !important;
          flex: 1 1 auto !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          max-width: 100vw !important;
          padding: 0.5rem !important;
          margin-top: 0 !important;
        }
        
        /* Ensure question content is visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > * {
          flex-shrink: 0 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Ensure question display area is visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div:not(.landscape-reduce-question-bar) {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Ensure question text and options are visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content p,
        [data-exam-mode="mcq"] .landscape-question-content label,
        [data-exam-mode="mcq"] .landscape-question-content input[type="radio"],
        [data-exam-mode="mcq"] .landscape-question-content span,
        [data-exam-mode="mcq"] .landscape-question-content div:not(.landscape-reduce-question-bar):not(.landscape-reduce-top-bar) {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Force question content wrapper div to be visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div.p-4.text-md,
        [data-exam-mode="mcq"] .landscape-question-content > div.p-4.text-xl,
        [data-exam-mode="mcq"] .landscape-question-content > div.mb-28 {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 0.5rem !important;
        }
        
        /* Ensure question text paragraph is visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content p.landscape-reduce-question-text,
        [data-exam-mode="mcq"] .landscape-question-content p.mb-4,
        [data-exam-mode="mcq"] .landscape-question-content p.mb-6 {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          font-size: 0.55rem !important;
          padding: 0.1rem !important;
          margin-bottom: 0.2rem !important;
          line-height: 1.2 !important;
        }
        
        /* Ensure option labels are visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content label.landscape-reduce-options,
        [data-exam-mode="mcq"] .landscape-question-content label.flex.items-start {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          font-size: 0.55rem !important;
          padding: 0.2rem !important;
          margin-bottom: 0.2rem !important;
          line-height: 1.2 !important;
        }
        
        /* Ensure question content container is visible and takes full space (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          flex: 1 1 auto !important;
          min-height: 200px !important;
          width: 100% !important;
          max-width: 100vw !important;
        }
        
        /* Ensure question content wrapper divs are visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div.p-4,
        [data-exam-mode="mcq"] .landscape-question-content > div.text-md,
        [data-exam-mode="mcq"] .landscape-question-content > div.text-xl,
        [data-exam-mode="mcq"] .landscape-question-content > div.mb-28 {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        /* Ensure passage and question layout div is visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div.flex.flex-col.lg\\:flex-row {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
        }
        
        /* Ensure question panel container is visible in main screen (MCQ only) */
        [data-exam-mode="mcq"] div.flex-1.flex.flex-col.overflow-hidden.bg-white-50 {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          max-width: 100vw !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        /* Ensure question content divs are visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div.p-4,
        [data-exam-mode="mcq"] .landscape-question-content > div.flex.flex-col,
        [data-exam-mode="mcq"] .landscape-question-content > div:has(p),
        [data-exam-mode="mcq"] .landscape-question-content > div:has(label) {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Ensure question content wrapper div is visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div.text-md,
        [data-exam-mode="mcq"] .landscape-question-content > div.text-xl,
        [data-exam-mode="mcq"] .landscape-question-content > div.mb-28 {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        /* Ensure passage and question layout is visible (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content > div.flex.flex-col.lg\\:flex-row {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
        }
        
        /* Reduce margins and padding throughout */
        .landscape-reduce-padding > * {
          margin-bottom: 0.25rem !important;
        }
        
        /* Make sure scrollable content area is optimized */
        div[class*="overflow-y-auto"]:not(.landscape-reduce-passage) {
          padding: 0.25rem !important;
        }
        
        /* Fix question panel container */
        div.flex-1.flex.flex-col.overflow-hidden.bg-white-50 {
          min-height: 0 !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Ensure question text and options are visible */
        .landscape-reduce-question-text,
        .landscape-reduce-options {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Fix image display */
        .landscape-reduce-image {
          display: block !important;
          visibility: visible !important;
        }
        
        
        /* Fix main container - use proper height calculation */
        div.h-screen.flex.flex-col {
          height: 100dvh !important;
          max-height: 100dvh !important;
          overflow: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
        }
        
        /* Fix main wrapper container */
        div.flex-1.flex.flex-col.h-full.overflow-hidden {
          height: calc(100dvh - 22px) !important;
          max-height: calc(100dvh - 22px) !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Fix fixed header - prevent overlap */
        .landscape-reduce-header.fixed {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          z-index: 30 !important;
          flex-shrink: 0 !important;
        }
        
        /* Fix sticky section nav - position below header */
        .landscape-reduce-section-nav.sticky {
          position: sticky !important;
          top: 22px !important;
          width: 100% !important;
          max-width: 100vw !important;
          z-index: 20 !important;
          flex-shrink: 0 !important;
        }
        
        /* Prevent horizontal overflow on body */
        body {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
        }
        
        /* Prevent horizontal overflow on question elements only (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* Fix question panel - proper height calculation (MCQ only) */
        [data-exam-mode="mcq"] div.flex-1.flex.flex-col.overflow-hidden.bg-white-50 {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          height: auto !important;
          max-height: calc(100dvh - 150px) !important;
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          overflow-y: visible !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Fix question content area - proper scrolling (MCQ only) */
        [data-exam-mode="mcq"] .landscape-question-content {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          height: auto !important;
          max-height: calc(100dvh - 200px) !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          max-width: 100vw !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Fix question navigation overflow - horizontal scroll only (MCQ only) */
        [data-exam-mode="mcq"] .landscape-reduce-question-grid.flex {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          max-width: 100vw !important;
          flex-shrink: 0 !important;
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Fix subject tabs overflow - horizontal scroll only */
        .landscape-reduce-subject-tabs {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          max-width: 100vw !important;
          flex-shrink: 0 !important;
        }
        
        /* Fix buttons container - no overflow, proper alignment */
        .landscape-buttons-container {
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          flex-wrap: nowrap !important;
          flex-shrink: 0 !important;
          display: flex !important;
          flex-direction: row !important;
        }
        
        /* Ensure all question elements are visible */
        .landscape-question-content p,
        .landscape-question-content div:not(.landscape-reduce-question-bar),
        .landscape-question-content label {
          display: block !important;
          visibility: visible !important;
          max-width: 100% !important;
        }
        
        /* Fix padding to prevent overflow */
        .landscape-reduce-padding,
        .landscape-reduce-question-text,
        .landscape-reduce-options {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          overflow-x: hidden !important;
        }
        
        /* Ensure images don't overflow */
        .landscape-reduce-image,
        .landscape-reduce-image img {
          max-width: 100% !important;
          width: auto !important;
          height: auto !important;
          display: block !important;
        }
        
        /* Fix timer positioning - prevent overlap */
        .landscape-reduce-timer {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
        }
        
        /* Fix exam title margin to prevent overlap */
        .landscape-reduce-title {
          margin-top: 22px !important;
        }
        
        /* Ensure proper spacing between elements */
        .landscape-reduce-top-bar,
        .landscape-reduce-question-bar {
          flex-shrink: 0 !important;
        }
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const [section, setSection] = useState("");
  const [timeLeft, setTimeLeft] = useState(75 * 60);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Mobile = width <= 1024px (regardless of orientation)
  const [userName, setUserName] = useState("User");
  const [userProfileUrl, setUserProfileUrl] = useState("/lo.jpg");
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
  const [questionLanguage, setQuestionLanguage] = useState("हिन्दी");
  const [viewLanguage, setViewLanguage] = useState("हिन्दी");
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
  const [selectedKeyboardType, setSelectedKeyboardType] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [modalLanguage, setModalLanguage] = useState("हिन्दी");
  const audioRef = useRef(null);
  const loggedImageQuestions = useRef(new Set()); // Track which questions we've already logged
  const questionScrollContainerRef = useRef(null); // Ref for mobile question navigation scroll container
  const desktopQuestionPaletteRef = useRef(null); // Ref for desktop sidebar question palette scroll container
  const sectionScrollContainerRef = useRef(null); // Ref for mobile section navigation scroll container
  const partsScrollContainerRef = useRef(null); // Ref for mobile parts navigation scroll container
  const searchParams = useSearchParams();
  const router = useRouter();

  // Determine if device is mobile (width <= 1024px) - single source of truth
  // This is used for render logic, NOT CSS - mobile includes both portrait and landscape
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    // Check on mount
    checkIsMobile();
    
    // Check on resize
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(selectedAnswers).length > 0) {
      localStorage.setItem('examAnswers', JSON.stringify(selectedAnswers));
    }
  }, [selectedAnswers]);

  // Save exam position (section, question index, part) so back & return resumes where user left off
  useEffect(() => {
    if (!section) return;
    const examId = typeof window !== 'undefined' ? localStorage.getItem('currentExamId') : null;
    const topicId = typeof window !== 'undefined' ? localStorage.getItem('currentTopicId') : null;
    if (examId || topicId) {
      try {
        localStorage.setItem('examProgress', JSON.stringify({
          examId: examId || undefined,
          topicId: topicId || undefined,
          section,
          currentQuestionIndex,
          selectedPart: selectedPart || undefined
        }));
      } catch (e) {
        console.error('Error saving exam progress:', e);
      }
    }
  }, [section, currentQuestionIndex, selectedPart]);

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
            if (userData.profileUrl || userData.profilePicture || userData.image) {
              setUserProfileUrl(userData.profileUrl || userData.profilePicture || userData.image);
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }

        // Load question language preference
        const savedLang = localStorage.getItem('questionLanguage');
        if (savedLang) {
          setQuestionLanguage(savedLang);
        } else {
          // Default to Hindi if no preference is saved
          setQuestionLanguage("हिन्दी");
          localStorage.setItem('questionLanguage', "हिन्दी");
        }
        
        // Load view language preference
        const savedViewLang = localStorage.getItem('viewLanguage');
        if (savedViewLang) {
          setViewLanguage(savedViewLang);
        } else {
          // Default to Hindi if no preference is saved
          setViewLanguage("हिन्दी");
          localStorage.setItem('viewLanguage', "हिन्दी");
        }

        // Get exam ID or topic ID from localStorage
        const examId = localStorage.getItem('currentExamId');
        const topicId = localStorage.getItem('currentTopicId');
        
        if (!examId && !topicId) {
          console.error('No exam ID or topic ID found');
          setLoading(false);
          return;
        }

        // Fetch exam or topic data
        const apiUrl = topicId 
          ? `/api/exam-questions?topicId=${topicId}`
          : `/api/exam-questions?examId=${examId}`;
        const res = await fetch(apiUrl);
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
                // No section parameter - try to restore from last position (resume exam)
                const savedProgressStr = localStorage.getItem('examProgress');
                let restored = false;
                if (savedProgressStr) {
                  try {
                    const saved = JSON.parse(savedProgressStr);
                    const sameExam = (saved.examId && saved.examId === examId) || (saved.topicId && saved.topicId === topicId);
                    const sectionExists = sortedSectionsForInit.some(s => s.name === saved.section);
                    if (sameExam && sectionExists && saved.section) {
                      targetSectionName = saved.section;
                      restored = true;
                      console.log('ℹ️ Restoring exam position:', saved.section, 'question', saved.currentQuestionIndex, 'part', saved.selectedPart);
                    }
                  } catch (e) {
                    console.error('Error parsing exam progress:', e);
                  }
                }
                if (!restored) {
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
                  targetSectionName = firstIncompleteSection ? firstIncompleteSection.name : sortedSectionsForInit[0].name;
                  console.log('ℹ️ Initial load - No section parameter in URL');
                  console.log('ℹ️ Using section:', targetSectionName, firstIncompleteSection ? '(first incomplete)' : '(first section)');
                }
              }
              
              // Only set section if we have a valid targetSectionName
              if (targetSectionName) {
                console.log('✅ Setting section to:', targetSectionName);
                setSection(targetSectionName);
                const targetSection = sortedSectionsForInit.find(s => s.name === targetSectionName) || sortedSectionsForInit[0];
                const targetSectionParts = (data.data.parts || []).filter(p => {
                  const pSectionId = String(p.sectionId).trim();
                  const secIdStr = String(targetSection.id).trim();
                  const secIdObj = String(targetSection._id).trim();
                  return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === targetSection._id.toString();
                }).sort((a, b) => (a.order || 0) - (b.order || 0));
                const hasSectionParam = searchParams?.get('section');
                if (!hasSectionParam) {
                  const savedProgressStr = localStorage.getItem('examProgress');
                  try {
                    const saved = JSON.parse(savedProgressStr || '{}');
                    const sameExam = (saved.examId && saved.examId === examId) || (saved.topicId && saved.topicId === topicId);
                    if (sameExam && saved.section === targetSectionName) {
                      const partQuestions = questionsByPartData[targetSectionName]?.[saved.selectedPart] ?? questionsBySection[targetSectionName] ?? [];
                      const maxIndex = Math.max(0, partQuestions.length - 1);
                      const savedIndex = typeof saved.currentQuestionIndex === 'number' ? Math.min(maxIndex, Math.max(0, saved.currentQuestionIndex)) : 0;
                      setCurrentQuestionIndex(savedIndex);
                      if (targetSectionParts.length > 0) {
                        const partExists = targetSectionParts.some(p => p.name === saved.selectedPart);
                        setSelectedPart(partExists ? saved.selectedPart : targetSectionParts[0].name);
                      } else {
                        setSelectedPart(null);
                      }
                    } else {
                      setCurrentQuestionIndex(0);
                      setSelectedPart(targetSectionParts.length > 0 ? targetSectionParts[0].name : null);
                    }
                  } catch (_) {
                    setCurrentQuestionIndex(0);
                    setSelectedPart(targetSectionParts.length > 0 ? targetSectionParts[0].name : null);
                  }
                } else {
                  setCurrentQuestionIndex(0);
                  setSelectedPart(targetSectionParts.length > 0 ? targetSectionParts[0].name : null);
                }
              } else {
                console.log('⏸️ Not setting section yet, will be set by useEffect from URL parameter');
              }
              
              // Set first part as default if section has parts (only when section came from URL; otherwise already set above)
              if (searchParams?.get('section')) {
                const targetSectionForPart = targetSectionName 
                  ? sortedSectionsForInit.find(s => s.name === targetSectionName) || sortedSectionsForInit[0]
                  : sortedSectionsForInit[0];
                const targetSectionPartsForPart = (data.data.parts || []).filter(p => {
                  const pSectionId = String(p.sectionId).trim();
                  const secIdStr = String(targetSectionForPart.id).trim();
                  const secIdObj = String(targetSectionForPart._id).trim();
                  return pSectionId === secIdObj || pSectionId === secIdStr || pSectionId === targetSectionForPart._id.toString();
                });
                if (targetSectionPartsForPart.length > 0) {
                  targetSectionPartsForPart.sort((a, b) => (a.order || 0) - (b.order || 0));
                  setSelectedPart(targetSectionPartsForPart[0].name);
                  console.log('Set default part to:', targetSectionPartsForPart[0].name, 'for section:', targetSectionName);
                }
                console.log('QuestionsByPart for this section:', questionsByPartData[targetSectionName]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length, searchParams?.get('section')]); // Use stable dependencies to prevent infinite loop

  // Reset selected keyboard type when question changes
  useEffect(() => {
    // Only run after currentQuestion is available
    const question = getCurrentQuestion();
    if (question && question.questionType === "TYPING") {
      setSelectedKeyboardType(null); // Reset to use question's default
    }
  }, [currentQuestionIndex, section, selectedPart]);

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
      
      // Always use 15 minutes for typing sections (English and Hindi) - ignore saved time
      const typingTimeMinutes = 15;
      const typingTimeToSet = typingTimeMinutes * 60; // Always 15 minutes (900 seconds)
      
      // Clear any old saved time and set fresh 15 minutes
      localStorage.removeItem(`typingTimeLeft-${section}`);
      setTypingTimeLeft(typingTimeToSet);
      localStorage.setItem(`typingTimeLeft-${section}`, typingTimeToSet.toString());
      
      const m = Math.floor(typingTimeToSet / 60);
      const s = typingTimeToSet % 60;
      console.log(`⏱️ Setting typing time to 15 minutes: ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      
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

  // Stop sound immediately when muted
  useEffect(() => {
    if (!isSoundOn && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isSoundOn]);

  // Play sound each second - for both main timer and typing timer
  useEffect(() => {
    const currentTime = isTypingSection && typingTimeLeft !== null ? typingTimeLeft : timeLeft;
    if (isSoundOn && audioRef.current && currentTime > 0) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Sound error:", err);
      });
    }
  }, [timeLeft, isSoundOn, typingTimeLeft, isTypingSection]);

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

  // Auto-scroll question navigation in mobile view when question index changes
  useEffect(() => {
    if (questionScrollContainerRef.current && currentQuestionIndex !== null && currentQuestions.length > 0) {
      const container = questionScrollContainerRef.current;
      const questionElement = container.querySelector(`[data-question-index="${currentQuestionIndex}"]`);
      
      if (questionElement) {
        // Calculate scroll position to center the current question
        const containerWidth = container.offsetWidth;
        const questionLeft = questionElement.offsetLeft;
        const questionWidth = questionElement.offsetWidth;
        const scrollLeft = questionLeft - (containerWidth / 2) + (questionWidth / 2);
        
        // Smooth scroll to the current question
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [currentQuestionIndex, currentQuestions.length, section, selectedPart]);

  // Auto-scroll section navigation in mobile view when section changes
  useEffect(() => {
    if (sectionScrollContainerRef.current && section && sections.length > 0) {
      // Use setTimeout to ensure DOM is updated after section change
      const timeoutId = setTimeout(() => {
        const container = sectionScrollContainerRef.current;
        if (!container) return;
        
        const currentSectionIndex = sections.findIndex(s => s.name === section);
        if (currentSectionIndex === -1) return;
        
        const sectionElement = container.querySelector(`[data-section-index="${currentSectionIndex}"]`);
        
        if (sectionElement) {
          // Force immediate scroll to ensure section is visible
          const containerWidth = container.clientWidth;
          const containerScrollLeft = container.scrollLeft;
          const elementLeft = sectionElement.offsetLeft;
          const elementWidth = sectionElement.offsetWidth;
          const elementRight = elementLeft + elementWidth;
          
          // Calculate if element is fully visible
          const isFullyVisible = elementLeft >= containerScrollLeft && 
                                 elementRight <= (containerScrollLeft + containerWidth);
          
          if (!isFullyVisible) {
            // Calculate scroll position to center the element
            const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
            
            // Scroll immediately
            container.scrollLeft = Math.max(0, scrollLeft);
            
            // Then smooth scroll for better UX
            setTimeout(() => {
              container.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
              });
            }, 50);
          }
        }
      }, 300); // Delay to ensure DOM is fully updated
      
      return () => clearTimeout(timeoutId);
    }
  }, [section, sections]);

  // Auto-scroll parts navigation in mobile view when part changes
  useEffect(() => {
    if (partsScrollContainerRef.current && selectedPart && currentSectionParts.length > 0) {
      // Use setTimeout to ensure DOM is updated after part change
      const timeoutId = setTimeout(() => {
        const container = partsScrollContainerRef.current;
        if (!container) return;
        
        const currentPartIndex = currentSectionParts.findIndex(p => p.name === selectedPart);
        if (currentPartIndex === -1) return;
        
        const partElement = container.querySelector(`[data-part-index="${currentPartIndex}"]`);
        
        if (partElement) {
          // Force immediate scroll to ensure part is visible
          const containerWidth = container.clientWidth;
          const containerScrollLeft = container.scrollLeft;
          const elementLeft = partElement.offsetLeft;
          const elementWidth = partElement.offsetWidth;
          const elementRight = elementLeft + elementWidth;
          
          // Calculate if element is fully visible
          const isFullyVisible = elementLeft >= containerScrollLeft && 
                                 elementRight <= (containerScrollLeft + containerWidth);
          
          if (!isFullyVisible) {
            // Calculate scroll position to center the element
            const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
            
            // Scroll immediately
            container.scrollLeft = Math.max(0, scrollLeft);
            
            // Then smooth scroll for better UX
            setTimeout(() => {
              container.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
              });
            }, 50);
          }
        }
      }, 300); // Delay to ensure DOM is fully updated
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedPart, currentSectionParts]);

  // Smart auto-scroll: Only scrolls when needed, keeps items comfortably visible
  // Scrolls down if item is in last 3 rows, scrolls up if in top 3 rows
  useEffect(() => {
    if (desktopQuestionPaletteRef.current && currentQuestionIndex !== null && currentQuestions.length > 0) {
      // Use setTimeout to ensure DOM is updated after question index change
      setTimeout(() => {
        const container = desktopQuestionPaletteRef.current;
        if (!container) return;
        
        const questionElement = container.querySelector(`[data-question-index="${currentQuestionIndex}"]`);
        
        if (!questionElement) return;
        
        // Get container and element dimensions
        const containerRect = container.getBoundingClientRect();
        const elementRect = questionElement.getBoundingClientRect();
        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const elementHeight = questionElement.offsetHeight;
        
        // Calculate element's position relative to viewport
        const elementTopRelativeToViewport = elementRect.top - containerRect.top;
        const elementBottomRelativeToViewport = elementRect.bottom - containerRect.top;
        
        // Calculate row height dynamically
        // Grid has 4 columns (grid-cols-4), so we need to estimate row height
        const firstQuestion = container.querySelector(`[data-question-index="0"]`);
        let rowHeight = elementHeight;
        if (firstQuestion) {
          // Find the 5th question (first question of row 2) to calculate row height
          const fifthQuestion = container.querySelector(`[data-question-index="4"]`);
          if (fifthQuestion) {
            rowHeight = fifthQuestion.offsetTop - firstQuestion.offsetTop;
          } else {
            // Fallback: estimate row height (question height + gap)
            const gapSize = 8; // gap-2 = 0.5rem = 8px
            rowHeight = elementHeight + gapSize;
          }
        }
        
        // Define comfort zones (top 3 rows and bottom 3 rows)
        const topComfortZone = rowHeight * 3; // Top 3 rows
        const bottomComfortZone = containerHeight - (rowHeight * 3); // Bottom 3 rows
        
        // Check if element is in comfort zone (comfortably visible)
        const isInComfortZone = elementTopRelativeToViewport >= topComfortZone && 
                                elementBottomRelativeToViewport <= bottomComfortZone;
        
        // If element is already comfortably visible, don't scroll
        if (isInComfortZone) {
          return;
        }
        
        // Determine if we need to scroll and in which direction
        let shouldScroll = false;
        let scrollOffset = 0;
        
        // Check if element is in bottom 3 rows (last 3 visible rows)
        if (elementBottomRelativeToViewport > bottomComfortZone) {
          // Element is too low - scroll down to show next 2 rows
          const rowsToReveal = 2;
          const targetScroll = containerScrollTop + (rowHeight * rowsToReveal);
          const maxScroll = container.scrollHeight - containerHeight;
          scrollOffset = Math.min(targetScroll - containerScrollTop, maxScroll - containerScrollTop);
          shouldScroll = scrollOffset > 0;
        }
        // Check if element is in top 3 rows
        else if (elementTopRelativeToViewport < topComfortZone) {
          // Element is too high - scroll up to show previous 2 rows
          const rowsToReveal = 2;
          const targetScroll = containerScrollTop - (rowHeight * rowsToReveal);
          scrollOffset = Math.max(targetScroll - containerScrollTop, -containerScrollTop);
          shouldScroll = scrollOffset < 0;
        }
        
        // Perform minimal smooth scroll if needed
        if (shouldScroll && Math.abs(scrollOffset) > 5) {
          container.scrollBy({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [currentQuestionIndex, currentQuestions.length, section, selectedPart]);

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

  // Calculate statistics for current section only - using useMemo to recalculate when data changes
  const stats = useMemo(() => {
    let totalAnswered = 0;
    let totalNotAnswered = 0;
    let totalNotVisited = 0;
    let totalMarkedForReview = 0;
    let totalAnsweredAndMarked = 0;
    let totalQuestions = 0;

    // Only calculate statistics for the current section and current part (if part is selected)
    let secQuestions = [];
    if (section) {
      // If part is selected and section has parts, use part questions
      if (selectedPart && questionsByPart[section] && questionsByPart[section][selectedPart]) {
        secQuestions = questionsByPart[section][selectedPart] || [];
      } else {
        // Otherwise, use all questions in the current section
        secQuestions = questions[section] || [];
      }
    }
    
    if (secQuestions.length > 0) {
      secQuestions.forEach(q => {
        if (!q || !q._id) return; // Skip invalid questions
        
        totalQuestions++;
        const isAnswered = selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] !== null;
        const isVisited = visitedQuestions.has(q._id);
        const isMarked = markedForReview.has(q._id);

        // Count visited vs not visited
        if (!isVisited) {
          totalNotVisited++;
        }

        // Count answered questions
        if (isAnswered) {
          totalAnswered++;
          // Check if also marked for review
          if (isMarked) {
          totalAnsweredAndMarked++;
          }
        } else {
          // Not answered - check if visited (visited but not answered)
          if (isVisited) {
            totalNotAnswered++;
          }
          // Check if marked but not answered
          if (isMarked) {
          totalMarkedForReview++;
          }
        }
      });
    }

    return {
      totalQuestions,
      totalAnswered,
      totalNotAnswered,
      totalNotVisited,
      totalMarkedForReview,
      totalAnsweredAndMarked
    };
  }, [section, selectedPart, questions, questionsByPart, selectedAnswers, visitedQuestions, markedForReview]);

  // Auto-scroll to submit button when all questions are done
  useEffect(() => {
    if (currentQuestions && currentQuestions.length > 0 && section) {
      // Check if all questions in current section are visited
      const allQuestionsVisited = currentQuestions.every(q => visitedQuestions.has(q._id));
      
      // If all questions are visited, scroll to submit button
      if (allQuestionsVisited) {
        setTimeout(() => {
          // Try to find submit button in mobile sidebar
          const mobileSubmitBtn = document.querySelector('.mobile-submit-btn');
          if (mobileSubmitBtn) {
            const sidebar = mobileSubmitBtn.closest('.lg\\:hidden');
            if (sidebar) {
              mobileSubmitBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          }
          // Try to find submit button in desktop sidebar
          const desktopSubmitBtn = document.querySelector('.desktop-submit-btn');
          if (desktopSubmitBtn) {
            desktopSubmitBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 500);
      }
    }
  }, [currentQuestions, visitedQuestions, section]);

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

    // Mark section as completed and go directly to break page (skip result page)
    // NO VALIDATION - User can submit even if not all questions are answered
    // User can submit with empty answers and still move to next section
    setTimeout(() => {
      // Ensure the section is saved before redirect
      const finalCompletedSections = new Set([...completedSections, section]);
      localStorage.setItem('completedSections', JSON.stringify([...finalCompletedSections]));

      console.log('📊 ========== SECTION SUBMISSION ==========');
      console.log('📊 Current section being submitted:', section);
      console.log('📊 Redirecting directly to break page');
      
      // Clear any section-related state from localStorage to ensure fresh load
      localStorage.removeItem('currentSection');
      
      // Find next section
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
        // Not the last section - go to break page then next section
        const nextSection = sortedSections[currentSectionIndex + 1];
        const encodedSection = encodeURIComponent(nextSection.name);
        
        // Check if next section is a typing section
        const isTypingSection = nextSection.name === "English Typing" || 
                               nextSection.name === "हिंदी टाइपिंग" ||
                               nextSection.name.includes("Typing") || 
                               nextSection.name.includes("typing");
        
        // Check if we're moving from 5th section to typing (6th section) - 10 min break
        const isAfterFiveSections = currentSectionIndex === 4; // 0-indexed, so 4 = 5th section
        const breakDuration = (isTypingSection && isAfterFiveSections) ? 10 : 1;
        
        const breakPageUrl = `/exam/break?next=${encodeURIComponent('/exam_mode')}&section=${encodedSection}&duration=${breakDuration}`;
        
        console.log('🚀 ========== REDIRECTING TO BREAK PAGE ==========');
        console.log('🚀 Next section name:', nextSection.name);
        console.log('🚀 Encoded section:', encodedSection);
        console.log('🚀 Break page URL:', breakPageUrl);
        
        if (typeof window !== 'undefined') {
          console.log('🚀 Setting window.location.href to break page:', breakPageUrl);
          window.location.href = breakPageUrl;
        } else {
          console.error('❌ window is undefined, cannot redirect!');
        }
      } else {
        // Last section - go directly to final result page (with answers)
        console.log('✅ Last section completed, going to final result page');
        localStorage.removeItem('examTimeLeft'); // Clear timer when exam is complete
        if (typeof window !== 'undefined') {
          window.location.replace('/exam/exam-result');
        }
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
              <Link href="/" className="mt-2 text-[#290c52] font-medium underline">Home</Link>
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
              
              <div className="grid grid-cols-4 gap-2 mb-4 landscape-reduce-question-grid">
                {currentQuestions && currentQuestions.length > 0 ? (
                  currentQuestions.map((q, i) => {
                      const isAnswered = selectedAnswers[q._id] !== undefined;
                      const isCurrent = i === currentQuestionIndex;
                      const isVisited = visitedQuestions.has(q._id);
                      return (
                        <div
                          key={q._id}
                          className={`w-8 h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${
                            isCurrent ? "bg-red-600 text-white" : isAnswered ? "bg-green-400" : isVisited ? "bg-red-500 text-white" : "bg-gray-300"
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
              className={`mobile-submit-btn px-12 py-3 ml-2 mt-1 text-[13px] rounded whitespace-nowrap ${
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

      <div className="flex-1 flex flex-col h-full overflow-hidden" data-exam-mode={currentQuestion?.questionType !== "TYPING" ? "mcq" : "typing"}>
        {/* Header with User Info */}
        <div className="fixed top-0 left-0 right-0 w-full bg-[#290c52] text-white flex justify-between items-center px-4 py-2 text-sm z-30 landscape-reduce-header">
          <div className="flex items-center gap-3">
            <span className="font-semibold">MPCPCT 2025</span>
            <Link href="/" className="cursor-pointer inline-flex items-center justify-center text-[12px] font-medium px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-white border border-white/40">
              Home
            </Link>
          </div>
          <div className="flex gap-2 items-center">
            {/* Sound Icon - Show in mobile and landscape mode for questions only */}
            {currentQuestion?.questionType !== "TYPING" && (
              <button 
                onClick={() => setIsSoundOn(!isSoundOn)} 
                title={isSoundOn ? "Mute" : "Unmute"}
                className="hidden md:flex lg:hidden items-center justify-center text-lg"
                style={{ order: -2, flexShrink: 0 }}
              >
                {isSoundOn ? "🔊" : "🔇"}
              </button>
            )}
            {/* Sound Icon - Show in mobile portrait, landscape mode for typing only (not desktop) */}
            {currentQuestion?.questionType === "TYPING" && (
              <button 
                onClick={() => setIsSoundOn(!isSoundOn)} 
                title={isSoundOn ? "Mute" : "Unmute"}
                className="flex md:flex lg:hidden items-center justify-center text-lg"
                style={{ order: -2, flexShrink: 0 }}
              >
                {isSoundOn ? "🔊" : "🔇"}
              </button>
            )}
            {/* Timer - Show in landscape mode for questions only, positioned before View Instructions */}
            {currentQuestion?.questionType !== "TYPING" && (
              <div className="hidden md:flex lg:hidden items-center gap-1" style={{ order: -1, flexShrink: 0 }}>
                <span className="text-[10px] font-semibold text-blue-400 whitespace-nowrap">⏱️ Time Left:</span>
                <b className="bg-blue-400 text-black px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">{formatTime(timeLeft)}</b>
              </div>
            )}
            {/* Timer for typing - show pink timer in landscape navbar */}
            {currentQuestion?.questionType === "TYPING" && (
              <div className="hidden md:flex lg:hidden items-center gap-2" style={{ order: -1 }}>
                {isTypingSection && typingTimeLeft !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-pink-300">⏱️ Section Timer:</span>
                    <b className="bg-pink-300 text-black px-2 py-1 rounded text-sm font-bold">{formatTime(typingTimeLeft)}</b>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-pink-300">⏱️ Time Left:</span>
                    <b className="bg-pink-300 text-black px-2 py-1 rounded text-sm font-bold">{formatTime(timeLeft)}</b>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 pr-4">
              <img src="/lo.jpg" className="w-8 h-8 rounded-full border" />
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

        {/* Exam Title (Mobile & Desktop) - Hidden in landscape for typing */}
        {examData && (
          <div className={`bg-white-50 border-b border-gray-300 px-2 md:px-4 py-2 md:py-4 mt-10 flex-shrink-0 landscape-reduce-title ${currentQuestion?.questionType === "TYPING" ? "landscape-hide" : ""}`}>
            <h2 className="text-sm md:text-lg lg:text-xl font-semibold text-[#290c52] text-center">
              {examData.title || 'Exam'}
            </h2>
          </div>
        )}

        {/* Section Nav (Mobile) - Horizontal tabs like desktop - Hidden in mobile for typing */}
        <div className={`lg:hidden flex flex-col border-b border-y-gray-200 bg-[#fff] sticky top-[40px] z-20 shadow-sm landscape-reduce-section-nav landscape-hide-sections ${currentQuestion?.questionType === "TYPING" ? "hidden" : ""}`}>
          <div 
            ref={sectionScrollContainerRef}
            className="flex text-xs overflow-x-auto px-2 py-2 scroll-smooth landscape-reduce-section-nav"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
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
                      data-section-index={index}
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
                      ? "bg-[#290c52] text-white border-[#290c52]"
                      : "bg-white text-[#290c52] border border-gray-300 hover:bg-gray-50"
                  } px-3 py-2 whitespace-nowrap relative border-r text-sm md:text-base font-medium min-w-[100px] flex items-center justify-center gap-1`}
                      disabled={isLocked || isCompleted}
                  title={isCompleted ? "Section completed and locked" : isLocked ? "Complete current section first" : ""}
                    >
                      <span>{sec.name}</span>
                      {isCompleted && (
                    <span className="text-xs">✓</span>
                      )}
                      {isLocked && !isCompleted && (
                    <span className="text-xs">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 landscape-hide-status-bar">
            <div className="flex items-center gap-2">
            <button onClick={() => setIsSoundOn(!isSoundOn)} title={isSoundOn ? "Mute" : "Unmute"}>
              {isSoundOn ? "🔊" : "🔇"}
            </button>
            </div>
            <div className="flex items-center gap-2">
            {isTypingSection && typingTimeLeft !== null ? (
              <div className="flex items-center gap-2 landscape-reduce-timer">
                  <span className="text-xs font-semibold text-pink-300 landscape-reduce-timer">⏱️ Section Timer:</span>
                  <b className="bg-pink-300 text-black px-2 py-1 rounded text-sm font-bold landscape-reduce-timer">{formatTime(typingTimeLeft)}</b>
              </div>
            ) : (
              <div className="flex items-center gap-2 landscape-reduce-timer">
                  <span className="text-xs font-semibold text-blue-600 landscape-reduce-timer">⏱️ Time Left:</span>
                  <b className="bg-blue-400 text-black px-2 py-1 rounded text-sm font-bold landscape-reduce-timer">{formatTime(timeLeft)}</b>
              </div>
            )}
          </div>
          </div>
          
          {/* Parts Nav (Mobile) - Show below sections if current section has parts */}
          {section && currentSectionParts.length > 0 && (
            <div 
              ref={partsScrollContainerRef}
              className="lg:hidden flex text-xs overflow-x-auto border-t border-gray-200 bg-gray-50 px-2 py-2 scroll-smooth landscape-reduce-subject-tabs landscape-hide-parts"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              <span className="px-2 py-1 font-semibold text-gray-700 whitespace-nowrap text-xs">Section:</span>
              {currentSectionParts.map((part, partIndex) => (
                <button
                  key={part._id}
                  data-part-index={partIndex}
                  onClick={() => {
                    setSelectedPart(part.name);
                    setCurrentQuestionIndex(0);
                  }}
                  className={`${
                    selectedPart === part.name
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-gray-100 border-r border-gray-300"
                  } px-3 py-1 whitespace-nowrap text-xs font-medium`}
                >
                  {part.name}
                </button>
              ))}
              {/* Keyboard Dropdown - Show only for Hindi typing, in same row as Section, positioned center-right (Desktop only) */}
              {(() => {
                const question = getCurrentQuestion();
                return question && question.questionType === "TYPING" && question.typingLanguage === "Hindi" && (
                  <div className="hidden lg:flex items-center gap-2 ml-auto mr-2">
                    <label className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold whitespace-nowrap">
                      Keyboard:
                    </label>
                    <select
                      value={selectedKeyboardType || (question.typingScriptType && (question.typingScriptType.toLowerCase().includes("inscript") || question.typingScriptType === "Inscript") ? "Inscript" : "Remington Gail")}
                      onChange={(e) => {
                        const newKeyboardType = e.target.value;
                        setSelectedKeyboardType(newKeyboardType);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] cursor-pointer"
                    >
                      <option value="Remington Gail">Remington Gail</option>
                      <option value="Inscript">Inscript</option>
                    </select>
                  </div>
                );
              })()}
            </div>
          )}
          
        </div>

        {/* Section Nav (Desktop) - Always show on desktop, never hide */}
        <div className="hidden lg:flex flex-col border-b border-y-gray-200 bg-[#fff]">
          <div className="flex text-xs overflow-x-auto pl-8 pb-2 landscape-reduce-subject-tabs landscape-hide-subject-tabs">
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
                      ? "bg-[#290c52] text-white border-[#290c52]"
                      : "bg-white text-[#290c52] border border-gray-300 hover:bg-gray-50"
                  } px-4 py-3 whitespace-nowrap relative border-r text-sm md:text-base font-medium`}
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-pink-300 landscape-reduce-timer">⏱️ Section Timer:</span>
                  <b className="bg-pink-300 text-black px-3 py-1 rounded text-lg font-bold landscape-reduce-timer">{formatTime(typingTimeLeft)}</b>
                </div>
              ) : isTypingSection && typingTimeLeft !== null ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-pink-300">⏱️ Section Timer:</span>
                  <b className="bg-pink-300 text-black px-3 py-1 rounded text-lg font-bold landscape-reduce-timer">{formatTime(typingTimeLeft)}</b>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-600 landscape-reduce-timer">⏱️ Time Left:</span>
                  <b className="bg-blue-400 text-black px-3 py-1 rounded text-lg font-bold landscape-reduce-timer">{formatTime(timeLeft)}</b>
                </div>
              )}
            </div>
          </div>
          
          {/* Parts Nav (Desktop) - Show below sections if current section has parts */}
          {section && currentSectionParts.length > 0 && (
            <div className="flex text-xs overflow-x-auto border-t border-gray-200 bg-gray-50 landscape-reduce-subject-tabs landscape-hide-parts">
              <span className="px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">Section:</span>
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
              {/* Keyboard Dropdown - Show only for Hindi typing, in same row as Section (Desktop), positioned center-right */}
              {(() => {
                const question = getCurrentQuestion();
                return question && question.questionType === "TYPING" && question.typingLanguage === "Hindi" && (
                  <div className="flex items-center gap-2 ml-auto mr-82
">
                    <label className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap">
                      Keyboard:
                    </label>
                    <select
                      value={selectedKeyboardType || (question.typingScriptType && (question.typingScriptType.toLowerCase().includes("inscript") || question.typingScriptType === "Inscript") ? "Inscript" : "Remington Gail")}
                      onChange={(e) => {
                        const newKeyboardType = e.target.value;
                        setSelectedKeyboardType(newKeyboardType);
                      }}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] cursor-pointer"
                    >
                      <option value="Remington Gail">Remington Gail</option>
                      <option value="Inscript">Inscript</option>
                    </select>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        {/* Question Navigation - Render inline on mobile (width <= 1024px), regardless of orientation */}
        {/* Mobile includes both portrait and landscape - desktop (width > 1024px) uses sidebar */}
        {isMobile && section && currentQuestions && currentQuestions.length > 0 && currentQuestion?.questionType !== "TYPING" && (
          <div 
            ref={questionScrollContainerRef}
            className="flex gap-2 h-16 md:h-20 overflow-x-auto px-2 md:px-4 py-1 md:py-2 scroll-smooth bg-white border-b border-gray-200 flex-shrink-0 landscape-reduce-question-grid flex"
            style={{ scrollBehavior: 'smooth' }}
          >
            {currentQuestions.map((q, i) => {
              const isAnswered = selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] !== null;
              const isCurrent = i === currentQuestionIndex;
              const isVisited = visitedQuestions.has(q._id);
              const isMarked = markedForReview.has(q._id);
              
              // Priority: Current > Marked for Review > Answered > Visited > Not Visited
              let bgColor = "bg-gray-300"; // Not visited
              if (isCurrent) {
                bgColor = "bg-red-600 text-white";
              } else if (isMarked) {
                bgColor = "bg-purple-600 text-white";
              } else if (isAnswered) {
                bgColor = "bg-green-400";
              } else if (isVisited) {
                bgColor = "bg-red-500 text-white";
              }
              
              return (
                <div
                  key={q._id}
                  data-question-index={i}
                  className={`min-w-[2rem] h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${bgColor}`}
                  onClick={() => setCurrentQuestionIndex(i)}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        )}



        {/* Question Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white-50 mt-0 md:mt-0 lg:overflow-auto lg:px-4 lg:pt-4 lg:pb-0">
  {/* Fixed Top Bar - Hidden for typing questions */}
  {currentQuestion?.questionType !== "TYPING" && (
    <div className="bg-[#290c52] text-white text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 rounded-t flex justify-between flex-wrap gap-2 flex-shrink-0 landscape-reduce-top-bar">
      <span>Question Type: {currentQuestion?.questionType === "TYPING" ? "TYPING" : "MCQ"}</span>
      <div className="flex items-center gap-1 md:gap-2">
        <p className="text-xs">View in:</p>
        <select 
          className="text-black text-xs bg-white px-1 md:px-2 py-1 rounded"
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
  )}

  {/* Scrollable Content */}
  <div className="border-t border-gray-300 flex-1 flex flex-col min-h-0 overflow-y-auto lg:flex-initial landscape-question-content">
    {currentQuestion?.questionType !== "TYPING" && (
      <div className="bg-white-50 px-2 md:px-4 py-2 md:py-3 border-b text-xs md:text-sm font-semibold flex flex-col sm:flex-row justify-between flex-shrink-0 landscape-reduce-question-bar">
        <span>Question No. {currentQuestionIndex + 1} {currentQuestions && `of ${currentQuestions.length}`}</span>
        <span className="mt-1 sm:mt-0 text-xs">
          Marks: <span className="text-green-600 font-semibold">{currentQuestion?.marks || 1}</span> | Negative: <span className="text-red-500">{currentQuestion?.negativeMarks || 0}</span>
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
      // Typing Section UI - New Design
      <div className="h-full flex flex-col overflow-hidden min-h-0 landscape-typing-container">
        {/* Keyboard Dropdown (Mobile and Landscape) - Show at top right for Hindi typing */}
        {currentQuestion && currentQuestion.questionType === "TYPING" && currentQuestion.typingLanguage === "Hindi" && (
          <div className="flex lg:hidden items-center justify-end gap-2 bg-gray-50 border-b border-gray-200 px-2 md:px-3 py-1 md:py-1.5 landscape-keyboard-dropdown">
            <label className="bg-blue-600 text-white px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-semibold whitespace-nowrap">
              Keyboard:
            </label>
            <select
              value={selectedKeyboardType || (currentQuestion.typingScriptType && (currentQuestion.typingScriptType.toLowerCase().includes("inscript") || currentQuestion.typingScriptType === "Inscript") ? "Inscript" : "Remington Gail")}
              onChange={(e) => {
                const newKeyboardType = e.target.value;
                setSelectedKeyboardType(newKeyboardType);
              }}
              className="border border-gray-300 rounded px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px] md:min-w-[120px] cursor-pointer"
            >
              <option value="Remington Gail">Remington Gail</option>
              <option value="Inscript">Inscript</option>
            </select>
          </div>
        )}
        <ExamTypingInterface
          content={
            currentQuestion.typingLanguage === "Hindi"
              ? (selectedKeyboardType === "Inscript" || (!selectedKeyboardType && (currentQuestion.typingScriptType === "Inscript" || (currentQuestion.typingScriptType && currentQuestion.typingScriptType.toLowerCase().includes("inscript"))))
                  ? (currentQuestion.typingContent_hindi_inscript || currentQuestion.typingContent_hindi_ramington || "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है।")
                  : (currentQuestion.typingContent_hindi_ramington || "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है।"))
              : (currentQuestion.typingContent_english || "The quick brown fox jumps over the lazy dog. Practice typing to improve your speed and accuracy. This is a sample English typing test for RSCIT exam preparation. Type carefully and focus on accuracy. Speed will come with practice. Keep your fingers on the home row and maintain proper posture while typing.")
          }
          userName={userName}
          userProfileUrl={userProfileUrl || "/lo.jpg"}
          language={currentQuestion.typingLanguage || "English"}
          scriptType={selectedKeyboardType || (currentQuestion.typingScriptType === "Inscript" || (currentQuestion.typingScriptType && currentQuestion.typingScriptType.toLowerCase().includes("inscript")) ? "Inscript" : (currentQuestion.typingScriptType === "Ramington Gail" || currentQuestion.typingScriptType === "Remington Gail" ? "Remington Gail" : (currentQuestion.typingLanguage === "Hindi" ? "Remington Gail" : null)))}
          allowBackspace={currentQuestion.typingBackspaceEnabled !== false}
          duration={15}
          timeRemaining={isTypingSection && typingTimeLeft !== null ? typingTimeLeft : timeLeft}
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
              mistakes: result.mistakes || result.errorCount || 0,
              backspaceCount: result.backspaceCount,
              wpm: result.wpm || 0,
              accuracy: result.accuracy || 100,
              netSpeed: netSpeed,
              errors: errorStrings,
              remarks: remarks,
              timeTaken: result.timeTaken || (timeInMinutes * 60),
              keystrokesCount: result.keystrokesCount || 0
            };
            
            localStorage.setItem(typingResultKey, JSON.stringify(typingResult));
            console.log(`Saved ${currentQuestion.typingLanguage} typing result to localStorage:`, typingResult);
            
            // Save typing result to selectedAnswers
            setSelectedAnswers(prev => ({
              ...prev,
              [currentQuestion._id]: {
                type: "TYPING",
                typedText: result.typedText,
                mistakes: result.mistakes || result.errorCount || 0,
                backspaceCount: result.backspaceCount,
                wpm: result.wpm || 0,
                accuracy: result.accuracy || 0,
                errors: errorStrings,
                netSpeed: netSpeed,
                remarks: remarks,
                keystrokesCount: result.keystrokesCount || 0
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
        />
      </div>
    ) : (
      <>

        {currentQuestion.passage_en || currentQuestion.passage_hi ? (
          <div className="flex flex-col lg:flex-row p-2 md:p-4 gap-x-6 gap-y-4 md:gap-y-10 landscape-reduce-padding">
            <div className="lg:w-2/3 text-xs md:text-sm border-r pr-2 md:pr-4 max-h-32 md:max-h-72 overflow-y-auto landscape-reduce-passage">
              {/* Show title if available */}
              {(currentQuestion.title_en || currentQuestion.title_hi) && (
                <h3 className="font-bold mb-2 text-purple-700">
                  {viewLanguage === "हिन्दी" && currentQuestion.title_hi 
                    ? currentQuestion.title_hi 
                    : currentQuestion.title_en || currentQuestion.title_hi}
                </h3>
              )}
              <h3 className="font-bold mb-2">Passage:</h3>
              <p className="whitespace-pre-wrap">{viewLanguage === "हिन्दी" && currentQuestion.passage_hi 
                ? currentQuestion.passage_hi 
                : currentQuestion.passage_en || currentQuestion.passage_hi}</p>
            </div>
            <div className="lg:w-1/3 text-sm md:text-xl">
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
                  <p className="mb-4 md:mb-6 text-base md:text-lg landscape-reduce-question-text">
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
              
              // Get image dimensions if set
              const imageWidth = currentQuestion?.imageWidth;
              const imageHeight = currentQuestion?.imageHeight;
              
              // Build style object for responsive image
              const imageStyle = {
                display: 'block',
                maxWidth: '100%',
                width: imageWidth ? `${Math.min(imageWidth, 800)}px` : '100%',
                height: imageHeight ? 'auto' : 'auto',
                maxHeight: imageHeight ? `${Math.min(imageHeight, 600)}px` : '70vh',
                objectFit: 'contain',
                margin: '0',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              };
              
              return (
                <div className="mb-2 md:mb-4 w-full overflow-hidden landscape-reduce-padding" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                  <img 
                    src={encodedUrl} 
                    alt="Question Image" 
                    className="rounded border shadow-md w-full max-w-full landscape-reduce-image"
                    style={imageStyle}
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
                        questionId: currentQuestion._id,
                        width: imageWidth,
                        height: imageHeight
                      });
                    }}
                  />
                </div>
              );
            })()}
              {(viewLanguage === "हिन्दी" && currentQuestion.options_hi && currentQuestion.options_hi.length > 0
                ? currentQuestion.options_hi 
                : currentQuestion.options_en || currentQuestion.options_hi || []).map((opt, i) => (
                <label key={i} className="flex items-start gap-x-3 gap-y-3 mb-4 md:mb-5 landscape-reduce-options">
                  <input 
                    type="radio" 
                    name={`q-${currentQuestion._id}`}
                    className="mt-1.5 flex-shrink-0 w-4 h-4 md:w-5 md:h-5"
                    checked={selectedAnswers[currentQuestion._id] === i}
                    onChange={() => {
                      const newAnswers = {...selectedAnswers, [currentQuestion._id]: i};
                      setSelectedAnswers(newAnswers);
                      localStorage.setItem('examAnswers', JSON.stringify(newAnswers));
                    }}
                  />
                  <span className="text-base md:text-lg leading-relaxed">{opt}</span>
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
                  <p className="mb-4 md:mb-6 text-base md:text-lg landscape-reduce-question-text">
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
              
              // Get image dimensions if set
              const imageWidth = currentQuestion?.imageWidth;
              const imageHeight = currentQuestion?.imageHeight;
              
              // Build style object for responsive image
              const imageStyle = {
                display: 'block',
                maxWidth: '100%',
                width: imageWidth ? `${Math.min(imageWidth, 800)}px` : '100%',
                height: imageHeight ? 'auto' : 'auto',
                maxHeight: imageHeight ? `${Math.min(imageHeight, 600)}px` : '70vh',
                objectFit: 'contain',
                margin: '0',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              };
              
              return (
                <div className="mb-2 md:mb-4 w-full overflow-hidden landscape-reduce-padding" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                  <img 
                    src={encodedUrl} 
                    alt="Question Image" 
                    className="rounded border shadow-md w-full max-w-full landscape-reduce-image"
                    style={imageStyle}
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
                        questionId: currentQuestion._id,
                        width: imageWidth,
                        height: imageHeight
                      });
                    }}
                  />
                </div>
              );
            })()}
            {(viewLanguage === "हिन्दी" && currentQuestion.options_hi && currentQuestion.options_hi.length > 0
              ? currentQuestion.options_hi 
              : currentQuestion.options_en || currentQuestion.options_hi || []).map((opt, i) => (
              <label key={i} className="flex items-start gap-3 mb-4 md:mb-5">
                <input 
                  type="radio" 
                  name={`q-${currentQuestion._id}`}
                  className="mt-1.5 flex-shrink-0 w-4 h-4 md:w-5 md:h-5"
                  checked={selectedAnswers[currentQuestion._id] === i}
                  onChange={() => setSelectedAnswers({...selectedAnswers, [currentQuestion._id]: i})}
                />
                <span className="text-base md:text-lg leading-relaxed">{opt}</span>
              </label>
            ))}
          </div>
        )}
      </>
    )}
  </div>
  
</div>

        {/* Footer - Hidden for typing questions */}
        {currentQuestion?.questionType !== "TYPING" && (
          <div className="bg-white-50 px-2 md:px-4 py-2 md:py-3 border-t border-gray-300 flex-shrink-0">
            {/* Mobile: 2x2 Grid Layout, but 1 row in landscape */}
            <div className="lg:hidden grid grid-cols-2 gap-2 landscape-buttons-container">
            {/* Top Left: Mark for Review & Next */}
            <button 
              className="px-2 py-2 bg-purple-600 text-white rounded text-xs whitespace-nowrap landscape-reduce-buttons"
              onClick={() => {
                // Mark current question for review
                if (currentQuestion && currentQuestion._id) {
                  setMarkedForReview(prev => new Set([...prev, currentQuestion._id]));
                }
                
                // Check if we're on last question of last part of current section
                if (isLastQuestionInPart() && isLastPartInSection()) {
                  handleSubmitSection();
                } else if (isLastQuestionInPart()) {
                  const nextPart = getNextPart();
                  if (nextPart) {
                    setSelectedPart(nextPart.name);
                    setCurrentQuestionIndex(0);
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
                  if (currentQuestion && currentQuestions && currentQuestionIndex < currentQuestions.length - 1) {
                    const nextIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextIndex);
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
            {/* Top Right: Clear Response */}
            <button 
              className="px-2 py-2 bg-orange-500 text-white rounded text-xs whitespace-nowrap landscape-reduce-buttons"
              onClick={() => {
                if (currentQuestion) {
                  const newAnswers = {...selectedAnswers};
                  delete newAnswers[currentQuestion._id];
                  setSelectedAnswers(newAnswers);
                }
              }}
            >
              Clear Response
            </button>
            {/* Bottom Left: Previous - Hidden for typing questions */}
            {currentQuestion?.questionType !== "TYPING" && (
              <button 
                className="bg-blue-900 hover:bg-blue-700 text-white px-2 py-2 text-xs rounded whitespace-nowrap disabled:opacity-50 landscape-reduce-buttons"
                disabled={currentQuestionIndex === 0 && section === sections[0]?.name}
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                  } else if (sections.length > 0) {
                    const currentSectionIndex = sections.findIndex(s => s.name === section);
                    if (currentSectionIndex > 0) {
                      const prevSection = sections[currentSectionIndex - 1];
                      setSection(prevSection.name);
                      const prevIndex = (questions[prevSection.name]?.length || 1) - 1;
                      setCurrentQuestionIndex(prevIndex);
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
            )}
            {/* Bottom Right: Save & Next */}
            <button 
              className={`bg-green-600 hover:bg-cyan-700 text-white px-2 py-2 text-xs rounded whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed landscape-reduce-buttons ${isLastQuestion() ? 'bg-green-600' : ''}`}
              disabled={currentQuestion && currentQuestion.questionType !== "TYPING" && (selectedAnswers[currentQuestion._id] === undefined || selectedAnswers[currentQuestion._id] === null)}
              onClick={() => {
                // Check if answer is selected (skip check for TYPING questions)
                if (currentQuestion && currentQuestion.questionType !== "TYPING") {
                  const hasAnswer = selectedAnswers[currentQuestion._id] !== undefined && selectedAnswers[currentQuestion._id] !== null;
                  if (!hasAnswer) {
                    alert('Please select an option before proceeding.');
                    return;
                  }
                }
                
                if (currentQuestion) {
                  console.log('Save & Submit clicked - Current question:', currentQuestion._id);
                }
                
                const isLastInSection = isLastQuestionInPart() && isLastPartInSection();
                const isLastOverall = isLastQuestion();
                
                if (isLastOverall || isLastInSection) {
                  console.log('Submitting section:', section);
                  handleSubmitSection();
                } else if (isLastQuestionInPart()) {
                  const nextPart = getNextPart();
                  if (nextPart) {
                    console.log('Moving to next part:', nextPart.name);
                    setSelectedPart(nextPart.name);
                    setCurrentQuestionIndex(0);
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
                  if (currentQuestion && currentQuestions && currentQuestionIndex < currentQuestions.length - 1) {
                    const nextIndex = currentQuestionIndex + 1;
                    console.log('Moving to next question:', nextIndex);
                    setCurrentQuestionIndex(nextIndex);
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
          
          {/* Desktop: Horizontal Layout */}
          <div className="hidden lg:flex justify-between items-center gap-2">
            <div className="space-x-2">
          <button 
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm whitespace-nowrap"
                onClick={() => {
                  if (currentQuestion && currentQuestion._id) {
                    setMarkedForReview(prev => new Set([...prev, currentQuestion._id]));
                  }
                  
                  if (isLastQuestionInPart() && isLastPartInSection()) {
                    handleSubmitSection();
                  } else if (isLastQuestionInPart()) {
                    const nextPart = getNextPart();
                    if (nextPart) {
                      setSelectedPart(nextPart.name);
                      setCurrentQuestionIndex(0);
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
                    if (currentQuestion && currentQuestions && currentQuestionIndex < currentQuestions.length - 1) {
                      const nextIndex = currentQuestionIndex + 1;
                      setCurrentQuestionIndex(nextIndex);
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
            <div className="space-x-2">
              {/* Previous button - Hidden for typing questions */}
              {currentQuestion?.questionType !== "TYPING" && (
                <button 
                  className="bg-blue-900 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded whitespace-nowrap disabled:opacity-50"
                  disabled={currentQuestionIndex === 0 && section === sections[0]?.name}
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(currentQuestionIndex - 1);
                    } else if (sections.length > 0) {
                      const currentSectionIndex = sections.findIndex(s => s.name === section);
                      if (currentSectionIndex > 0) {
                        const prevSection = sections[currentSectionIndex - 1];
                        setSection(prevSection.name);
                        const prevIndex = (questions[prevSection.name]?.length || 1) - 1;
                        setCurrentQuestionIndex(prevIndex);
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
              )}
              <button 
                className={`bg-green-600 hover:bg-cyan-700 text-white px-6 py-2 text-sm rounded whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${isLastQuestion() ? 'bg-green-600' : ''}`}
                disabled={currentQuestion && currentQuestion.questionType !== "TYPING" && (selectedAnswers[currentQuestion._id] === undefined || selectedAnswers[currentQuestion._id] === null)}
                onClick={() => {
                  // Check if answer is selected (skip check for TYPING questions)
                  if (currentQuestion && currentQuestion.questionType !== "TYPING") {
                    const hasAnswer = selectedAnswers[currentQuestion._id] !== undefined && selectedAnswers[currentQuestion._id] !== null;
                    if (!hasAnswer) {
                      alert('Please select an option before proceeding.');
                      return;
                    }
                  }
                  
                  if (currentQuestion) {
                    console.log('Save & Submit clicked - Current question:', currentQuestion._id);
                  }
                  
                  const isLastInSection = isLastQuestionInPart() && isLastPartInSection();
                  const isLastOverall = isLastQuestion();
                  
                  if (isLastOverall || isLastInSection) {
                    console.log('Submitting section:', section);
                    handleSubmitSection();
                  } else if (isLastQuestionInPart()) {
                    const nextPart = getNextPart();
                    if (nextPart) {
                      console.log('Moving to next part:', nextPart.name);
                      setSelectedPart(nextPart.name);
                      setCurrentQuestionIndex(0);
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
                    if (currentQuestion && currentQuestions && currentQuestionIndex < currentQuestions.length - 1) {
                      const nextIndex = currentQuestionIndex + 1;
                      console.log('Moving to next question:', nextIndex);
                      setCurrentQuestionIndex(nextIndex);
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
          </div>
        </div>
        )}
      </div>

      {/* Sidebar - Desktop - Hidden for typing questions */}
      {currentQuestion?.questionType !== "TYPING" && (
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
              <div ref={desktopQuestionPaletteRef} className="grid grid-cols-4 gap-2 mb-4 max-h-[400px] overflow-y-auto">
                {currentQuestions && currentQuestions.length > 0 ? (
                  currentQuestions.map((q, i) => {
                    const isAnswered = selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] !== null;
                    const isCurrent = i === currentQuestionIndex;
                    const isVisited = visitedQuestions.has(q._id);
                    const isMarked = markedForReview.has(q._id);
                    
                    // Priority: Current > Marked for Review > Answered > Visited > Not Visited
                    let bgColor = "bg-gray-300"; // Not visited
                    if (isCurrent) {
                      bgColor = "bg-red-600 text-white";
                    } else if (isMarked) {
                      bgColor = "bg-purple-600 text-white";
                    } else if (isAnswered) {
                      bgColor = "bg-green-400";
                    } else if (isVisited) {
                      bgColor = "bg-red-500 text-white";
                    }
                    
                      return (
                        <div
                          key={q._id}
                        data-question-index={i}
                        className={`w-8 h-8 flex items-center justify-center text-black text-sm font-semibold border border-black cursor-pointer ${bgColor}`}
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
            className="desktop-submit-btn bg-green-800 hover:bg-cyan-700 text-white px-12 py-2 ml-2 mt-[-4] text-[13px] rounded whitespace-nowrap"
          >
            Submit Section
          </button>
        </div>
        </div>
      )}

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
                    <h2 className="font-bold mt-6 text-base md:text-lg">अनुभागों के माध्यम से नेविगेट करना:</h2>
                    <p className="text-[12px] mt-4">5. स्क्रीन के शीर्ष बार पर इस प्रश्न पत्र के अनुभाग देखें। किसी अनुभाग के प्रश्न देखने के लिए उसके नाम पर क्लिक करें। आप जिस अनुभाग में हैं, वह हाइलाइट होगा।<br/>
                    6. जब आप किसी अनुभाग के अंतिम प्रश्न पर "सहेजें और अगला" क्लिक करते हैं, तो आप अपने आप अगले अनुभाग के पहले प्रश्न पर चले जाएंगे।<br/>
                    7. परीक्षा के समय में, आप अपनी इच्छानुसार अनुभागों और प्रश्नों के बीच घूम सकते हैं।</p>
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
                    <h2 className="font-bold mt-6 text-base md:text-lg">Navigating Through Sections:</h2>
                    <p className="text-[12px] mt-4">5. See the sections of this question paper on the top bar of the screen. Click on the name of a section to view its questions. The section you are in will be highlighted.<br/>
                    6. When you click "Save & Next" on the last question of a section, you will automatically move to the first question of the next section.<br/>
                    7. During the exam time, you can navigate between sections and questions as you wish.</p>
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
              {Object.keys(questions).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No questions available</p>
              ) : (
                Object.entries(questions).map(([sectionName, sectionQuestions]) => (
                  <div key={sectionName} className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-4 bg-blue-50 px-4 py-2 rounded">
                      {sectionName}
                    </h3>
                    <div className="space-y-4">
                      {sectionQuestions.map((q, index) => {
                        const questionText = modalLanguage === "हिन्दी" && q.question_hi 
                          ? q.question_hi 
                          : q.question_en || q.question_hi || '[Image Question]';
                        const displayText = questionText.replace(/\s*\(Question\s+\d+\)/gi, '').trim();
                        
                        return (
                          <div key={q._id || index} className="border-b border-gray-200 pb-4">
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
                                    ? `प्रश्न प्रकार: ${q.questionType === "TYPING" ? "TYPING" : "MCQ"} ; सही उत्तर के अंक: ${q.marks || 1} ; निगेटिव अंक: ${q.negativeMarks || 0}`
                                    : `Question Type: ${q.questionType === "TYPING" ? "TYPING" : "MCQ"} ; Marks for correct answer: ${q.marks || 1} ; Negative marks: ${q.negativeMarks || 0}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
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