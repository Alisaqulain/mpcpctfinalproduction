import { normalizePassingConfig } from "@/lib/examPassingCriteria";
import {
  fetchUserProfileFromApi,
  mergeExamUserProfile,
  readExamUserDataFromStorage,
  resolveUserProfileUrl,
} from "@/lib/userProfile";

function calculateGrade(percentage) {
  if (percentage >= 85) return "S";
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 45) return "D";
  return "F";
}

function scoreFromAnswers(questions, loadedAnswers) {
  let obtained = 0;
  let maximum = 0;
  questions.forEach((q) => {
    const marks = q.marks || 1;
    maximum += marks;
    const answer = loadedAnswers[q._id];
    if (answer !== undefined && answer !== null && answer === q.correctAnswer) {
      obtained += marks;
    }
  });
  return { obtained, maximum };
}

function buildMcqPayload({
  userName,
  userProfileUrl,
  subjectName,
  examSubtitle,
  sectionLabel,
  totalScore,
  totalMax,
  passingMarks,
  isPassed,
  footerQueryTitle,
  footerCriteriaLines,
  grade,
  resultDate,
  timeDuration,
}) {
  return {
    userName,
    userProfileUrl,
    subjectName,
    examSubtitle,
    resultDate: resultDate || new Date().toLocaleDateString(),
    timeDuration: timeDuration || "",
    mode: "mcq",
    resultRows: [
      {
        sectionLabel,
        maxMarks: totalMax,
        minPassMarks: passingMarks,
        obtainedMarks: totalScore,
      },
    ],
    totalScore,
    totalMax,
    isPassed,
    grade,
    footerQueryTitle: footerQueryTitle || `For Queries about ${subjectName} Result`,
    footerCriteriaTitle: `${subjectName} Qualifying Criteria`,
    footerLeftLines: [
      "INCHARGE Examination",
      "Website MPCPCT.Com",
      "Add:A.B Road SJR 465001(M.P.)",
      "Email:mpcpct111@gmail.com",
    ],
    footerRightLines: footerCriteriaLines || [
      `Total Questions: ${totalMax}`,
      "Minimum Passing Marks: 50% of total marks",
    ],
    pdfFilePrefix: subjectName.replace(/\s+/g, "-"),
  };
}

async function loadUserBasics() {
  const userData = readExamUserDataFromStorage();
  let apiUser = null;
  try {
    apiUser = await fetchUserProfileFromApi();
  } catch {
    /* ignore */
  }
  const mergedUser = mergeExamUserProfile(userData, apiUser);
  const userName =
    mergedUser.name || userData?.name || apiUser?.name || "User";
  const userProfileUrl = resolveUserProfileUrl(mergedUser);
  return { userName, userProfileUrl };
}

