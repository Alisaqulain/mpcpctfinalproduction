"use client";

import React from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import LearningReChart from "@/components/result/LearningReChart";
import { formatResultDateDDMM } from "@/lib/formatResultDate";

export default function ScoreCardCertificate({ data }) {
  if (!data) return null;

  const {
    userName,
    userProfileUrl = "/lo.jpg",
    rollNo = "-------",
    subjectName,
    resultDate,
    publicationDate,
    homeLink = "/",
    isPassed,
    totalScore,
    totalMax,
    columns = [],
    learningReData,
    variant = "score-card",
    typingSimpleMetrics = [],
    typingMetrics = [],
    finalResultNote = "",
    footerQueryTitle,
    footerCriteriaTitle,
    footerLeftLines = [],
    footerRightLines = [],
    errors = [],
    remarks = "",
    pdfFilePrefix = "Result",
  } = data;

  const displayDate = formatResultDateDDMM(resultDate);
  const pubDate = publicationDate || formatResultDateDDMM(null);
  const isLearningRe = variant === "learning-re";
  const isSkill = variant === "skill";
  const showFooter = (isLearningRe || isSkill) && (footerLeftLines.length > 0 || footerRightLines.length > 0);

  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(41, 12, 82);
    pdf.rect(0, 0, pageWidth, 16, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("MPCPCT", 12, 8);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("To Help in typing & computer proficiency", 12, 13);
    pdf.text("Examination 2025-26", pageWidth - 12, 10, { align: "right" });

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    let yPos = 28;
    pdf.text("SCORE CARD", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    pdf.setFontSize(12);
    pdf.text(subjectName, pageWidth / 2, yPos, { align: "center" });
    yPos += 12;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Name: ${userName}`, 12, yPos);
    yPos += 6;
    pdf.text(`Result Date: ${displayDate}`, 12, yPos);
    yPos += 8;
    columns.forEach((col) => {
      pdf.text(`${col.sectionTitle}: ${col.obtained} / ${col.maximum}`, 12, yPos);
      yPos += 6;
    });
    yPos += 4;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: ${totalScore}/${totalMax}`, 12, yPos);
    yPos += 6;
    pdf.text(`Final Result: ${isPassed ? "Pass" : "Fail"}`, 12, yPos);
    pdf.setFontSize(8);
    pdf.text(`Date of Publication of Result: ${pubDate}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
    pdf.save(`${pdfFilePrefix}-ScoreCard-${userName}-${Date.now()}.pdf`);
  };

  return (
    <div className="px-2 sm:px-0">
      <div className="max-w-4xl mx-auto shadow-xl text-sm font-sans bg-white my-3 sm:my-5 border-2 border-[#290c52]">
        <div className="border-x-2 border-[#290c52]">
          {/* Mobile header */}
          <div
            className="sm:hidden relative w-full border-b border-[#290c52] min-h-[4.5rem]"
            style={{ backgroundColor: "#290c52" }}
          >
            <img
              src="/logor.png"
              alt="MPCPCT Logo"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-14 w-auto object-contain"
            />
            <div className="text-center px-3 py-2.5 pl-16 pr-3">
              <h1 className="text-xl font-extrabold uppercase text-white tracking-wide leading-tight">
                MPCPCT
              </h1>
              <p className="text-[11px] text-pink-200 font-medium mt-1 leading-snug">
                To Help in typing &amp; computer proficiency
              </p>
            </div>
          </div>

          {/* Desktop header */}
          <div
            className="hidden sm:flex w-full px-3 py-2 border-b border-[#290c52] items-center justify-between gap-2 min-h-[3rem]"
            style={{ backgroundColor: "#290c52" }}
          >
            <img src="/logor.png" alt="MPCPCT Logo" className="h-16 w-auto object-contain flex-shrink-0" />
            <h1 className="text-2xl font-extrabold uppercase text-white tracking-wide">MPCPCT</h1>
            <p className="text-xs text-pink-200 font-medium text-center flex-1">
              To Help in typing &amp; computer proficiency
            </p>
            <p className="text-xs text-white/90 whitespace-nowrap">Examination 2025-26</p>
          </div>

          {/* Mobile title */}
          <div className="sm:hidden relative border-b border-gray-300 min-h-[6.5rem]">
            <img
              src={userProfileUrl}
              alt="Student"
              className="absolute left-0 bottom-0 w-[6.75rem] h-[6.5rem] border-2 border-black border-l-0 border-b-0 object-cover bg-white"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/lo.jpg";
              }}
            />
            <div className="text-center pl-[7.25rem] pr-3 py-3 min-w-0">
              <p className="uppercase font-bold text-lg leading-tight">Score Card</p>
              <p className="text-sm mt-1 leading-tight">{subjectName}</p>
              <p className="text-xs mt-1 leading-tight">Examination 2025-26</p>
            </div>
          </div>

          {/* Desktop title */}
          <div className="hidden sm:block relative border-b border-gray-300 pb-2 pt-1 px-3 min-h-[4.5rem]">
            <img
              src={userProfileUrl}
              alt="Student"
              className="absolute left-3 bottom-0 w-[5.5rem] h-[4.25rem] border-2 border-[#290c52] object-cover bg-white"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/lo.jpg";
              }}
            />
            <div className="text-center pl-[6.5rem] pr-2">
              <p className="uppercase font-semibold text-xl leading-tight">Score Card</p>
              <p className="text-lg leading-tight">{subjectName}</p>
            </div>
          </div>

          {/* Student details */}
          <div className="overflow-x-auto text-xs sm:text-sm border border-gray-300 w-full max-w-full mx-auto">
            <table className="table-auto w-full border border-black">
              <tbody>
                <tr className="border border-black">
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Name of Student</td>
                  <td className="border border-black px-1 sm:px-2 py-1">{userName}</td>
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Result Date</td>
                  <td className="border border-black px-1 sm:px-2 py-1">{displayDate}</td>
                </tr>
                <tr className="border border-black">
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Roll No</td>
                  <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>
                    {rollNo}
                  </td>
                </tr>
                <tr className="border border-black">
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Subject Name</td>
                  <td className="border border-black px-1 sm:px-2 py-1" colSpan={3}>
                    {subjectName}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-1 sm:px-2 py-1 font-semibold">Exam Centre Name</td>
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

          {/* Result metrics — learning RE / skill use custom tables; word uses CPCT sections */}
          {isLearningRe ? (
            <table className="w-full border border-black border-collapse text-center font-semibold text-xs sm:text-sm">
              <tbody>
                {typingSimpleMetrics.map((row, idx) => (
                  <tr key={idx} className="font-bold">
                    <td className="border border-black p-1 text-left">{row.label}</td>
                    <td className="border border-black p-1">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : isSkill ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-black border-collapse text-center font-semibold text-xs sm:text-sm">
                <tbody>
                  {typingMetrics.map((row, idx) => (
                    <tr key={idx} className="font-bold">
                      <td className="border border-black p-1 text-left">{row.label}</td>
                      <td className="border border-black p-1">{row.value}</td>
                      <td className="border border-black p-1 text-left">{row.label2}</td>
                      <td className="border border-black p-1">{row.value2}</td>
                    </tr>
                  ))}
                  {finalResultNote && (
                    <tr className="font-bold">
                      <td className="border border-black p-1 text-left">Final Result</td>
                      <td colSpan={3} className="border border-black p-1 text-left">
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
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-400 border-collapse text-center font-semibold text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-1 border border-gray-400" colSpan={2}>
                    Sections
                  </th>
                  <th className="border border-gray-400 p-1" colSpan={2}>
                    Maximum Marks
                  </th>
                </tr>
                <tr className="bg-gray-200 border-b-2 border-gray-500">
                  <th className="p-1 border border-gray-400" colSpan={2}>
                    {columns[0]?.sectionTitle}
                  </th>
                  <th className="border border-gray-400 p-1">{columns[2]?.sectionTitle}</th>
                  <th className="border border-gray-400 p-1">{columns[3]?.sectionTitle}</th>
                </tr>
                <tr className="bg-gray-100 text-[10px] sm:text-xs">
                  <th className="p-0.5 border border-gray-400">{columns[0]?.header}</th>
                  <th className="border border-gray-400 p-0.5">{columns[1]?.header}</th>
                  <th className="border border-gray-400 p-0.5">{columns[2]?.header}</th>
                  <th className="border border-gray-400 p-0.5">{columns[3]?.header}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-1 text-center">Marks Obtained</td>
                  <td className="border px-2 sm:px-4">Out of</td>
                  <td className="border p-1">{columns[2]?.header}</td>
                  <td className="border p-1">{columns[3]?.header}</td>
                </tr>
                <tr>
                  <td className="border p-1 text-center">{columns[0]?.obtained}</td>
                  <td className="border p-1">{columns[1]?.obtained}</td>
                  <td className="border p-1">{columns[2]?.obtained}</td>
                  <td className="border p-1">{columns[3]?.obtained}</td>
                </tr>
                <tr>
                  <td className="border p-1 text-center" colSpan={2}>
                    {columns[0]?.percent}
                  </td>
                  <td className="border p-1">{columns[2]?.percent}</td>
                  <td className="border p-1">{columns[3]?.percent}</td>
                </tr>
                <tr>
                  <td className="border p-1 text-center" colSpan={2}>
                    <span
                      className={`font-semibold ${columns[1]?.qualified ? "text-green-600" : "text-red-600"}`}
                    >
                      {columns[1]?.qualified ? "Qualified" : "Not Qualified"}
                    </span>
                  </td>
                  <td className="border p-1">
                    <span
                      className={`font-semibold ${columns[2]?.qualified ? "text-green-600" : "text-red-600"}`}
                    >
                      {columns[2]?.qualified ? "Qualified" : "Not Qualified"}
                    </span>
                  </td>
                  <td className="border p-1">
                    <span
                      className={`font-semibold ${columns[3]?.qualified ? "text-green-600" : "text-red-600"}`}
                    >
                      {columns[3]?.qualified ? "Qualified" : "Not Qualified"}
                    </span>
                  </td>
                </tr>
                <tr className="font-bold text-black">
                  <td className="border border-black p-1 text-center">Total</td>
                  <td colSpan={3} className="border border-black p-1 text-center font-bold">
                    <span className={isPassed ? "text-green-600" : "text-red-600"}>{totalScore}</span>
                    <span className="text-black">/{totalMax}</span>
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-black p-1 text-center text-black">Final Result</td>
                  <td colSpan={3} className="border border-black p-1 text-center">
                    <span className={isPassed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {isPassed ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}

          {isLearningRe && learningReData && <LearningReChart resultData={learningReData} />}

          {showFooter && (
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
                    {Array.from({
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

          {!isLearningRe && !isSkill && errors.length > 0 && (
            <div className="p-3 border border-gray-300 m-2 text-xs">
              <p className="font-bold mb-1">
                Total Errors: {errors.length} Typed [Record]
                {remarks ? ` — Remarks: ${remarks}` : ""}
              </p>
              <p className="break-words">{errors.slice(0, 20).join(", ")}</p>
            </div>
          )}

          <div className="grid grid-cols-3 items-end gap-1 text-[10px] sm:text-xs border-t border-[#290c52] py-2 px-2 sm:px-3 font-semibold min-h-[5rem]">
            <p className="text-left self-end pb-1">
              Date of Publication of Result :
              <br />
              <span>{pubDate}</span>
            </p>
            <div className="flex justify-center self-end">
              <img src="/seal.png" alt="Seal" className="h-12 sm:h-16 md:h-20 object-contain" />
            </div>
            <div className="text-right self-end">
              <img src="/sing.png" alt="Controller" className="h-12 sm:h-16 md:h-20 ml-auto object-contain" />
              <p className="italic text-gray-600 text-[9px] sm:text-xs mt-0.5">Head of Examinations</p>
            </div>
          </div>

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
