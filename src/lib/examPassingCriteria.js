/**
 * Admin-driven pass/fail criteria for exams.
 * Values from exam.passingRules + exam.passingMarks override CPCT/RSCIT/CCC defaults.
 */

const DEFAULTS_BY_KEY = {
  CPCT: {
    mcqPassingMarks: 38,
    englishTypingPassingNWPM: 30,
    hindiTypingPassingNWPM: 20,
    overallPassRule: "all_sections",
    mcqSectionName: "Section A",
    englishSectionName: "Section B",
    hindiSectionName: "Section C",
  },
  RSCIT: {
    sectionAMinMarks: 12,
    sectionBMinMarks: 28,
    overallPassRule: "all_sections",
    displayPassingMarks: 40,
  },
  CCC: {
    passingPercent: 50,
    overallPassRule: "total_marks",
  },
  TOPICWISE: {
    passingPercent: 50,
    overallPassRule: "total_marks",
  },
};

function pickNum(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (!Number.isNaN(n) && v !== "" && v != null) return n;
  }
  return undefined;
}

export function normalizePassingConfig(exam) {
  const key = exam?.key || "CPCT";
  const defaults = DEFAULTS_BY_KEY[key] || DEFAULTS_BY_KEY.CPCT;
  const rules = exam?.passingRules && typeof exam.passingRules === "object" ? exam.passingRules : {};

  const config = {
    examKey: key,
    examTitle: exam?.title || "",
    totalQuestions: pickNum(rules.totalMcqQuestions, exam?.totalQuestions) ?? exam?.totalQuestions ?? 75,
    mcqPassingMarks:
      pickNum(rules.mcqPassingMarks, rules.mcqMin, exam?.passingMarks, defaults.mcqPassingMarks) ??
      (defaults.mcqPassingMarks ?? Math.ceil((exam?.totalMarks || 75) * 0.5)),
    englishTypingPassingNWPM:
      pickNum(rules.englishTypingPassingNWPM, rules.englishNwpm, defaults.englishTypingPassingNWPM) ?? 30,
    hindiTypingPassingNWPM:
      pickNum(rules.hindiTypingPassingNWPM, rules.hindiNwpm, defaults.hindiTypingPassingNWPM) ?? 20,
    englishTypingPassingPercent: pickNum(rules.englishTypingPassingPercent) ?? 50,
    hindiTypingPassingPercent: pickNum(rules.hindiTypingPassingPercent) ?? 50,
    overallPassingMarks: pickNum(rules.overallPassingMarks, exam?.passingMarks, defaults.displayPassingMarks),
    overallPassRule: rules.overallPassRule || defaults.overallPassRule || "total_marks",
    resultPublicationDate: rules.resultPublicationDate || exam?.resultPublicationDate || null,
    customCriteriaText: rules.customCriteriaText || "",
    sectionAMinMarks: pickNum(rules.sectionAMinMarks, defaults.sectionAMinMarks) ?? 12,
    sectionBMinMarks: pickNum(rules.sectionBMinMarks, defaults.sectionBMinMarks) ?? 28,
    passingPercent: pickNum(rules.passingPercent, defaults.passingPercent) ?? 50,
    mcqSectionName: rules.mcqSectionName || defaults.mcqSectionName || "Section A",
    englishSectionName: rules.englishSectionName || defaults.englishSectionName || "Section B",
    hindiSectionName: rules.hindiSectionName || defaults.hindiSectionName || "Section C",
  };

  if (key === "CCC" || key === "TOPICWISE") {
    config.mcqPassingMarks = config.overallPassingMarks;
  }

  return config;
}

export function formatPublicationDate(dateVal) {
  if (!dateVal) return new Date().toLocaleDateString();
  const d = new Date(dateVal);
  return Number.isNaN(d.getTime()) ? String(dateVal) : d.toLocaleDateString();
}

function findSectionScore(sectionStats, ...names) {
  for (const name of names) {
    const s = sectionStats.find((x) => x.sectionName === name || x.sectionName?.includes(name));
    if (s) return s.score || 0;
  }
  return 0;
}

