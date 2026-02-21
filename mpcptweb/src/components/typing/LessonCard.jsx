"use client";
import React from "react";

export default function LessonCard({ lesson, isFree, userIsPremium, onClick }) {
  const canAccess = isFree || userIsPremium;
  
  return (
    <div
      onClick={canAccess ? onClick : undefined}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        canAccess
          ? "hover:shadow-lg hover:border-[#290c52] border-gray-300"
          : "opacity-75 border-gray-200 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg text-gray-800">{lesson.title}</h3>
        {!isFree && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            Premium
          </span>
        )}
        {isFree && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            Free
          </span>
        )}
      </div>
      
      {lesson.description && (
        <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
      )}
      
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{lesson.language}</span>
        {lesson.language === "Hindi" && lesson.scriptType && (
          <>
            <span>•</span>
            <span>{lesson.scriptType}</span>
          </>
        )}
        {lesson.rowType && (
          <>
            <span>•</span>
            <span className="capitalize">{lesson.rowType} Row</span>
          </>
        )}
        {lesson.duration && (
          <>
            <span>•</span>
            <span>{lesson.duration} min</span>
          </>
        )}
        {lesson.contentType && (
          <>
            <span>•</span>
            <span className="capitalize">{lesson.contentType}</span>
          </>
        )}
      </div>
      
      {!canAccess && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            Premium required
          </p>
        </div>
      )}
    </div>
  );
}






