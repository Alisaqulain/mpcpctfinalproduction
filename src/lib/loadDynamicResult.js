import { normalizePassingConfig } from "@/lib/examPassingCriteria";
import { formatResultDateDDMM } from "@/lib/formatResultDate";
import {
  fetchUserProfileFromApi,
  mergeExamUserProfile,
  readExamUserDataFromStorage,
  resolveUserProfileUrl,
  resolveUserRollNo,
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

const EXAM_FOOTER_LEFT = [
  "INCHARGE Examination",
  "Website MPCPCT.Com",
  "Add:A.B Road SJR 465001(M.P.)",
  "Email:mpcpct111@gmail.com",
];

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
  testLanguage,
  homeLink,
}) {
  return {
    userName,
    userProfileUrl,
    subjectName,
    examSubtitle,
    resultDate: resultDate || new Date().toLocaleDateString(),
    timeDuration: timeDuration || "",
    testLanguage: testLanguage || "",
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
    footerLeftLines: EXAM_FOOTER_LEFT,
    footerRightLines: footerCriteriaLines || [
      `Total Questions: ${totalMax}`,
      "Minimum Passing Marks: 50% of total marks",
    ],
    pdfFilePrefix: subjectName.replace(/\s+/g, "-"),
    homeLink: homeLink || "/",
  };
}

/** CPCT-style score card for Learning & Skill results */
function buildScoreCardPayload({
  userName,
  userProfileUrl,
  rollNo,
  subjectName,
  resultDate,
  columns,
  totalScore,
  totalMax,
  isPassed,
  pdfFilePrefix,
  homeLink,
  learningReData,
  variant,
  typingSimpleMetrics,
  typingMetrics,
  finalResultNote,
  footerQueryTitle,
  footerCriteriaTitle,
  footerLeftLines,
  footerRightLines,
  errors,
  remarks,
}) {
  return {
    layout: "score-card",
    userName,
    userProfileUrl,
    rollNo: rollNo || "-------",
    subjectName,
    resultDate: formatResultDateDDMM(resultDate),
    publicationDate: formatResultDateDDMM(null),
    columns,
    totalScore,
    totalMax,
    isPassed,
    pdfFilePrefix: pdfFilePrefix || subjectName.replace(/\s+/g, "-"),
    homeLink: homeLink || "/",
    learningReData,
    variant: variant || (learningReData ? "learning-re" : "score-card"),
    typingSimpleMetrics: typingSimpleMetrics || [],
    typingMetrics: typingMetrics || [],
    finalResultNote: finalResultNote || "",
    footerQueryTitle,
    footerCriteriaTitle,
    footerLeftLines: footerLeftLines || [],
    footerRightLines: footerRightLines || [],
    errors: errors || [],
    remarks: remarks || "",
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
  const rollNo = resolveUserRollNo(mergedUser);
  return { userName, userProfileUrl, rollNo };
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

  let data;
  try {
    const res = await fetch(`/api/typing-results?resultId=${encodeURIComponent(id)}`);
    data = await res.json();
    if (!res.ok || !data.success || !data.result) {
      return {
        ok: false,
        error: data.error || "Result not found",
        homeLink: "/skill_test",
      };
    }
  } catch {
    return { ok: false, error: "Failed to load skill test result", homeLink: "/skill_test" };
  }

  const result = data.result;
  const { userName, userProfileUrl, rollNo } = await loadUserBasics();

  const netSpeed = result.netSpeed || 0;
  const isPassed = String(result.finalResult || "").toLowerCase().includes("pass");
  const grossSpeed = result.grossSpeed || 0;
  const accuracy = Number(result.accuracy) || 0;

  return {
    ok: true,
    data: buildScoreCardPayload({
      userName,
      userProfileUrl,
      rollNo,
      subjectName: result.exerciseName || "Skill Test",
      resultDate: result.submittedAt || null,
      variant: "skill",
      typingMetrics: [
        {
          label: "Gross Speed",
          value: `${grossSpeed}wpm`,
          label2: "Total Type Word",
          value2: result.totalWords || 0,
        },
        {
          label: "Correct Word",
          value: result.correctWords || 0,
          label2: "Wrong Words",
          value2: result.wrongWords || 0,
        },
        {
          label: "Net Speed",
          value: `${netSpeed}wpm`,
          label2: "Accuracy",
          value2: `${accuracy}%`,
        },
      ],
      finalResultNote: isPassed
        ? "PASS"
        : "FAIL (Minimum Passing Net Speed of 30 Word per Minute)",
      totalScore: netSpeed,
      totalMax: 30,
      isPassed,
      pdfFilePrefix: "Skill-Test",
      homeLink: "/skill_test",
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
    }),
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
  const { userName, userProfileUrl, rollNo } = await loadUserBasics();

  const netSpeed = result.netSpeed || 0;
  const isPassed = String(result.finalResult || "").toLowerCase().includes("pass");
  const grossSpeed = result.grossSpeed || 0;
  const accuracy = Number(result.accuracy) || 0;
  const minNetSpeed = 10;

  return {
    ok: true,
    data: buildScoreCardPayload({
      userName,
      userProfileUrl,
      rollNo,
      subjectName: result.sectionName || result.lessonTitle || "Word Typing Lesson",
      resultDate: result.resultDate || null,
      variant: "skill",
      typingMetrics: [
        {
          label: "Gross Speed",
          value: `${grossSpeed}wpm`,
          label2: "Total Type Word",
          value2: result.totalWords || 0,
        },
        {
          label: "Correct Word",
          value: result.correctWords || 0,
          label2: "Wrong Words",
          value2: result.wrongWords || 0,
        },
        {
          label: "Net Speed",
          value: `${netSpeed}wpm`,
          label2: "Accuracy",
          value2: `${accuracy}%`,
        },
      ],
      finalResultNote: isPassed
        ? "PASS"
        : `FAIL (Minimum Passing Net Speed of ${minNetSpeed} Word per Minute)`,
      totalScore: netSpeed,
      totalMax: minNetSpeed,
      isPassed,
      pdfFilePrefix: "Learning-Word",
      homeLink: "/learning",
      errors: result.errors || [],
      remarks: result.remarks || "",
      footerQueryTitle: "For Queries about Learning Word Result",
      footerCriteriaTitle: "Learning Word Qualifying Criteria",
      footerLeftLines: [
        "INCHARGE Learning Section",
        "Website MPCPCT.Com",
        "Email:mpcpct111@gmail.com",
      ],
      footerRightLines: [
        `Minimum Net Speed: ${minNetSpeed} WPM`,
        "Accuracy is calculated from typed words",
        "Complete lesson to unlock next level",
      ],
    }),
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
  const { userName, userProfileUrl, rollNo } = await loadUserBasics();

  const netSpeed = result.netSpeed || 0;
  const isPassed = netSpeed >= 10;
  const grossSpeed = result.grossSpeed || 0;
  const accuracy = result.accuracy || 0;

  return {
    ok: true,
    data: buildScoreCardPayload({
      userName,
      userProfileUrl,
      rollNo,
      subjectName: result.sectionName || result.exerciseName || "Learning Exercise",
      resultDate: result.resultDate || null,
      variant: "learning-re",
      typingSimpleMetrics: [
        { label: "Gross Speed", value: `${grossSpeed}wpm` },
        { label: "Accuracy", value: `${accuracy}%` },
        { label: "Net Speed", value: `${netSpeed}wpm` },
      ],
      totalScore: netSpeed,
      totalMax: 10,
      isPassed,
      pdfFilePrefix: "Learning",
      homeLink: "/keyboard",
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
    }),
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
