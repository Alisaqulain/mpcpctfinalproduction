"use client";
import React, { useState, useEffect, Suspense } from "react";
import jsPDF from "jspdf";
import Link from "next/link";

const MIN_NET_SPEED = 10;

function LearningWordResultContent() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualUserName, setActualUserName] = useState(null);

  useEffect(() => {
    const loadResult = () => {
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem("learningWordResult") : null;
        if (raw) {
          const data = JSON.parse(raw);
          setResult(data);
          if (!data.userName || data.userName === "User") {
            fetch("/api/profile", { credentials: "include" })
              .then((r) => r.ok ? r.json() : null)
              .then((d) => {
                if (d?.user?.name) setActualUserName(d.user.name);
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        console.error("Error loading learning word result", e);
      } finally {
        setLoading(false);
      }
    };
    loadResult();
  }, []);

  const handleDownloadPDF = () => {
    if (!result) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text("MPCPCT", pageWidth / 2, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.text("(To Help in typing & computer proficiency)", pageWidth / 2, 22, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    let yPos = 40;
    pdf.text("Result", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    pdf.setFontSize(14);
    pdf.text("Learning - Word Typing Lesson", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;
    pdf.setFontSize(10);
    pdf.rect(10, yPos, pageWidth - 20, 30);
    pdf.text(`Name of Student: ${actualUserName || result.userName || "User"}`, 12, yPos + 6);
    pdf.text(`Result Date: ${result.resultDate || new Date().toLocaleString()}`, 12, yPos + 12);
    pdf.text(`Test Language: ${result.language}${result.subLanguage ? ` (${result.subLanguage})` : ""}`, 12, yPos + 18);
    pdf.text(`Lesson: ${result.lessonTitle || "Word Lesson"}`, 12, yPos + 24);
    pdf.text(`Exam Centre Name: MPCPCT`, 12, yPos + 30);
    yPos += 40;
    pdf.setFontSize(12);
    pdf.text("Result", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    const tableData = [
      ["Gross Speed", `${result.grossSpeed || 0}wpm`, "Total Type Word", String(result.totalWords || 0)],
      ["Correct Word", String(result.correctWords || 0), "Wrong Words", String(result.wrongWords || 0)],
      ["Net Speed", `${result.netSpeed || 0}wpm`, "Accuracy", `${result.accuracy || 0}%`],
    ];
    const colWidths = [50, 30, 50, 30];
    tableData.forEach((row) => {
      let xPos = 10;
      row.forEach((cell, i) => {
        pdf.rect(xPos, yPos, colWidths[i], 8);
        pdf.text(cell, xPos + colWidths[i] / 2, yPos + 5, { align: "center" });
        xPos += colWidths[i];
      });
      yPos += 8;
    });
    yPos += 5;
    pdf.rect(10, yPos, pageWidth - 20, 8);
    pdf.text("Final Result", 12, yPos + 5);
    const finalResultText = `${result.finalResult} (Minimum Net Speed of ${MIN_NET_SPEED} WPM to unlock next word lesson)`;
    pdf.text(finalResultText, 60, yPos + 5);
    pdf.save(`learning-word-result-${actualUserName || result.userName || "User"}-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">No Result Found</h1>
          <p className="text-gray-500">Complete a Learning Word lesson and submit to see results.</p>
          <Link href="/learning" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto border-4 border-[#290c52] bg-white shadow-xl text-sm font-sans my-5">
        <div
          className="w-full px-4 py-2 border"
          style={{
            backgroundColor: "#290c52",
            backgroundImage: "url('/bg.jpg')",
            backgroundRepeat: "repeat",
            backgroundSize: "cover",
          }}
        >
          <div className="flex items-center justify-between w-full">
            <img src="/logor.png" alt="MP Logo" className="h-24 w-35 mt-[-8]" />
            <div className="text-center flex-1 -ml-12">
              <h1
                className="text-3xl md:text-5xl font-extrabold uppercase md:mt-0 leading-[1.2] text-white"
                style={{
                  textShadow: `0 0 10px black, 1px 1px 0 #39245f, 2px 2px 0 #341f57, 3px 3px 0 #2d1a4e, 4px 4px 0 #241244, 5px 5px 6px rgba(0,0,0,0.4)`,
                  letterSpacing: "2px",
                }}
              >
                MPCPCT
              </h1>
              <p className="text-lg md:text-2xl text-pink-300 md:mt-0 font-semibold">
                (To Help in typing & computer proficiency)
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 mb-2">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Download PDF
          </button>
        </div>

        <div className="text-center mb-4 font-semibold text-lg mt-2 py-4">
          <img src="/lo.jpg" alt="Student" className="w-24 h-20 border ml-2 absolute top-40" />
          <p className="uppercase font-bold text-2xl">Result</p>
          <p className="text-3xl md:text-2xl pt-10 md:pt-0">Learning - Word Typing Lesson</p>
        </div>

        <div className="overflow-x-auto text-sm border border-gray-300 w-full max-w-full mx-auto">
          <table className="table-auto w-full border border-black">
            <tbody>
              <tr className="border border-black">
                <td className="border border-black px-2 py-1 font-semibold">Name of Student</td>
                <td className="border border-black px-2 py-1">{actualUserName || result.userName || "User"}</td>
                <td className="border border-black px-2 py-1 font-semibold">Result Date</td>
                <td className="border border-black px-2 py-1">{result.resultDate || new Date().toLocaleString()}</td>
              </tr>
              <tr className="border border-black">
                <td className="border border-black px-2 py-1 font-semibold">Test Language</td>
                <td className="border border-black px-2 py-1">
                  {result.language || "English"}
                  {result.subLanguage ? ` (${result.subLanguage})` : ""}
                </td>
                <td className="border border-black px-2 py-1 font-semibold">Lesson</td>
                <td className="border border-black px-2 py-1">{result.lessonTitle || "Word Lesson"}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-semibold">Exam Centre Name</td>
                <td className="border border-black px-2 py-1" colSpan={3}>MPCPCT</td>
              </tr>
              <tr>
                <td className="text-center" colSpan={4}>Result</td>
              </tr>
            </tbody>
          </table>
        </div>

        <table className="w-full border text-center">
          <tbody>
            <tr className="font-bold">
              <td className="border p-1 text-left">Gross Speed</td>
              <td className="border p-1">{result.grossSpeed ?? 0}wpm</td>
              <td className="border p-1">Total Type Word</td>
              <td className="border p-1">{result.totalWords ?? 0}</td>
            </tr>
            <tr className="font-bold">
              <td className="border p-1 text-left">Correct Word</td>
              <td className="border p-1">{result.correctWords ?? 0}</td>
              <td className="border p-1">Wrong Words</td>
              <td className="border p-1">{result.wrongWords ?? 0}</td>
            </tr>
            <tr className="font-bold">
              <td className="border p-1 text-left">Net Speed</td>
              <td className="border p-1">{result.netSpeed ?? 0}wpm</td>
              <td className="border p-1">Accuracy</td>
              <td className="border p-1">{result.accuracy ?? 0}%</td>
            </tr>
            <tr className="p-1 font-bold">
              <td className="text-center border" colSpan={2}>Final Result</td>
              <td colSpan={2} className="border">
                <span className={`${result.finalResult === "PASS" ? "text-green-600" : "text-red-600"}`}>
                  {result.finalResult}
                </span>
                {" "}(Minimum Net Speed of {MIN_NET_SPEED} WPM to unlock next word lesson)
              </td>
            </tr>
          </tbody>
        </table>

        {result.errors && result.errors.length > 0 && (
          <div className="bg-white p-4 w-full max-w-full text-sm mb-3">
            <h2 className="font-bold mb-2">Total Errors: <span>{result.errors.length} Typed [Record]</span></h2>
            <p className="mb-2">Remarks: <span className={result.remarks === "Excellent" || result.remarks === "Very Good" ? "text-green-500" : result.remarks === "Good" ? "text-blue-500" : "text-red-500"}>{result.remarks}</span></p>
            <div className="mt-3 border border-gray-300 p-3 bg-gray-50 rounded grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-2">
              {result.errors.map((error, index) => {
                const match = String(error).match(/^(.+?)\s*\[(.+?)\]$/);
                if (match) {
                  const [, typedWord, correctWord] = match;
                  return (
                    <div key={index} className="text-sm leading-tight break-words">
                      <span className="text-red-600 font-semibold">{typedWord}</span> <span className="text-gray-700">[</span><span className="text-green-700 font-semibold">{correctWord}</span><span className="text-gray-700">]</span>
                      {index < result.errors.length - 1 && ","}
                    </div>
                  );
                }
                return <div key={index} className="text-sm">{error}{index < result.errors.length - 1 && ","}</div>;
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center text-md border-t pt-4 px-4 font-semibold">
          <p className="mb-2 md:mb-0 text-sm md:text-base">
            Date of Publication of Result: <span>{new Date().toLocaleDateString()}</span>
          </p>
          <img src="/seal.png" alt="Seal" className="h-20 md:h-30 mx-auto pb-2 md:pb-5" />
          <div className="relative mt-2 md:mt-0">
            <img src="/sing.png" alt="Controller" className="h-20 md:h-30 ml-auto mb-[-35]" />
            <p className="italic text-gray-500 text-sm md:text-base">Head of Examinations</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-4">
        <Link href="/learning" className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded">
          Back to Learning
        </Link>
        <a href="/" className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded inline-block">
          Go To Home
        </a>
      </div>
    </div>
  );
}

export default function LearningWordResult() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LearningWordResultContent />
    </Suspense>
  );
}
