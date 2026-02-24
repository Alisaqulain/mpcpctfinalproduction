import React from "react";

export default function CpctScoreCard() {
  return (
    <div className="max-w-4xl mx-auto border shadow-xl text-sm font-sans bg-white mb-5">
      {/* Full-Width Header */}
      <div className="w-full bg-yellow-400 px-4 py-2">
        <div className="flex items-center justify-between w-full">
          {/* Left Logo */}
          <img
            src="/logor.png"
            alt="MP Logo"
            className="h-24 w-35 mt-[-8]"
          />

          {/* Center Title */}
          <div className="text-center flex-1 -ml-12">
          <h1
  className="text-3xl md:text-5xl font-extrabold uppercase md:mt-0 leading-[1.2] text-[#290c52]"
  style={{
    textShadow: `
      0 0 10px white,
      1px 1px 0 #39245f,
      2px 2px 0 #341f57,
      3px 3px 0 #2d1a4e,
      4px 4px 0 #241244,
      5px 5px 6px rgba(0, 0, 0, 0.4)
    `,
    letterSpacing: '2px',
  }}
>
  MPCPCT
</h1>
           <p className="text-lg md:text-2xl text-gray-600 md:mt-0 font-semibold">
            (To Help in typing & computer proficiency)
          </p>
          </div>

         
        
        </div>
      </div>
      

      {/* Title */}
      <div className="text-center mb-4 font-semibold text-lg mt-2 py-3">
          {/* Student Photo */}
          <img
            src="/lo.jpg"
            alt="Student"
            className="w-24 h-20 border ml-2 absolute top-29"
          />
        <p className="uppercase">Score Card</p>
        <p className="text-sm">Cpct Examination 2025-26</p>
      </div>

      {/* Details Table */}
      <div className="grid grid-cols-2 gap-4 border-t border-b p-4 mb-4">
        <p><strong>District:</strong> GANGANAGAR</p>
        <p><strong>Exam Centre Code:</strong> 3402</p>
        <p><strong>Roll No.:</strong> 171779</p>
        <p><strong>Learner Code:</strong> 568240516100348789</p>
        <p><strong>Name of Student:</strong> SURESH</p>
        <p><strong>Father/Husband Name:</strong> RAM NIVAS</p>
      </div>

      {/* Result Table */}
      <table className="w-full border text-center mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Sections</th>
            <th className="border p-1">Maximum Marks</th>
            <th className="border p-1">Minimum Pass Marks</th>
            <th className="border p-1">Obtained Marks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-1 text-left">Theory Marks</td>
            <td className="border p-1">70</td>
            <td className="border p-1">28</td>
            <td className="border p-1">42</td>
          </tr>
          <tr>
            <td className="border p-1 text-left">Internal Marks</td>
            <td className="border p-1">30</td>
            <td className="border p-1">12</td>
            <td className="border p-1">27</td>
          </tr>
          <tr className="font-bold">
            <td className="border p-1 text-left">Total</td>
            <td colSpan="3" className="border p-1 text-left">69/100</td>
          </tr>
        </tbody>
      </table>

      {/* Final Result */}
      <div className="grid grid-cols-2 gap-4 mb-4 px-4">
        <p><strong>Final Result:</strong> <span className="text-green-600">PASS</span></p>
        <p><strong>Result Date:</strong> 09-06-2025</p>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4 text-xs border-t pt-4 px-4">
        <div>
          <p className="font-semibold">For Queries about RSCIT Result</p>
          <p>INCHARGE RSCIT EXAMINATION</p>
          <p>VARDHMAN MAHAVEER OPEN UNIVERSITY</p>
          <p>RAWATBHATA (ROAD), KOTA - 324021 (RAJ.)</p>
          <p>Email: <a href="mailto:exam@vmou.ac.in" className="text-blue-600">exam@vmou.ac.in</a></p>
        </div>
        <div>
          <p className="font-semibold">For Queries about RSCIT Data Corrections</p>
          <p>RAJASTHAN KNOWLEDGE CORPORATION LTD.</p>
          <p>7-A, JHALANA INSTITUTIONAL AREA</p>
          <p>JAIPUR - 302004 (RAJ.)</p>
          <p>Ph: 0141-5159700</p>
          <p>Email: <a href="mailto:info@rkcl.in" className="text-blue-600">info@rkcl.in</a></p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between items-center text-xs border-t pt-4 px-4 pb-4">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Seal_of_RKCL.png/120px-Seal_of_RKCL.png"
          alt="Seal"
          className="h-10"
        />
        <p className="italic text-gray-500">Controller of Examinations</p>
      </div>
    </div>
  );
}