async function loadFromProfileResult(profileResult) {
  const { userName, userProfileUrl } = await loadUserBasics();
  const examKey = profileResult.examKey || "CCC";
  const subjectName = profileResult.examTitle || examKey;
  const totalScore = profileResult.totalScore || 0;
  const totalMax = profileResult.totalQuestions || 100;
  const passingMarks = Math.ceil(totalMax * 0.5);
  const percentage =
    profileResult.percentage ||
    (totalMax > 0 ? (totalScore / totalMax) * 100 : 0);

  if (examKey === "RSCIT" && profileResult.sectionStats?.length) {
    const sectionA = profileResult.sectionStats.find(
      (s) => s.sectionName === "Section A" || s.sectionName.includes("Theory")
    );
    const sectionB = profileResult.sectionStats.find(
      (s) => s.sectionName === "Section B" || s.sectionName.includes("Internal")
    );
    const theoryScore = sectionA?.score || 0;
    const internalScore = sectionB?.score || 0;
    const theoryMax = sectionA?.totalQuestions
      ? sectionA.totalQuestions * 2
      : 70;
    const internalMax = sectionB?.totalQuestions
      ? sectionB.totalQuestions * 2
      : 30;
    return {
      ok: true,
      data: {
        userName: profileResult.userName || userName,
        userProfileUrl,
        subjectName,
        examSubtitle: `${subjectName} Examination 2025-26`,
        resultDate: new Date().toLocaleDateString(),
        mode: "mcq",
        resultRows: [
          {
            sectionLabel: "Section A — Theory",
            maxMarks: theoryMax,
            minPassMarks: 12,
            obtainedMarks: theoryScore,
          },
          {
            sectionLabel: "Section B — Internal",
            maxMarks: internalMax,
            minPassMarks: 28,
            obtainedMarks: internalScore,
          },
        ],
        totalScore: theoryScore + internalScore,
        totalMax: theoryMax + internalMax,
        isPassed: theoryScore >= 12 && internalScore >= 28,
        footerQueryTitle: "For Queries about RSCIT Result",
        footerCriteriaTitle: "RSCIT Qualifying Criteria",
        footerLeftLines: [
          "INCHARGE RSCIT Examination",
          "Website MPCPCT.Com",
          "Add:A.B Road SJR 465001(M.P.)",
          "Email:mpcpct111@gmail.com",
        ],
        footerRightLines: [
          "Section A Minimum: 12 marks",
          "Section B Minimum: 28 marks",
          "Both sections must be passed",
        ],
        pdfFilePrefix: "RSCIT",
      },
    };
  }

  if (examKey === "TOPICWISE") {
    return {
      ok: true,
      data: buildMcqPayload({
        userName: profileResult.userName || userName,
        userProfileUrl,
        subjectName,
        examSubtitle: "Topic Wise Exam 2025-26",
        sectionLabel: subjectName,
        totalScore,
        totalMax,
        passingMarks,
        isPassed: percentage >= 50,
        grade: calculateGrade(percentage),
        footerQueryTitle: "For Queries about Topic Wise Result",
        footerCriteriaLines: [
          `Total Questions: ${totalMax}`,
          "Each Question: 1 Mark",
          `Minimum Passing Marks: ${passingMarks} (50% of total marks)`,
        ],
      }),
    };
  }

  return {
    ok: true,
    data: buildMcqPayload({
      userName: profileResult.userName || userName,
      userProfileUrl,
      subjectName,
      examSubtitle: `${examKey} Examination 2025-26`,
      sectionLabel: `${examKey} Marks`,
      totalScore,
      totalMax,
      passingMarks: examKey === "CCC" ? 50 : passingMarks,
      isPassed:
        examKey === "CCC"
          ? totalScore >= 50
          : profileResult.isPassed ?? totalScore >= passingMarks,
      footerQueryTitle: `For Queries about ${examKey} Result`,
      footerCriteriaLines: [
        `Total Questions: ${totalMax}`,
        "Each Question: 1 Mark",
        `Minimum Passing Marks: ${examKey === "CCC" ? 50 : passingMarks} (50% of total marks)`,
      ],
    }),
  };
}

