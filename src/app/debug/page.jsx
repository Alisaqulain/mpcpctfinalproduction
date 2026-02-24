"use client";
import React, { useEffect, useState } from "react";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const response = await fetch("/api/debug");
        const data = await response.json();
        setDebugInfo(data);
      } catch (error) {
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Info</h1>
      
      <div className="bg-white shadow-lg rounded-lg p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        
        <div className="space-y-2">
          <a 
            href="/login" 
            className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </a>
          
          <a 
            href="/profile" 
            className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Go to Profile
          </a>
          
          <button 
            onClick={() => window.location.reload()} 
            className="block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
