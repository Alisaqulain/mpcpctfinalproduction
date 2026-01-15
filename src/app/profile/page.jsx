"use client";
import React, { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching profile data...");
      
      const response = await fetch("/api/profile", { 
        cache: 'no-store',
        credentials: 'include'
      });
      console.log("Profile response status:", response.status);
      
      const data = await response.json();
      console.log("Profile response data:", data);
      console.log("Subscription data:", data.subscription);
      
      if (response.ok && data.user) {
        setUser(data.user);
        setSubscription(data.subscription || null);
          
        // Fetch user's exam results - try multiple userIds to get all results
        const userDataStr = localStorage.getItem('examUserData');
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        
        // Try different userIds to get all results
        const userIds = [
          userData.mobile,
          data.user.email,
          data.user.phoneNumber,
          data.user.mobile
        ].filter(Boolean);
        
        // Fetch results for all possible userIds
        const allResults = [];
        for (const userId of userIds) {
          try {
            const resultsResponse = await fetch(`/api/results?userId=${userId}`);
            if (resultsResponse.ok) {
              const resultsData = await resultsResponse.json();
              if (resultsData.success && resultsData.results) {
                allResults.push(...resultsData.results);
              }
            }
          } catch (err) {
            console.error(`Error fetching results for userId ${userId}:`, err);
          }
        }
        
        // Remove duplicates based on _id
        const uniqueResults = allResults.filter((result, index, self) =>
          index === self.findIndex((r) => r._id === result._id)
        );
        
        // Sort by submittedAt (most recent first)
        uniqueResults.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        setResults(uniqueResults);
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleDownloadPDF = async (result) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('MPCPCT 2025', pageWidth / 2, 12, { align: 'center' });
    
    // User Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    let yPos = 30;
    pdf.text(`Name: ${result.userName}`, 10, yPos);
    yPos += 10;
    pdf.text(`Exam: ${result.examTitle}`, 10, yPos);
    yPos += 10;
    pdf.text(`Date: ${new Date(result.submittedAt).toLocaleDateString()}`, 10, yPos);
    yPos += 15;
    
    // Section Statistics Table
    pdf.setFontSize(12);
    pdf.text('Exam Summary', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Table headers
    const headers = ['Section', 'Total', 'Answered', 'Correct', 'Score'];
    const colWidths = [80, 25, 30, 30, 30];
    let xPos = 10;
    
    pdf.setFontSize(10);
    headers.forEach((header, i) => {
      pdf.rect(xPos, yPos, colWidths[i], 8);
      pdf.text(header, xPos + colWidths[i] / 2, yPos + 5, { align: 'center' });
      xPos += colWidths[i];
    });
    yPos += 8;
    
    // Table rows
    (result.sectionStats || []).forEach(stat => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      xPos = 10;
      const rowData = [
        stat.sectionName.substring(0, 25),
        stat.totalQuestions.toString(),
        stat.answered.toString(),
        stat.correct.toString(),
        stat.score.toString()
      ];
      rowData.forEach((data, i) => {
        pdf.rect(xPos, yPos, colWidths[i], 8);
        pdf.text(data, xPos + colWidths[i] / 2, yPos + 5, { align: 'center' });
        xPos += colWidths[i];
      });
      yPos += 8;
    });
    
    // Total
    yPos += 5;
    pdf.setFontSize(12);
    pdf.text(`Total Score: ${result.totalScore} / ${result.totalQuestions}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    pdf.text(`Percentage: ${result.percentage}%`, pageWidth / 2, yPos, { align: 'center' });
    
    // Save PDF
    const fileName = `exam-result-${result.userName}-${result.examTitle}-${Date.now()}.pdf`;
    pdf.save(fileName);
    
    // Mark PDF as downloaded in database
    if (result._id) {
      try {
        const response = await fetch('/api/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultId: result._id })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update local state
          setResults(prevResults => 
            prevResults.map(r => 
              r._id === result._id 
                ? { ...r, pdfDownloaded: true, pdfDownloadedAt: new Date() }
                : r
            )
          );
        }
      } catch (error) {
        console.error('Error marking PDF as downloaded:', error);
        // Don't show error to user - PDF download succeeded
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <a 
              href="/login" 
              className="block w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Go to Login
            </a>
            <a 
              href="/signup" 
              className="block w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md text-center">
          <div className="text-gray-500 text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <a 
            href="/login" 
            className="block w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-8 mb-6">
          <div className="group">
            <img
              src={user.profileUrl || "/user.jpg"}
              alt="User"
              className="w-28 h-28 rounded-full mx-auto border-4 border-purple-500 shadow-lg transform transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/user.jpg";
              }}
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 mt-4 text-center">{user.name}</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">MPCPCT Student</p>

          <div className="mt-6 text-left space-y-4">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Mobile" value={user.phoneNumber} />
            <InfoRow label="City" value={user.city} />
            <InfoRow label="State" value={user.states} />
          </div>
        </div>

        {/* Membership/Subscription Section */}
        <div className="bg-white shadow-2xl rounded-3xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Membership Details</h2>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors"
              title="Refresh subscription status"
            >
              🔄 Refresh
            </button>
          </div>
          
          {subscription ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-green-800">Status:</span>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <InfoRow label="Plan Type" value={subscription.type === "all" ? "Complete Subscription (All Content)" : subscription.type} />
                  <InfoRow label="Plan Duration" value={subscription.plan || "N/A"} />
                  <InfoRow label="Start Date" value={new Date(subscription.startDate).toLocaleDateString()} />
                  <InfoRow label="End Date" value={new Date(subscription.endDate).toLocaleDateString()} />
                  <InfoRow label="Amount Paid" value={`₹${subscription.price || 0}`} />
                </div>
                {new Date(subscription.endDate) < new Date() ? (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-semibold">⚠️ Subscription Expired</p>
                    <a href="/payment-app" className="text-red-600 hover:underline text-sm mt-1 inline-block">
                      Renew Subscription
                    </a>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        Your subscription is active and you have full access to all content.
                      </p>
                    </div>
                    <a
                      href="/shared-membership"
                      className="block w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-center font-semibold transition-colors"
                    >
                      🎁 Share Membership (Get +1 Month Reward)
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-semibold mb-2">No Active Subscription</p>
              <p className="text-yellow-700 text-sm mb-4">Purchase a subscription to unlock all content</p>
              <a 
                href="/payment-app" 
                className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Get Subscription
              </a>
            </div>
          )}
        </div>

        {/* Referral Section */}
        <div className="bg-white shadow-2xl rounded-3xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Referral Program</h2>
          
          {user.referralCode ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Your Referral Code</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={user.referralCode}
                      className="flex-1 px-4 py-2 bg-white border border-purple-300 rounded-lg font-mono font-bold text-lg text-purple-700"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user.referralCode);
                        alert('Referral code copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Your Referral Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/signup?ref=${user.referralCode}`}
                      className="flex-1 px-4 py-2 bg-white border border-purple-300 rounded-lg text-sm text-purple-700"
                    />
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/signup?ref=${user.referralCode}`;
                        navigator.clipboard.writeText(link);
                        alert('Referral link copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">How it works:</span> Share your referral code or link with friends. 
                    When they sign up and purchase a subscription using your code, they get 
                    <span className="font-bold text-purple-600"> 1 month free</span>! 
                    If you have a paid course and 3 people purchase using your referral, you'll also get 
                    <span className="font-bold text-purple-600"> 1 month free</span>!
                  </p>
                </div>

                {user.referralRewards > 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Total Referrals:</span> {user.referralRewards} 
                      {user.referralRewards === 1 ? ' person' : ' people'} have used your referral code!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600">Referral code will be generated after account setup.</p>
            </div>
          )}
        </div>

        {/* Exam Results Section */}
        <div className="bg-white shadow-2xl rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Exam Results</h2>
          
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No exam results found.</p>
              <a href="/exam" className="text-purple-600 hover:underline mt-2 inline-block">
                Take an Exam
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={result._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">{result.examTitle}</h3>
                        {result.pdfDownloaded && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <span>✓</span>
                            <span>Downloaded</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(result.submittedAt).toLocaleDateString()} at {new Date(result.submittedAt).toLocaleTimeString()}
                      </p>
                      {result.pdfDownloaded && result.pdfDownloadedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          PDF Downloaded: {new Date(result.pdfDownloadedAt).toLocaleDateString()} at {new Date(result.pdfDownloadedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={() => handleDownloadPDF(result)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          result.pdfDownloaded
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {result.pdfDownloaded ? 'Download Again' : 'Download PDF'}
                      </button>
                      {!result.pdfDownloaded && (
                        <span className="text-xs text-gray-500">Not downloaded yet</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total Questions</p>
                      <p className="text-lg font-semibold">{result.totalQuestions}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Answered</p>
                      <p className="text-lg font-semibold">{result.totalAnswered}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Correct</p>
                      <p className="text-lg font-semibold text-green-600">{result.totalCorrect}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Score</p>
                      <p className="text-lg font-semibold text-purple-600">{result.totalScore} / {result.totalQuestions}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-center text-xl font-bold">
                      Percentage: <span className="text-purple-600">{result.percentage}%</span>
                    </p>
                  </div>
                  
                  {/* Section-wise breakdown */}
                  {result.sectionStats && result.sectionStats.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Section</th>
                            <th className="border p-2">Total</th>
                            <th className="border p-2">Answered</th>
                            <th className="border p-2">Correct</th>
                            <th className="border p-2">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.sectionStats.map((stat, idx) => (
                            <tr key={idx}>
                              <td className="border p-2">{stat.sectionName}</td>
                              <td className="border p-2 text-center">{stat.totalQuestions}</td>
                              <td className="border p-2 text-center">{stat.answered}</td>
                              <td className="border p-2 text-center text-green-600">{stat.correct}</td>
                              <td className="border p-2 text-center">{stat.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
      <span className="font-semibold text-gray-600">{label}:</span>
      <span className="text-gray-800">{value || "Not provided"}</span>
    </div>
  );
}
