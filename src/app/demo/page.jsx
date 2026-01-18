"use client";

import { useEffect, useState } from "react";

export default function DemoPage() {
  const [serverTime, setServerTime] = useState(null);
  const [dbStatus, setDbStatus] = useState("checking");
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    // Set client time
    setServerTime(new Date().toLocaleString());

    // Check database connection
    fetch("/api/demo/status", {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDbStatus("connected");
          setApiStatus("working");
          if (data.serverTime) {
            setServerTime(data.serverTime);
          }
        } else {
          setDbStatus("error");
          setApiStatus("error");
        }
      })
      .catch((err) => {
        console.error("Status check error:", err);
        setDbStatus("error");
        setApiStatus("error");
      });
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
      case "working":
        return "text-green-600 bg-green-50 border-green-200";
      case "checking":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
      case "working":
        return "✅";
      case "checking":
        return "⏳";
      case "error":
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚀 Deployment Status
          </h1>
          <p className="text-gray-600">
            Check if your application is deployed and running correctly
          </p>
        </div>

        <div className="space-y-4">
          {/* Server Status */}
          <div
            className={`p-6 rounded-lg border-2 ${getStatusColor(
              apiStatus
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(apiStatus)}</span>
                <div>
                  <h3 className="font-semibold text-lg">API Server</h3>
                  <p className="text-sm opacity-75">
                    Next.js API Routes Status
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm">
                {apiStatus === "working"
                  ? "ONLINE"
                  : apiStatus === "checking"
                  ? "CHECKING..."
                  : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* Database Status */}
          <div
            className={`p-6 rounded-lg border-2 ${getStatusColor(dbStatus)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(dbStatus)}</span>
                <div>
                  <h3 className="font-semibold text-lg">Database</h3>
                  <p className="text-sm opacity-75">MongoDB Connection</p>
                </div>
              </div>
              <span className="font-mono text-sm">
                {dbStatus === "connected"
                  ? "CONNECTED"
                  : dbStatus === "checking"
                  ? "CHECKING..."
                  : "DISCONNECTED"}
              </span>
            </div>
          </div>

          {/* Server Time */}
          <div className="p-6 rounded-lg border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <h3 className="font-semibold text-lg">Server Time</h3>
                  <p className="text-sm opacity-75">Current server timestamp</p>
                </div>
              </div>
              <span className="font-mono text-sm">
                {serverTime || "Loading..."}
              </span>
            </div>
          </div>

          {/* Environment Info */}
          <div className="p-6 rounded-lg border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <h3 className="font-semibold text-lg">Environment</h3>
                  <p className="text-sm opacity-75">Deployment environment</p>
                </div>
              </div>
              <span className="font-mono text-sm">
                {process.env.NODE_ENV?.toUpperCase() || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">
            {dbStatus === "connected" && apiStatus === "working"
              ? "✅ All Systems Operational"
              : dbStatus === "checking" || apiStatus === "checking"
              ? "⏳ Checking Status..."
              : "⚠️ Some Issues Detected"}
          </h2>
          <p className="opacity-90">
            {dbStatus === "connected" && apiStatus === "working"
              ? "Your application is deployed and running correctly!"
              : "Please check the status indicators above."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Deployment Status Check • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

















