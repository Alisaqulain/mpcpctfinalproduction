import React from "react";

export default function ExamSummary() {
  return (
    <div className="min-h-screen bg-white text-sm">
      {/* Header */}
      <div className="bg-[#290c52] text-yellow-400 p-2 text-lg font-bold text-center">
        CPCTMASTER 2025
      </div>

      {/* Title */}
      <div className="text-center font-semibold py-4 text-gray-800 text-base border-b">
        <img
          src="/lo.jpg"
          alt="avatar"
          className="w-20 h-20 rounded-full mx-auto"
        />
        <p className="mt-2">Anas</p>
      </div>

      {/* English Typing Summary */}
      <div className="p-4 overflow-x-auto">
        <p className="text-center font-semibold text-xl mb-5">Exam Summary</p>
        <p className="font-semibold mb-2 text-gray-800">
          English Typing : <span className="text-gray-600">( Current Section )</span>
        </p>

        <table className="w-full min-w-[600px] text-center border border-gray-300">
          <thead className="bg-blue-100 text-sm">
            <tr className="border-b">
              <th className="border-r p-2">Section Name</th>
              <th className="border-r p-2">Gross Speed</th>
              <th className="border-r p-2">Correct Word</th>
              <th className="border-r p-2">Wrong Word</th>
              <th className="p-2">Net Speed</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm">
              <td className="border-r p-2">English Typing Test</td>
              <td className="border-r p-2">0</td>
              <td className="border-r p-2">0</td>
              <td className="border-r p-2">0</td>
              <td className="p-2">00 : 04</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CPCT Actual Summary */}
      <div className="px-4 overflow-x-auto">
        <p className="font-semibold mb-2 text-gray-800">
          CPCT Actual : <span className="text-gray-600">( Current Section )</span>
        </p>

        <table className="w-full min-w-[700px] text-center border text-sm">
          <thead className="bg-blue-100">
            <tr className="border-b">
              <th className="border p-2">Section Name</th>
              <th className="border p-2">No. of Questions</th>
              <th className="border p-2">Answered</th>
              <th className="border p-2">Not Answered</th>
              <th className="border p-2">Marked for Review</th>
              <th className="border p-2">Answered & Marked for Review</th>
              <th className="border p-2">Not Visited</th>
            </tr>
          </thead>
          <tbody>
            {[ ["General IT Skills & Networking", 52, 0, 1, 0, 0, 51], ["Reading Comprehension", 5, 0, 0, 0, 0, 5], ["Aptitude", 6, 0, 0, 0, 0, 6], ["Reasoning", 6, 0, 0, 0, 0, 6], ["General Awareness", 6, 0, 0, 0, 0, 6] ].map(([name, total, ans, notAns, mark, markAns, notVisit], idx) => (
              <tr key={idx}>
                <td className="border p-2 text-left">{name}</td>
                <td className="border p-2">{total}</td>
                <td className="border p-2">{ans}</td>
                <td className="border p-2">{notAns}</td>
                <td className="border p-2">{mark}</td>
                <td className="border p-2">{markAns}</td>
                <td className="border p-2">{notVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-sm mt-4 font-semibold text-gray-700">
          हिंदी टाइपिंग : <span className="text-gray-500">( Yet to attempt )</span>
        </p>
      </div>

      {/* Confirmation Message */}
      <div className="text-center text-sm p-4 mt-4 border-t">
        <p className="text-gray-800 font-medium leading-relaxed">
          क्या आप वाकई इस सेक्शन को सबमिट करना चाहते हैं? आगे बढ़ने के लिए
          <span className="font-bold"> 'Yes'</span> पर क्लिक करें, वापस जाने के लिए
          <span className="font-bold"> 'No'</span> पर क्लिक करें। <br />
          प्रतिभागी, एक बार सेक्शन सबमिट करने के बाद, आप अपने उत्तरों में कोई संशोधन नहीं कर पाएंगे।
        </p>

        <div className="mt-4 flex justify-center gap-4 flex-wrap">
          <button className="bg-green-500 hover:bg-gray-300 text-black px-4 py-2 rounded">
            <a href="/exam/break2">Yes</a>
          </button>
          <button className="bg-red-500 hover:bg-gray-300 text-black px-4 py-2 rounded">
            <a href="/exam/english-ty">No</a>
          </button>
        </div>
      </div>
    </div>
  );
}
