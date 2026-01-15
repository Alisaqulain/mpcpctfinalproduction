"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function NotesPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "pdf_notes";
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, [type]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from Download model for membership-based notes (all types)
      const fileType = type === "syllabus_pdf" ? "syllabus_pdf" : type === "video_notes" ? "video_notes" : "pdf_notes";
      const res = await fetch(`/api/downloads?type=${fileType}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data.downloads || []);
        // Store membership status for display
        if (!data.hasMembership && data.downloads?.length === 0) {
          setError("Membership required to access this content. Please subscribe to view notes.");
        }
      } else if (res.status === 401) {
        setError("Please login to view notes");
      } else {
        setError("Failed to load notes");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "video_notes":
        return "Video Notes";
      case "pdf_notes":
        return "PDF Notes";
      case "syllabus_pdf":
        return "Syllabus PDF";
      default:
        return "Important Notes";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#fff] px-4 py-10">
      <div className="w-full max-w-4xl border border-gray-300 px-4 sm:px-6 md:px-10 lg:px-15 pt-10 sm:pt-14 md:pt-20 rounded-2xl">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-6 text-[#290c52]">
          {getTitle()}
        </h1>

        {/* All Notes Types - PDF, Syllabus PDF, and Video Notes */}
        {(
          <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading files...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8">
                  <p className="text-gray-600 mb-4">
                    {error || `No ${getTitle().toLowerCase()} available yet.`}
                  </p>
                  {error && error.includes("Membership required") && (
                    <a
                      href="/payment-app"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold mt-4"
                    >
                      Subscribe Now
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#290c52] hover:text-white transition-colors duration-300"
                  >
                    {/* File Info */}
                    <div className="flex-1 pl-2 sm:pl-4">
                      <div className="text-md font-medium mb-1">{file.title}</div>
                      {file.title_hi && (
                        <div className="text-sm opacity-80 mb-1">{file.title_hi}</div>
                      )}
                      {file.description && (
                        <div className="text-sm opacity-80 mb-2">{file.description}</div>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs opacity-70 mt-1">
                        {file.fileSize && <span>{file.fileSize}</span>}
                        {file.duration && <span>Duration: {file.duration}</span>}
                        {file.isFree && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">FREE</span>
                        )}
                        {!file.isFree && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">MEMBERS ONLY</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {type === "video_notes" ? (
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-pink-300 hover:bg-yellow-500 text-black px-6 py-3 text-sm font-semibold rounded-md shadow-md transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        Watch on Google Drive
                      </a>
                    ) : (
                    <a
                      href={`/api/downloads/file?file=${encodeURIComponent(file.fileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-pink-300 hover:bg-yellow-500 text-black px-6 py-3 text-sm font-semibold rounded-md shadow-md transition-colors"
                    >
                      Download
                    </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}
