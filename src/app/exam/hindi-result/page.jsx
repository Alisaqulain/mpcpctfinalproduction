"use client";
import React, { useState, useEffect } from "react";
import { getExamInfo, getExamSections } from "@/lib/examQuestions";

export default function ExamSummary() {
  const [examData, setExamData] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [examInfo, setExamInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Retrieve exam login data from localStorage
    const storedData = localStorage.getItem('examLoginData');
    if (storedData) {
      try {
        setExamData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing exam data:', error);
      }
    }

    // Retrieve exam results from localStorage
    const storedResults = localStorage.getItem('examResults');
    if (storedResults) {
      try {
        setExamResults(JSON.parse(storedResults));
      } catch (error) {
        console.error('Error parsing exam results:', error);
      }
    }

    // Get exam info
    setExamInfo(getExamInfo());
  }, []);

  if (!examResults) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">No Exam Results Found</h1>
          <p className="text-gray-500">Please complete an exam to see results.</p>
          <a href="/exam_mode" className="text-blue-600 hover:underline mt-2 inline-block">
            Go to Exam
          </a>
        </div>
      </div>
    );
  }

  const { score, stats, timeTaken, submittedAt } = examResults;
  const sections = getExamSections();

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const html = document.getElementById('exam-summary-root');
      if (!html) return;
      const serialized = new XMLSerializer().serializeToString(html);
      const blob = new Blob([serialized], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      localStorage.setItem('lastResultHtmlUrl', url);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-sm" id="exam-summary-root">
      {/* Header */}
      <div className="bg-[#290c52] text-yellow-400 p-2 text-lg font-bold">
        CPCTMASTER 2025 - Exam Results
      </div>

      {/* Title */}
      <div className="text-center font-semibold py-4 text-gray-800 text-base border-b border-gray-300">
        <img
          src="/lo.jpg"
          alt="avatar"
          className="w-20 h-20 rounded-full mx-auto"
        />
        <p className="mt-2">{examData?.name || "Anas"}</p>
        {examData && (
          <div className="text-xs text-gray-600 mt-1">
            <p>{examData.mobile}</p>
            <p>{examData.city}</p>
          </div>
        )}
      </div>

      {/* Overall Score */}
      <div className="px-4 py-6">
        <h1 className="text-center text-3xl font-bold my-6 text-gray-800">Exam Summary</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h3 className="font-bold text-lg text-blue-800">Total Score</h3>
            <p className="text-3xl font-bold text-blue-600">{score.percentage}%</p>
            <p className="text-sm text-gray-600">{score.correct}/{score.total} Correct</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <h3 className="font-bold text-lg text-green-800">Time Taken</h3>
            <p className="text-3xl font-bold text-green-600">
              {Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-600">Minutes</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <h3 className="font-bold text-lg text-purple-800">Submitted</h3>
            <p className="text-lg font-bold text-purple-600">
              {new Date(submittedAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(submittedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Section-wise Results */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Section-wise Performance</h2>
          
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full text-center border text-sm">
              <thead className="bg-blue-100">
                <tr className="border-b">
                  <th className="border p-3">Section Name</th>
                  <th className="border p-3">Total Questions</th>
                  <th className="border p-3">Answered</th>
                  <th className="border p-3">Correct</th>
                  <th className="border p-3">Accuracy</th>
                  <th className="border p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sectionName) => {
                  const sectionStats = stats[sectionName];
                  if (!sectionStats) return null;
                  
                  return (
                    <tr key={sectionName} className="border-b hover:bg-gray-50">
                      <td className="border p-3 text-left font-medium">{sectionName}</td>
                      <td className="border p-3">{sectionStats.total}</td>
                      <td className="border p-3">{sectionStats.answered}</td>
                      <td className="border p-3 text-green-600 font-semibold">{sectionStats.correct}</td>
                      <td className="border p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sectionStats.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          sectionStats.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sectionStats.percentage}%
                        </span>
                      </td>
                      <td className="border p-3 font-semibold">{sectionStats.correct}/{sectionStats.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Performance Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800">Strengths</h3>
              <ul className="space-y-2">
                {sections.map((sectionName) => {
                  const sectionStats = stats[sectionName];
                  if (!sectionStats || sectionStats.percentage < 70) return null;
                  
                  return (
                    <li key={sectionName} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="font-medium">{sectionName}</span>
                      <span className="text-sm text-gray-600">({sectionStats.percentage}%)</span>
                    </li>
                  );
                })}
                {!sections.some(section => stats[section]?.percentage >= 70) && (
                  <li className="text-gray-500 italic">No sections with 70%+ accuracy</li>
                )}
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800">Areas for Improvement</h3>
              <ul className="space-y-2">
                {sections.map((sectionName) => {
                  const sectionStats = stats[sectionName];
                  if (!sectionStats || sectionStats.percentage >= 60) return null;
                  
                  return (
                    <li key={sectionName} className="flex items-center gap-2">
                      <span className="text-red-600">⚠</span>
                      <span className="font-medium">{sectionName}</span>
                      <span className="text-sm text-gray-600">({sectionStats.percentage}%)</span>
                    </li>
                  );
                })}
                {!sections.some(section => stats[section]?.percentage < 60) && (
                  <li className="text-green-600 italic">All sections performing well!</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Recommendations</h2>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="space-y-2 text-sm">
              {score.percentage >= 80 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">🎉</span>
                  <span>Excellent performance! You have a strong understanding of the subject matter.</span>
                </li>
              )}
              {score.percentage >= 60 && score.percentage < 80 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">📚</span>
                  <span>Good performance! Focus on weaker areas to improve your score further.</span>
                </li>
              )}
              {score.percentage < 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">📖</span>
                  <span>Keep practicing! Review the concepts and take more practice tests.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">⏰</span>
                <span>Time management: You used {Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')} out of {examInfo?.totalTime || 75} minutes.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center p-4 border-t">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
            <a href="/exam_mode">Take Another Test</a>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold">
            <a href="/result/topic">View Detailed Analysis</a>
          </button>
          <button onClick={handleDownloadPdf} disabled={downloading} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-semibold">
            Download PDF
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold">
            <a href="/">Back to Home</a>
          </button>
        </div>
      </div>
    </div>
  );
}