function loadTypingFromStorage(language) {
  const key = language === "English" ? "englishTypingResult" : "hindiTypingResult";
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return { netSpeed: 0, remarks: "", errors: [] };
    const r = JSON.parse(raw);
    return {
      netSpeed: r.netSpeed || 0,
      remarks: r.remarks || "",
      errors: r.errors || [],
      wpm: r.wpm || 0,
    };
  } catch {
    return { netSpeed: 0, remarks: "", errors: [] };
  }
}

export function evaluateExamPassing(exam, sectionStats = [], totalMaxMarks = 0) {
  const config = normalizePassingConfig(exam);
  const key = config.examKey;
  const typingResults = [];
  let passingMarksValue = config.mcqPassingMarks;
  let isPassedValue = false;
  let sectionResults = [];

  if (key === "RSCIT") {
    const sectionAScore = findSectionScore(sectionStats, "Section A");
    const sectionBScore = findSectionScore(sectionStats, "Section B");
    const sectionAPassed = sectionAScore >= config.sectionAMinMarks;
    const sectionBPassed = sectionBScore >= config.sectionBMinMarks;
    isPassedValue = sectionAPassed && sectionBPassed;
    passingMarksValue = config.overallPassingMarks ?? config.displayPassingMarks ?? 40;
    sectionResults = [
      { label: "Section A", obtained: sectionAScore, required: config.sectionAMinMarks, passed: sectionAPassed },
      { label: "Section B", obtained: sectionBScore, required: config.sectionBMinMarks, passed: sectionBPassed },
    ];
  } else if (key === "CCC" || key === "TOPICWISE") {
    const totalScore = sectionStats.reduce((sum, s) => sum + (s.score || 0), 0);
    passingMarksValue =
      config.overallPassingMarks ?? Math.ceil(totalMaxMarks * (config.passingPercent / 100));
    isPassedValue = totalScore >= passingMarksValue;
  } else if (key === "CPCT") {
    const mcqScore = findSectionScore(sectionStats, config.mcqSectionName, "MCQ", "Computer Proficiency");
    const mcqPassed = mcqScore >= config.mcqPassingMarks;
    passingMarksValue = config.mcqPassingMarks;

    const english = loadTypingFromStorage("English");
    const hindi = loadTypingFromStorage("Hindi");
    const englishPassed = english.netSpeed >= config.englishTypingPassingNWPM;
    const hindiPassed = hindi.netSpeed >= config.hindiTypingPassingNWPM;

    typingResults.push({
      sectionName: config.englishSectionName,
      language: "English",
      netSpeed: english.netSpeed,
      passingSpeed: config.englishTypingPassingNWPM,
      isPassed: englishPassed,
      remarks: english.remarks,
      errors: english.errors,
    });
    typingResults.push({
      sectionName: config.hindiSectionName,
      language: "Hindi",
      netSpeed: hindi.netSpeed,
      passingSpeed: config.hindiTypingPassingNWPM,
      isPassed: hindiPassed,
      remarks: hindi.remarks,
      errors: hindi.errors,
    });

    const allTypingPassed =
      typingResults.length > 0 && typingResults.every((tr) => tr.isPassed);
    const hasBothTyping =
      typeof window !== "undefined" &&
      localStorage.getItem("englishTypingResult") &&
      localStorage.getItem("hindiTypingResult");

    if (config.overallPassRule === "total_marks") {
      const totalScore = sectionStats.reduce((sum, s) => sum + (s.score || 0), 0);
      const req = config.overallPassingMarks ?? config.mcqPassingMarks;
      isPassedValue = totalScore >= req;
    } else if (config.overallPassRule === "both") {
      const totalScore = sectionStats.reduce((sum, s) => sum + (s.score || 0), 0);
      const totalReq = config.overallPassingMarks ?? config.mcqPassingMarks;
      isPassedValue = mcqPassed && allTypingPassed && hasBothTyping && totalScore >= totalReq;
    } else {
      isPassedValue = mcqPassed && allTypingPassed && hasBothTyping;
    }

    sectionResults = [
      {
        label: "MCQ",
        obtained: mcqScore,
        required: config.mcqPassingMarks,
        passed: mcqPassed,
      },
      ...typingResults.map((tr) => ({
        label: `${tr.language} Typing`,
        obtained: tr.netSpeed,
        required: tr.passingSpeed,
        passed: tr.isPassed,
        unit: "NWPM",
      })),
    ];
  } else {
    const totalScore = sectionStats.reduce((sum, s) => sum + (s.score || 0), 0);
    passingMarksValue =
      config.overallPassingMarks ?? Math.ceil(totalMaxMarks * (config.passingPercent / 100));
    isPassedValue = totalScore >= passingMarksValue;
  }

  return {
    config,
    passingMarksValue,
    isPassedValue,
    typingResults,
    sectionResults,
    publicationDate: formatPublicationDate(config.resultPublicationDate),
  };
}