async function loadFromExamId(examId) {
  const { userName, userProfileUrl } = await loadUserBasics();
  const res = await fetch(`/api/exam-questions?examId=${examId}`);
  if (!res.ok) return { ok: false, error: "Failed to load exam data" };

  const data = await res.json();
  if (!data.success || !data.data?.exam) {
    return { ok: false, error: "Exam not found" };
  }

  const exam = data.data.exam;
  const answersStr = localStorage.getItem("examAnswers");
  const loadedAnswers = answersStr ? JSON.parse(answersStr) : {};
  const allQuestions = data.data.allQuestions || [];
  const { obtained, maximum } = scoreFromAnswers(allQuestions, loadedAnswers);
  const config = normalizePassingConfig(exam);

  if (exam.key === "RSCIT") {
    const sections = data.data.sections || [];
    const questionsBySection = {};
    sections.forEach((sec) => {
      questionsBySection[sec.name] = allQuestions.filter((q) => {
        const qSectionId = String(q.sectionId).trim();
        const secIdStr = String(sec.id).trim();
        const secIdObj = String(sec._id).trim();
        return (
          qSectionId === secIdObj ||
          qSectionId === secIdStr ||
          qSectionId === sec._id?.toString() ||
          qSectionId === sec.id
        );
      });
    });

    let theoryScore = 0;
    let theoryMax = 0;
    let internalScore = 0;
    let internalMax = 0;

    sections.forEach((sec, index) => {
      const secQuestions = questionsBySection[sec.name] || [];
      const { obtained: sObtained, maximum: sMax } = scoreFromAnswers(
        secQuestions,
        loadedAnswers
      );
      if (
        index === 0 ||
        sec.name.includes("Section A") ||
        sec.name.includes("Theory")
      ) {
        theoryMax = sMax;
        theoryScore = sObtained;
      } else if (
        index === 1 ||
        sec.name.includes("Section B") ||
        sec.name.includes("Internal")
      ) {
        internalMax = sMax;
        internalScore = sObtained;
      }
    });

    return {
      ok: true,
      data: {
        userName,
        userProfileUrl,
        subjectName: exam.title || "RSCIT",
        examSubtitle: "RSCIT Examination 2025-26",
        resultDate: new Date().toLocaleDateString(),
        mode: "mcq",
        resultRows: [
          {
            sectionLabel: "Section A — Theory",
            maxMarks: theoryMax || 70,
            minPassMarks: config.sectionAMinMarks || 12,
            obtainedMarks: theoryScore,
          },
          {
            sectionLabel: "Section B — Internal",
            maxMarks: internalMax || 30,
            minPassMarks: config.sectionBMinMarks || 28,
            obtainedMarks: internalScore,
          },
        ],
        totalScore: theoryScore + internalScore,
        totalMax: (theoryMax || 70) + (internalMax || 30),
        isPassed: theoryScore >= 12 && internalScore >= 28,
        footerQueryTitle: "For Queries about RSCIT Result",
        footerCriteriaTitle: "RSCIT Qualifying Criteria",
        footerLeftLines: [
          "INCHARGE RSCIT Examination",
          "Website MPCPCT.Com",
          "Add:A.B Road SJR 465001(M.P.)",
          "Email:mpcpct111@gmail.com",
        ],
        footerRightLines: [
          "Section A Minimum: 12 marks",
          "Section B Minimum: 28 marks",
          "Both sections must be passed",
        ],
        pdfFilePrefix: "RSCIT",
      },
    };
  }

  const passingMarks =
    exam.key === "CCC"
      ? 50
      : Math.ceil(maximum * ((config.passingPercent || 50) / 100));
  const percentage = maximum > 0 ? (obtained / maximum) * 100 : 0;

  return {
    ok: true,
    data: buildMcqPayload({
      userName,
      userProfileUrl,
      subjectName: exam.title || exam.key || "Exam",
      examSubtitle: `${exam.key || "Exam"} Examination 2025-26`,
      sectionLabel: `${exam.key || "Exam"} Marks`,
      totalScore: obtained,
      totalMax: maximum || 100,
      passingMarks,
      isPassed: obtained >= passingMarks,
      grade: exam.key === "TOPICWISE" ? calculateGrade(percentage) : undefined,
      footerQueryTitle: `For Queries about ${exam.key || "Exam"} Result`,
      footerCriteriaLines: [
        `Total Questions: ${maximum || 100}`,
        "Each Question: 1 Mark",
        `Minimum Passing Marks: ${passingMarks} (50% of total marks)`,
      ],
    }),
  };
}

async function loadFromTopicId(topicId) {
  const { userName, userProfileUrl } = await loadUserBasics();
  const res = await fetch(`/api/exam-questions?topicId=${topicId}`);
  if (!res.ok) return { ok: false, error: "Failed to load topic data" };

  const data = await res.json();
  if (!data.success || !data.data) {
    return { ok: false, error: "Topic not found" };
  }

  const exam = data.data.exam;
  const topicName = exam?.title || "Topic";
  const answersStr =
    localStorage.getItem(`topicwise-answers-${topicId}`) ||
    localStorage.getItem("examAnswers");
  const loadedAnswers = answersStr ? JSON.parse(answersStr) : {};
  const allQuestions = data.data.allQuestions || [];
  const { obtained, maximum } = scoreFromAnswers(allQuestions, loadedAnswers);
  const passingMarks = Math.ceil(maximum * 0.5);
  const percentage = maximum > 0 ? (obtained / maximum) * 100 : 0;

  return {
    ok: true,
    data: buildMcqPayload({
      userName,
      userProfileUrl,
      subjectName: topicName,
      examSubtitle: "Topic Wise Exam 2025-26",
      sectionLabel: topicName,
      totalScore: obtained,
      totalMax: maximum || 100,
      passingMarks,
      isPassed: obtained >= passingMarks,
      grade: calculateGrade(percentage),
      footerQueryTitle: "For Queries about Topic Wise Result",
      footerCriteriaLines: [
        `Total Questions: ${maximum || 100}`,
        "Each Question: 1 Mark",
        `Minimum Passing Marks: ${passingMarks} (50% of total marks)`,
      ],
    }),
  };
}

