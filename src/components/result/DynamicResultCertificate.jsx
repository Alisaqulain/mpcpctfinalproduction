"use client";

import React from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import LearningReChart from "@/components/result/LearningReChart";

export default function DynamicResultCertificate({ data }) {
  if (!data) return null;

  const {
    userName,
    userProfileUrl = "/lo.jpg",
    subjectName,
    examSubtitle,
    resultDate,
    timeDuration,
    testLanguage,
    mode = "mcq",
    resultRows = [],
    totalScore,
    totalMax,
    isPassed,
    grade,
    typingMetrics = [],
    typingSimpleMetrics = [],
    finalResultNote,
    errors = [],
    remarks = "",
    footerQueryTitle,
    footerCriteriaTitle,
    footerLeftLines = [],
    footerRightLines = [],
    pdfFilePrefix = "Result",
    homeLink = "/",
    learningReData,
  } = data;

  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 25, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("MPCPCT", pageWidth / 2, 12, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("(To Help in typing & computer proficiency)", pageWidth / 2, 20, {
      align: "center",
    });

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    let yPos = 35;
    pdf.text("RESULT", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    pdf.setFontSize(14);
    pdf.text(examSubtitle || subjectName, pageWidth / 2, yPos, { align: "center" });
    yPos += 12;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Name: ${userName}`, 12, yPos);
    yPos += 6;
    pdf.text(`Subject: ${subjectName}`, 12, yPos);
    yPos += 6;
    pdf.text(`Result Date: ${resultDate}`, 12, yPos);
    yPos += 10;

    if (mode === "mcq") {
      resultRows.forEach((row) => {
        pdf.text(
          `${row.sectionLabel}: ${row.obtainedMarks}/${row.maxMarks} (Pass: ${row.minPassMarks})`,
          12,
          yPos
        );
        yPos += 6;
      });
      yPos += 4;
      pdf.setFont("helvetica", "bold");
      pdf.text(`Total: ${totalScore}/${totalMax}`, 12, yPos);
      yPos += 6;
      pdf.text(`Final Result: ${isPassed ? "PASS" : "FAIL"}`, 12, yPos);
      if (grade) {
        yPos += 6;
        pdf.text(`Grade: ${grade}`, 12, yPos);
      }
    } else {
      const metrics =
        mode === "typing-simple" ? typingSimpleMetrics : typingMetrics;
      metrics.forEach((m) => {
        if (m.label2) {
          pdf.text(`${m.label}: ${m.value} | ${m.label2}: ${m.value2}`, 12, yPos);
        } else {
          pdf.text(`${m.label}: ${m.value}`, 12, yPos);
        }
        yPos += 6;
      });
      if (finalResultNote) {
        yPos += 4;
        pdf.text(`Final Result: ${finalResultNote}`, 12, yPos);
      }
    }

    pdf.setFontSize(8);
    pdf.text(
      `Date of Publication of Result: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    pdf.save(`${pdfFilePrefix}-Result-${userName}-${Date.now()}.pdf`);
  };

  return (
    <div className="px-2 sm:px-0 pb-6">
      <div className="max-w-4xl mx-auto shadow-xl text-sm font-sans bg-white my-3 sm:my-5">
        <div className="border border-[#290c52]">
          <div
            className="w-full px-2 sm:px-4 py-2 border"
            style={{
              backgroundColor: "#290c52",
              backgroundImage: "url('/bg.jpg')",
              backgroundRepeat: "repeat",
              backgroundSize: "cover",
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between w-full">
              <img
                src="/logor.png"
                alt="MP Logo"
                className="h-16 sm:h-24 w-auto mt-1 sm:mt-0 order-1 sm:order-none"
              />
              <div className="text-center flex-1 sm:-ml-12 order-3 sm:order-none mt-2 sm:mt-0">
                <h1
                  className="text-2xl sm:text-3xl md:text-5xl font-extrabold uppercase leading-[1.2] text-white"
                  style={{
                    textShadow: `
                      0 0 10px black,
                      1px 1px 0 #39245f,
                      2px 2px 0 #341f57,
                      3px 3px 0 #2d1a4e,
                      4px 4px 0 #241244,
                      5px 5px 6px rgba(0, 0, 0, 0.4)
                    `,
                    letterSpacing: "2px",
                  }}
                >
                  MPCPCT
                </h1>
                <p className="text-sm sm:text-lg md:text-2xl text-pink-300 font-semibold">
                  (To Help in typing & computer proficiency)
                </p>
              </div>
              <div className="order-2 sm:order-none sm:h-24 w-0 sm:w-auto" />
            </div>
          </div>

          <div className="text-center mb-4 font-semibold text-lg mt-2 py-4 relative">
            <img
              src={userProfileUrl}
              alt="Student"
              className="w-16 sm:w-24 h-12 sm:h-20 border ml-2 absolute left-0 top-[19] md:top-1/2 transform -translate-y-1/2 object-cover bg-white"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/lo.jpg";
              }}
            />
            <p className="uppercase font-semibold text-xl sm:text-2xl">Result</p>
            <p className="text-xl sm:text-2xl">{examSubtitle || subjectName}</p>
          </div>

          <div className="overflow-x-auto text-xs sm:text-sm border border-gray-300 w-full max-w-full mx-auto">
            <table className="table-auto w-full border border-black">
              <tbody>
                <tr className="border border-black">
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                    Name of Student
                  </td>
                  <td className="border border-black px-1 sm:px-2 py-1">{userName}</td>
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                    Result Date
                  </td>
                  <td className="border border-black px-1 sm:px-2 py-1">{resultDate}</td>
                </tr>
                {testLanguage ? (
                  <tr className="border border-black">
                    <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                      Test Language
                    </td>
                    <td className="border border-black px-1 sm:px-2 py-1">{testLanguage}</td>
                    <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                      Time Duration
                    </td>
                    <td className="border border-black px-1 sm:px-2 py-1">
                      {timeDuration || ""}
                    </td>
                  </tr>
                ) : (
                  <tr className="border border-black">
                    <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                      Roll No
                    </td>
                    <td className="border border-black px-1 sm:px-2 py-1">-------</td>
                    <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                      Time Duration
                    </td>
                    <td className="border border-black px-1 sm:px-2 py-1">
                      {timeDuration || ""}
                    </td>
                  </tr>
                )}
                <tr className="border border-black">
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                    Subject Name
                  </td>
                  <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>
                    {subjectName}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">
                    Exam Centre Name
                  </td>
                  <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>
                    MPCPCT
                  </td>
                </tr>
                <tr>
                  <td className="text-center" colSpan={4}>
                    Result
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {mode === "mcq" && (
            <div className="overflow-x-auto">
              <table className="w-full border text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-1">Sections</th>
                    <th className="border p-1">Maximum Marks</th>
                    <th className="border p-1">Minimum Pass Marks</th>
                    <th className="border p-1">Obtained Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border p-1 text-left font-semibold">
                        {row.sectionLabel}
                      </td>
                      <td className="border p-1">{row.maxMarks}</td>
                      <td className="border p-1">{row.minPassMarks}</td>
                      <td className="border p-1">{row.obtainedMarks}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="border p-1 text-left">Total</td>
                    <td colSpan={3} className="border p-1 text-left">
                      <span className={isPassed ? "text-green-600" : "text-red-600"}>
                        {totalScore}
                      </span>
                      <span className="text-black">/{totalMax}</span>
                    </td>
                  </tr>
                  {grade && (
                    <tr className="font-bold">
                      <td className="border p-1 text-left">Grade</td>
                      <td colSpan={3} className="border p-1 text-left">
                        {grade}
                      </td>
                    </tr>
                  )}
                  <tr className="font-bold">
                    <td className="border p-1 text-left">Final Result</td>
                    <td
                      colSpan={3}
                      className={`border p-1 text-left ${isPassed ? "text-green-600" : "text-red-600"}`}
                    >
                      {isPassed ? "PASS" : "FAIL"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {mode === "typing" && (
            <div className="overflow-x-auto">
              <table className="w-full border text-center font-semibold text-xs sm:text-sm">
                <tbody>
                  {typingMetrics.map((row, idx) => (
                    <tr key={idx} className="font-bold">
                      <td className="border p-1 text-left">{row.label}</td>
                      <td className="border p-1">{row.value}</td>
                      {row.label2 && (
                        <>
                          <td className="border p-1">{row.label2}</td>
                          <td className="border p-1">{row.value2}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {finalResultNote && (
                    <tr className="font-bold">
                      <td className="border p-1 text-left">Final Result</td>
                      <td colSpan={3} className="border p-1 text-left">
                        {finalResultNote}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {errors.length > 0 && (
                <div className="p-3 border border-gray-300 m-2 text-xs">
                  <p className="font-bold mb-1">
                    Total Errors: {errors.length} Typed [Record]
                    {remarks ? ` — Remarks: ${remarks}` : ""}
                  </p>
                  <p className="break-words">{errors.slice(0, 20).join(", ")}</p>
                </div>
              )}
            </div>
          )}

          {mode === "typing-simple" && (
            <table className="w-full border text-center">
              <tbody>
                {typingSimpleMetrics.map((row, idx) => (
                  <tr key={idx} className="font-bold">
                    <td className="border p-1 text-left">{row.label}</td>
                    <td className="border p-1">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {learningReData && <LearningReChart resultData={learningReData} />}

          {(footerLeftLines.length > 0 || footerRightLines.length > 0) && (
            <div className="text-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black font-semibold">
                  <tbody>
                    <tr className="text-sm sm:text-lg">
                      <td className="border-b p-1 text-center px-2 sm:px-10" colSpan={2}>
                        {footerQueryTitle}
                      </td>
                      <td className="border-b border-l p-1 text-center" colSpan={2}>
                        {footerCriteriaTitle}
                      </td>
                    </tr>
                    {Math.max(footerLeftLines.length, footerRightLines.length) > 0 &&
                      Array.from({
                        length: Math.max(footerLeftLines.length, footerRightLines.length),
                      }).map((_, i) => (
                        <tr key={i}>
                          <td
                            className="p-1 text-left text-xs sm:text-[15px] pl-1 sm:pl-2"
                            colSpan={2}
                          >
                            {footerLeftLines[i] || ""}
                          </td>
                          <td className="border-l p-1 text-[15px]" colSpan={2}>
                            {footerRightLines[i] || ""}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm border-t pt-2 sm:pt-4 px-2 sm:px-4 font-semibold">
            <p className="mb-2 sm:mb-0">
              Date of Publication of Result :{" "}
              <span>{new Date().toLocaleDateString()}</span>
            </p>
            <img
              src="/seal.png"
              alt="Seal"
              className="h-16 sm:h-20 md:h-24 mx-auto pb-1 sm:pb-2 md:pb-5"
            />
            <div className="relative mt-1 sm:mt-0">
              <img
                src="/sing.png"
                alt="Controller"
                className="h-16 sm:h-20 md:h-24 ml-auto mb-[-20px] sm:mb-[-35px]"
              />
              <p className="italic text-gray-500 text-xs sm:text-sm">
                Head of Examinations
              </p>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex flex-row justify-between items-center gap-2 px-3 py-3 border-t border-[#290c52] bg-gray-50">
            <Link
              href={homeLink}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded text-xs sm:text-sm"
            >
              Go To Home
            </Link>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-xs sm:text-sm"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
