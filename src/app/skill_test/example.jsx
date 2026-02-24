"use client";
import React, { useState, useRef } from "react";

export default function TypingTutor() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedSubLanguage, setSelectedSubLanguage] = useState("");
  const [duration, setDuration] = useState(5);
  const [selected, setSelected] = useState("Exercise103");
  const [selectedExam, setSelectedExam] = useState("Most Exams (MPCPCT)");
  const [backspace, setBackspace] = useState("OFF");

  const [exercises, setExercises] = useState([
    "CommonWord 4 Spee",
    "CommonWord 5 Spee",
    "CommonWord 6 Spee",
    "CommonWord 7 Spee",
    "CommonWord 8 Spee",
    "Exercise100",
    "Exercise101",
    "Exercise102",
    "Exercise103",
    "Exercise104",
    "Exercise105",
    "Exercise106",
    "Exercise107",
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newExercise, setNewExercise] = useState("");
  const fileInputRef = useRef(null);

  const mainLanguages = ["Hindi", "English"];
  const subLanguages = ["Ramington Gail", "Inscript"];
  const backspaceOptions = ["OFF", "ON"];
  const durations = [2, 5, 10, 15, 20, 30];
  const exams = [
    "Most Exams (CPCT)",
    "HighCourt LDC",
    "RSCIT, RPSC",
    "SSC, Steno",
  ];

  const description = `Matter to type is given on upper half part of screen. Word to type is highlighted. Back space is allowed till current word. Wrong typed word makes bold. So user can identify such mistakes. One or more word afterwards the highlighted word can be skipped, if needed. Skipped word will not added as mistakes.`;

  const handleAddExercise = () => {
    if (newExercise.trim() !== "" && !exercises.includes(newExercise)) {
      setExercises([newExercise, ...exercises]);
      setNewExercise("");
      setShowModal(false);
    }
  };

  const handleDeleteExercise = () => {
    const filtered = exercises.filter((item) => item !== selected);
    setExercises(filtered);
    setSelected(filtered[0] || "");
  };

  const handleLoadExercise = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        alert("Loaded File:\n" + event.target.result.slice(0, 200) + "...");
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff] p-4 font-sans">
      {/* Language & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Language Selection */}
        <div className="bg-[#290c52] p-4 rounded shadow-md text-white">
          <h2 className="font-bold text-lg mb-2 border-b border-white pb-1">
            1. Select Typing Language
          </h2>

          <div className="grid grid-cols-2 gap-2 text-black mb-2">
            {mainLanguages.map((lang) => (
              <label
                key={lang}
                className="bg-white px-2 py-1 rounded flex items-center gap-1"
              >
                <input
                  type="radio"
                  name="mainLanguage"
                  value={lang}
                  checked={selectedLanguage === lang}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    setSelectedSubLanguage("");
                  }}
                />
                {lang}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-black">
            {subLanguages.map((subLang) => {
              const disabled = selectedLanguage !== "Hindi";
              return (
                <label
                  key={subLang}
                  className={`${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  } bg-white px-2 py-1 rounded flex items-center gap-1`}
                >
                  <input
                    type="radio"
                    name="subLanguage"
                    value={subLang}
                    disabled={disabled}
                    checked={selectedSubLanguage === subLang}
                    onChange={(e) => setSelectedSubLanguage(e.target.value)}
                  />
                  {subLang}
                </label>
              );
            })}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="bg-[#290c52] p-4 rounded shadow-md text-white">
          <h2 className="font-bold text-lg mb-2 border-b border-white pb-1">
            2. Select Duration in Minutes
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {durations.map((time) => (
              <label
                key={time}
                className={`px-2 py-1 rounded text-center font-medium cursor-pointer bg-white text-black border border-gray-400 ${
                  duration === time ? "bg-blue-200" : ""
                }`}
              >
                <input
                  type="radio"
                  name="duration"
                  value={time}
                  className="mr-1"
                  onChange={() => setDuration(time)}
                  checked={duration === time}
                />
                {time} M
              </label>
            ))}
          </div>
        </div>

        {/* Backspace Selection */}
        <div className="bg-[#290c52] p-4 rounded shadow-md text-white">
          <h2 className="font-bold text-lg mb-2 border-b border-white pb-1">
            3. Backspace
          </h2>
          <div className="grid grid-cols-2 gap-2 mt-6">
            {backspaceOptions.map((option) => (
              <label
                key={option}
                className={`px-2 py-1 rounded text-center font-medium cursor-pointer bg-white text-black border border-gray-400 ${
                  backspace === option ? "bg-blue-200" : ""
                }`}
              >
                <input
                  type="radio"
                  name="backspace"
                  value={option}
                  className="mr-1"
                  onChange={() => setBackspace(option)}
                  checked={backspace === option}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Selection & Preview */}
      <div className="flex flex-col md:flex-row min-h-[70vh] font-serif bg-white rounded shadow overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/4 border-r border-gray-300 bg-[#fff] p-3">
          <h3 className="text-sm font-semibold mb-1">4. Select Exercise</h3>
          <div
            className="h-64 overflow-y-scroll pr-1 border border-gray-300 rounded bg-white"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#a0aec0 #f1f1f1",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #f1f1f1;
              }
              div::-webkit-scrollbar-thumb {
                background-color: #a0aec0;
                border-radius: 10px;
              }
            `}</style>

            {exercises.map((item) => (
              <div
                key={item}
                className={`text-sm px-2 py-1 cursor-pointer ${
                  selected === item
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelected(item)}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#290c52] cursor-pointer text-white text-sm px-2 py-1 rounded hover:bg-blue-500"
            >
              Add Exercise(+)
            </button>
            <button
              onClick={handleDeleteExercise}
              className="bg-red-500 cursor-pointer text-white text-sm px-2 py-1 rounded hover:bg-red-600"
            >
              Delete Exercise(-)
            </button>
            <button
              onClick={handleLoadExercise}
              className="bg-pink-500 cursor-pointer text-white text-sm px-2 py-1 rounded hover:bg-yellow-600"
            >
              Load Exercise
            </button>
            <input
              type="file"
              accept=".txt"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-sm">Exercise</h2>
          </div>
          <div className="border border-gray-300 p-3 text-sm leading-6 h-[50vh] overflow-y-scroll bg-[#fefefe] rounded">
            Brexit was quoted as being the financial equivalent of doomsday for
            Britain’s economy...
          </div>
          <div className="mt-8 text-md text-gray-700">
            <p>
              Total Characters: <b>5067</b>
              <span className="pl-10">Total Words: <b>848</b></span>
            </p>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="flex border text-sm font-serif w-full max-w-8xl mx-auto mt-4 rounded shadow overflow-hidden bg-white">
        <div className="w-1/4 border-r p-2 bg-[#fff]">
          <h3 className="text-gray-800 font-semibold mb-2">5. Select Exam</h3>
          <ul className="space-y-1">
            {exams.map((exam) => (
              <li
                key={exam}
                onClick={() => setSelectedExam(exam)}
                className={`cursor-pointer px-2 py-1 rounded-l ${
                  selectedExam === exam
                    ? "text-red-600 font-semibold border-l-4 border-red-500 bg-white"
                    : "text-blue-700 hover:bg-gray-100"
                }`}
              >
                {exam}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 flex flex-col justify-between p-3 bg-white relative">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-lg">
              Exam Description
            </h3>
            <button className="bg-green-500 text-white w-full md:w-[300px] px-4 py-1 mx-auto cursor-pointer rounded text-lg shadow hover:bg-green-600 transition-colors">
              <a href="/typing" className="block w-full">Start Test</a>
            </button>
          </div>
          <div className="text-green-700 leading-relaxed text-justify mt-4 md:mt-1">
            {description}
          </div>
        </div>
      </div>

      {/* Modal for Adding Exercise */}
      {showModal && (
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[300px]">
            <h2 className="text-lg font-semibold mb-2 text-center">
              Add Exercise
            </h2>
            <input
              type="text"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1 mb-4"
              placeholder="Exercise name"
            />
            <div className="flex justify-between">
              <button
                onClick={handleAddExercise}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setNewExercise("");
                  setShowModal(false);
                }}
                className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