async function loadFromSkillResult(resultId) {
  const id = resultId || localStorage.getItem("lastTypingResultId");
  if (!id) return { ok: false, error: "No skill test result found", homeLink: "/skill_test" };

  const res = await fetch(`/api/typing-results?resultId=${id}`);
  if (!res.ok) return { ok: false, error: "Failed to load skill test result" };

  const data = await res.json();
  if (!data.success || !data.result) {
    return { ok: false, error: "Result not found", homeLink: "/skill_test" };
  }

  const result = data.result;
  const { userName, userProfileUrl } = await loadUserBasics();
  const displayName =
    result.userName && result.userName !== "User"
      ? result.userName
      : userName;

  return {
    ok: true,
    data: {
      userName: displayName,
      userProfileUrl,
      subjectName: result.exerciseName || "Skill Test",
      examSubtitle: "Skill Test Examination 2025-26",
      resultDate: new Date(result.submittedAt).toLocaleDateString(),
      timeDuration: `${result.duration} minutes`,
      testLanguage: `${result.language}${result.subLanguage ? ` (${result.subLanguage})` : ""}`,
      mode: "typing",
      typingMetrics: [
        { label: "Gross Speed", value: `${result.grossSpeed || 0}wpm`, label2: "Total Type Word", value2: String(result.totalWords || 0) },
        { label: "Correct Word", value: String(result.correctWords || 0), label2: "Wrong Words", value2: String(result.wrongWords || 0) },
        { label: "Net Speed", value: `${result.netSpeed || 0}wpm`, label2: "Accuracy", value2: `${result.accuracy || 0}%` },
      ],
      finalResultNote: `${result.finalResult || "Fail"} (Minimum Passing Net Speed of 30 Word per Minute)`,
      isPassed: String(result.finalResult || "").toLowerCase().includes("pass"),
      errors: result.errors || [],
      remarks: result.remarks || "",
      footerQueryTitle: "For Queries about Skill Test Result",
      footerCriteriaTitle: "Skill Test Qualifying Criteria",
      footerLeftLines: [
        "INCHARGE Skill Test",
        "Website MPCPCT.Com",
        "Email:mpcpct111@gmail.com",
      ],
      footerRightLines: [
        "Minimum Net Speed: 30 WPM",
        "Accuracy is calculated from typed words",
      ],
      pdfFilePrefix: "Skill-Test",
      homeLink: "/skill_test",
    },
  };
}

async function loadFromLearningWord() {
  const raw =
    typeof window !== "undefined"
      ? sessionStorage.getItem("learningWordResult")
      : null;
  if (!raw) {
    return { ok: false, error: "No learning result found", homeLink: "/learning" };
  }

  const result = JSON.parse(raw);
  const { userName, userProfileUrl } = await loadUserBasics();
  const displayName =
    result.userName && result.userName !== "User" ? result.userName : userName;

  return {
    ok: true,
    data: {
      userName: displayName,
      userProfileUrl,
      subjectName: result.lessonTitle || "Word Typing Lesson",
      examSubtitle: "Learning - Word Typing Lesson",
      resultDate: result.resultDate || new Date().toLocaleString(),
      testLanguage: `${result.language || "English"}${result.subLanguage ? ` (${result.subLanguage})` : ""}`,
      mode: "typing",
      typingMetrics: [
        { label: "Gross Speed", value: `${result.grossSpeed || 0}wpm`, label2: "Total Type Word", value2: String(result.totalWords || 0) },
        { label: "Correct Word", value: String(result.correctWords || 0), label2: "Wrong Words", value2: String(result.wrongWords || 0) },
        { label: "Net Speed", value: `${result.netSpeed || 0}wpm`, label2: "Accuracy", value2: `${result.accuracy || 0}%` },
      ],
      finalResultNote: `${result.finalResult || "Fail"} (Minimum Net Speed of 10 WPM to unlock next word lesson)`,
      isPassed: String(result.finalResult || "").toLowerCase().includes("pass"),
      footerQueryTitle: "For Queries about Learning Result",
      footerCriteriaTitle: "Learning Qualifying Criteria",
      footerLeftLines: [
        "INCHARGE Learning Section",
        "Website MPCPCT.Com",
        "Email:mpcpct111@gmail.com",
      ],
      footerRightLines: [
        "Minimum Net Speed: 10 WPM",
        "Complete lesson to unlock next level",
      ],
      pdfFilePrefix: "Learning-Word",
      homeLink: "/learning",
    },
  };
}

