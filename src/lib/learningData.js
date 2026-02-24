import learningData from '../data/learningData.json';

// Load all learning data
export const getLearningData = () => learningData;

// Get specific sections
export const getSections = () => learningData.sections;

// Get a specific section by ID
export const getSectionById = (sectionId) => {
  return learningData.sections.find(section => section.id === sectionId);
};

// Get languages
export const getLanguages = () => learningData.languages;

// Get settings
export const getSettings = () => learningData.settings;

// Get lessons for a specific section
export const getLessonsBySection = (sectionId) => {
  const section = getSectionById(sectionId);
  return section ? section.lessons : [];
};

// Get a specific lesson
export const getLessonById = (lessonId) => {
  for (const section of learningData.sections) {
    const lesson = section.lessons.find(lesson => lesson.id === lessonId);
    if (lesson) {
      return {
        ...lesson,
        section: section.name,
        sectionId: section.id
      };
    }
  }
  return null;
};

// Get lesson content based on language and script
export const getLessonContent = (lesson, language, subLanguage = null) => {
  if (!lesson || !lesson.content) {
    return null;
  }

  // Determine content key based on language and sub-language
  let contentKey = 'english'; // default

  if (language === 'hindi') {
    if (subLanguage === 'ramington') {
      contentKey = 'hindi_ramington';
    } else if (subLanguage === 'inscript') {
      contentKey = 'hindi_inscript';
    } else {
      // Default to ramington if no sub-language specified
      contentKey = 'hindi_ramington';
    }
  }

  const content = lesson.content[contentKey] || lesson.content.english;
  
  // Add script indicator to show the difference
  if (language === 'hindi' && subLanguage) {
    const scriptIndicator = subLanguage === 'ramington' ? '[Ramington Gail] ' : '[Inscript] ';
    return scriptIndicator + content;
  }

  return content;
};

// Get lessons by difficulty
export const getLessonsByDifficulty = (difficulty) => {
  const lessons = [];
  learningData.sections.forEach(section => {
    section.lessons.forEach(lesson => {
      if (lesson.difficulty === difficulty) {
        lessons.push({
          ...lesson,
          section: section.name,
          sectionId: section.id
        });
      }
    });
  });
  return lessons;
};

// Get progress statistics
export const getProgressStats = () => {
  const totalLessons = learningData.metadata.totalLessons;
  const totalTime = learningData.metadata.estimatedTotalTime;
  const difficultyBreakdown = {};
  
  learningData.sections.forEach(section => {
    section.lessons.forEach(lesson => {
      difficultyBreakdown[lesson.difficulty] = (difficultyBreakdown[lesson.difficulty] || 0) + 1;
    });
  });

  return {
    totalLessons,
    totalTime,
    difficultyBreakdown,
    sections: learningData.sections.length
  };
};

// Search lessons
export const searchLessons = (query) => {
  const results = [];
  const searchTerm = query.toLowerCase();
  
  learningData.sections.forEach(section => {
    section.lessons.forEach(lesson => {
      if (
        lesson.title.toLowerCase().includes(searchTerm) ||
        lesson.description.toLowerCase().includes(searchTerm) ||
        lesson.difficulty.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          ...lesson,
          section: section.name,
          sectionId: section.id
        });
      }
    });
  });
  
  return results;
};

// Get recommended lessons based on user progress
export const getRecommendedLessons = (completedLessons = []) => {
  const recommendations = [];
  
  // Find the next lesson in each section
  learningData.sections.forEach(section => {
    const sectionCompletedLessons = completedLessons.filter(lessonId => 
      section.lessons.some(lesson => lesson.id === lessonId)
    );
    
    if (sectionCompletedLessons.length < section.lessons.length) {
      // Find the next uncompleted lesson
      const nextLesson = section.lessons.find(lesson => 
        !completedLessons.includes(lesson.id)
      );
      
      if (nextLesson) {
        recommendations.push({
          ...nextLesson,
          section: section.name,
          sectionId: section.id,
          priority: sectionCompletedLessons.length === 0 ? 'high' : 'medium'
        });
      }
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Get available languages and sub-languages
export const getAvailableLanguages = () => {
  return learningData.languages.main.map(lang => ({
    id: lang.id,
    name: lang.name,
    subLanguages: lang.subLanguages || []
  }));
};

// Validate language and sub-language combination
export const validateLanguageSelection = (language, subLanguage = null) => {
  const lang = learningData.languages.main.find(l => l.id === language);
  if (!lang) return false;
  
  if (subLanguage && lang.subLanguages) {
    return lang.subLanguages.some(sub => sub.id === subLanguage);
  }
  
  return true;
};

export default learningData;