export function buildCriteriaLines(exam) {
  const c = normalizePassingConfig(exam);
  const lines = [];

  if (c.examKey === "CPCT") {
    lines.push(
      `MCQ (Computer Proficiency): Minimum ${c.mcqPassingMarks} marks required.`,
      `English Typing: Minimum ${c.englishTypingPassingNWPM} NWPM required.`,
      `Hindi Typing: Minimum ${c.hindiTypingPassingNWPM} NWPM required.`,
      "Overall: MCQ + English Typing + Hindi Typing — all sections must be passed to qualify."
    );
    if (c.overallPassRule === "total_marks" && c.overallPassingMarks) {
      lines.push(`Overall total marks required: ${c.overallPassingMarks}.`);
    }
  } else if (c.examKey === "RSCIT") {
    lines.push(
      `Section A: Minimum ${c.sectionAMinMarks} marks required.`,
      `Section B: Minimum ${c.sectionBMinMarks} marks required.`,
      "Both sections must be passed."
    );
  } else if (c.examKey === "CCC" || c.examKey === "TOPICWISE") {
    const pct = c.passingPercent;
    lines.push(
      `Minimum ${pct}% of total marks required to pass` +
        (c.overallPassingMarks ? ` (${c.overallPassingMarks} marks).` : ".")
    );
  } else {
    lines.push(`Minimum passing marks: ${c.mcqPassingMarks}.`);
  }

  if (c.customCriteriaText?.trim()) {
    lines.push(c.customCriteriaText.trim());
  }

  if (c.resultPublicationDate) {
    lines.push(`Result publication date: ${formatPublicationDate(c.resultPublicationDate)}.`);
  }

  return lines;
}

export function buildPassingRulesPayload(form) {
  const raw = {
    totalMcqQuestions: form.totalQuestions ? Number(form.totalQuestions) : undefined,
    mcqPassingMarks: form.mcqPassingMarks !== "" && form.mcqPassingMarks != null ? Number(form.mcqPassingMarks) : undefined,
    englishTypingPassingNWPM:
      form.englishTypingPassingNWPM !== "" && form.englishTypingPassingNWPM != null
        ? Number(form.englishTypingPassingNWPM)
        : undefined,
    hindiTypingPassingNWPM:
      form.hindiTypingPassingNWPM !== "" && form.hindiTypingPassingNWPM != null
        ? Number(form.hindiTypingPassingNWPM)
        : undefined,
    englishTypingPassingPercent:
      form.englishTypingPassingPercent !== "" ? Number(form.englishTypingPassingPercent) : undefined,
    hindiTypingPassingPercent:
      form.hindiTypingPassingPercent !== "" ? Number(form.hindiTypingPassingPercent) : undefined,
    overallPassingMarks:
      form.overallPassingMarks !== "" && form.overallPassingMarks != null
        ? Number(form.overallPassingMarks)
        : undefined,
    overallPassRule: form.overallPassRule || "all_sections",
    resultPublicationDate: form.resultPublicationDate || undefined,
    customCriteriaText: form.customCriteriaText?.trim() || undefined,
    sectionAMinMarks: form.sectionAMinMarks !== "" ? Number(form.sectionAMinMarks) : undefined,
    sectionBMinMarks: form.sectionBMinMarks !== "" ? Number(form.sectionBMinMarks) : undefined,
    passingPercent: form.passingPercent !== "" ? Number(form.passingPercent) : undefined,
  };
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== ""));
}
