import cpctQuestions from '../data/examQuestions.json';
import rscitQuestions from '../data/examQuestions_rscit.json';
import cccQuestions from '../data/examQuestions_ccc.json';

const getExamType = () => {
  try {
    if (typeof window !== 'undefined') {
      const fromStorage = localStorage.getItem('examType');
      if (fromStorage) return fromStorage;
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      if (type) return type.toUpperCase();
    }
  } catch {}
  return 'CPCT';
};

const datasets = {
  CPCT: cpctQuestions,
  RSCIT: rscitQuestions,
  CCC: cccQuestions,
};

const pickDataset = () => {
  const type = getExamType();
  return datasets[type] || cpctQuestions;
};

// Get all exam questions
export const getExamQuestions = (examType = null) => {
  if (examType) {
    return datasets[examType.toUpperCase()] || cpctQuestions;
  }
  return pickDataset();
};

// Get questions for a specific section
export const getQuestionsBySection = (sectionName) => {
  const data = pickDataset();
  return data.questions[sectionName] || [];
};

// Get all sections
export const getExamSections = () => pickDataset().examInfo.sections;

// Get exam info
export const getExamInfo = () => pickDataset().examInfo;

// Get total questions count
export const getTotalQuestions = () => pickDataset().examInfo.totalQuestions;

// Get total time
export const getTotalTime = () => pickDataset().examInfo.totalTime;

// Get question by ID
export const getQuestionById = (questionId) => {
  const data = pickDataset();
  for (const section of Object.values(data.questions)) {
    const question = section.find(q => q.id === questionId);
    if (question) return question;
  }
  return null;
};

// Get section name by question ID
export const getSectionByQuestionId = (questionId) => {
  const data = pickDataset();
  for (const [sectionName, questions] of Object.entries(data.questions)) {
    const question = questions.find(q => q.id === questionId);
    if (question) return sectionName;
  }
  return null;
};

// Get question index in section
export const getQuestionIndexInSection = (sectionName, questionId) => {
  const questions = getQuestionsBySection(sectionName);
  return questions.findIndex(q => q.id === questionId);
};

// Get next question
export const getNextQuestion = (currentSection, currentQuestionId) => {
  const questions = getQuestionsBySection(currentSection);
  const currentIndex = getQuestionIndexInSection(currentSection, currentQuestionId);
  
  if (currentIndex < questions.length - 1) {
    return questions[currentIndex + 1];
  }
  
  // Move to next section
  const sections = getExamSections();
  const currentSectionIndex = sections.indexOf(currentSection);
  
  if (currentSectionIndex < sections.length - 1) {
    const nextSection = sections[currentSectionIndex + 1];
    const nextSectionQuestions = getQuestionsBySection(nextSection);
    return nextSectionQuestions[0] || null;
  }
  
  return null; // End of exam
};

// Get previous question
export const getPreviousQuestion = (currentSection, currentQuestionId) => {
  const questions = getQuestionsBySection(currentSection);
  const currentIndex = getQuestionIndexInSection(currentSection, currentQuestionId);
  
  if (currentIndex > 0) {
    return questions[currentIndex - 1];
  }
  
  // Move to previous section
  const sections = getExamSections();
  const currentSectionIndex = sections.indexOf(currentSection);
  
  if (currentSectionIndex > 0) {
    const prevSection = sections[currentSectionIndex - 1];
    const prevSectionQuestions = getQuestionsBySection(prevSection);
    return prevSectionQuestions[prevSectionQuestions.length - 1] || null;
  }
  
  return null; // Beginning of exam
};

// Calculate score
export const calculateScore = (answers) => {
  let correct = 0;
  let total = 0;
  
  for (const [questionId, answer] of Object.entries(answers)) {
    const question = getQuestionById(questionId);
    if (question && answer !== null) {
      total++;
      if (answer === question.correctAnswer) {
        correct++;
      }
    }
  }
  
  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0
  };
};

// Get section statistics
export const getSectionStats = (answers) => {
  const stats = {};
  const sections = getExamSections();
  
  sections.forEach(section => {
    const questions = getQuestionsBySection(section);
    let answered = 0;
    let correct = 0;
    
    questions.forEach(question => {
      if (answers[question.id] !== null && answers[question.id] !== undefined) {
        answered++;
        if (answers[question.id] === question.correctAnswer) {
          correct++;
        }
      }
    });
    
    stats[section] = {
      total: questions.length,
      answered,
      correct,
      unanswered: questions.length - answered,
      percentage: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    };
  });
  
  return stats;
};