async function loadFromLearningRe() {
  const raw =
    typeof window !== "undefined"
      ? localStorage.getItem("learningResult")
      : null;
  if (!raw) {
    return { ok: false, error: "No learning result found", homeLink: "/keyboard" };
  }

  const result = JSON.parse(raw);
  const { userName, userProfileUrl } = await loadUserBasics();
  const durationMin = result.timeDuration
    ? `${Math.floor(result.timeDuration / 60)}:${String(result.timeDuration % 60).padStart(2, "0")}`
    : "";

  return {
    ok: true,
    data: {
      userName: result.userName || userName,
      userProfileUrl,
      subjectName: result.exerciseName || "Learning Exercise",
      examSubtitle: "Learning Section",
      resultDate: result.resultDate
        ? `${result.resultDate} ${result.resultTime || ""}`.trim()
        : new Date().toLocaleDateString(),
      timeDuration: durationMin,
      testLanguage: result.language || "English/Hindi",
      mode: "typing-simple",
      typingSimpleMetrics: [
        { label: "Gross Speed", value: `${result.grossSpeed || 0}wpm` },
        { label: "Accuracy", value: `${result.accuracy || 0}%` },
        { label: "Net Speed", value: `${result.netSpeed || 0}wpm` },
      ],
      isPassed: (result.netSpeed || 0) >= 10,
      learningReData: result,
      footerQueryTitle: "For Queries about Learning Result",
      footerCriteriaTitle: "Learning Qualifying Criteria",
      footerLeftLines: [
        "INCHARGE Learning Section",
        "Website MPCPCT.Com",
        "Email:mpcpct111@gmail.com",
      ],
      footerRightLines: [
        "Practice difficult keys to improve speed",
        "Minimum Net Speed: 10 WPM recommended",
      ],
      pdfFilePrefix: "Learning",
      homeLink: "/keyboard",
    },
  };
}

/** Load unified result data for the dynamic CCC-style certificate page */
export async function loadDynamicResult(options = {}) {
  const source = options.source || "";
  const resultId = options.resultId || null;

  try {
    if (source === "skill") {
      return await loadFromSkillResult(resultId);
    }
    if (source === "learning-word") {
      return await loadFromLearningWord();
    }
    if (source === "learning-re") {
      return await loadFromLearningRe();
    }
    if (source === "topic") {
      const topicId = localStorage.getItem("currentTopicId");
      if (!topicId) return { ok: false, error: "No topic exam found" };
      return await loadFromTopicId(topicId);
    }

    const profileResultDataStr = localStorage.getItem("profileResultData");
    if (profileResultDataStr && source !== "exam") {
      try {
        const profileResult = JSON.parse(profileResultDataStr);
        const loaded = await loadFromProfileResult(profileResult);
        localStorage.removeItem("profileResultData");
        return loaded;
      } catch (e) {
        console.error("Error parsing profile result data:", e);
      }
    }

    const topicId = localStorage.getItem("currentTopicId");
    if ((source === "topic" || (!source && topicId && !localStorage.getItem("currentExamId")))) {
      if (topicId) return await loadFromTopicId(topicId);
    }

    const examId = localStorage.getItem("currentExamId");
    if (examId) {
      const examRes = await fetch(`/api/exam-questions?examId=${examId}`);
      if (examRes.ok) {
        const examJson = await examRes.json();
        const examKey = examJson?.data?.exam?.key;
        if (examKey === "CPCT") {
          return { ok: false, error: "cpct_redirect", redirect: "/result/score-card" };
        }
      }
      return await loadFromExamId(examId);
    }

    return { ok: false, error: "No result data found", homeLink: "/" };
  } catch (error) {
    console.error("loadDynamicResult error:", error);
    return { ok: false, error: "Failed to load result" };
  }
}
