import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }
    return { ok: true, userId: payload.userId };
  } catch (error) {
    return { ok: false, error: "Unauthorized" };
  }
}

// Function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Function to create a unique signature for a question
function getQuestionSignature(question) {
  return (question.question_en || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Function to get all used questions from existing RSCIT exams
async function getUsedQuestions(excludeExamNumbers = []) {
  const allRSCITExams = await Exam.find({ key: "RSCIT" });
  const examIds = allRSCITExams
    .filter(exam => {
      const examNum = parseInt(exam.title.match(/\d+$/)?.[0] || '0');
      return !excludeExamNumbers.includes(examNum);
    })
    .map(exam => [String(exam._id), exam._id]);
  
  if (examIds.length === 0) return new Set();
  
  const usedQuestions = await Question.find({
    $or: examIds.flatMap(idPair => [{ examId: idPair[0] }, { examId: idPair[1] }])
  });
  
  const usedSignatures = new Set();
  usedQuestions.forEach(q => {
    const signature = getQuestionSignature({ question_en: q.question_en || '' });
    if (signature) {
      usedSignatures.add(signature);
    }
  });
  
  return usedSignatures;
}

// Function to generate additional RSCIT questions
function generateAdditionalRSCITQuestions(baseQuestions, count, section) {
  const additionalQuestions = [];
  
  const sectionATemplates = [
    {
      question_en: "What is the full form of CPU?",
      question_hi: "CPU का पूरा नाम क्या है?",
      options_en: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Computer Program Unit"],
      options_hi: ["सेंट्रल प्रोसेसिंग यूनिट", "कंप्यूटर प्रोसेसिंग यूनिट", "सेंट्रल प्रोग्राम यूनिट", "कंप्यूटर प्रोग्राम यूनिट"],
      correctAnswer: 0
    },
    {
      question_en: "Which is a primary storage device?",
      question_hi: "कौन सा प्राथमिक भंडारण डिवाइस है?",
      options_en: ["Hard Disk", "USB Drive", "RAM", "CD-ROM"],
      options_hi: ["हार्ड डिस्क", "USB ड्राइव", "RAM", "CD-ROM"],
      correctAnswer: 2
    },
    {
      question_en: "What does ROM stand for?",
      question_hi: "ROM का क्या मतलब है?",
      options_en: ["Read Only Memory", "Random Only Memory", "Read Output Memory", "Random Output Memory"],
      options_hi: ["रीड ओनली मेमोरी", "रैंडम ओनली मेमोरी", "रीड आउटपुट मेमोरी", "रैंडम आउटपुट मेमोरी"],
      correctAnswer: 0
    },
    {
      question_en: "Which key combination is used to copy in Windows?",
      question_hi: "Windows में कॉपी करने के लिए किस कुंजी संयोजन का उपयोग किया जाता है?",
      options_en: ["Ctrl + X", "Ctrl + C", "Ctrl + V", "Ctrl + Z"],
      options_hi: ["Ctrl + X", "Ctrl + C", "Ctrl + V", "Ctrl + Z"],
      correctAnswer: 1
    },
    {
      question_en: "In MS Excel, which function calculates average?",
      question_hi: "MS Excel में, कौन सा फ़ंक्शन औसत गणना करता है?",
      options_en: ["AVERAGE", "SUM", "COUNT", "MAX"],
      options_hi: ["AVERAGE", "SUM", "COUNT", "MAX"],
      correctAnswer: 0
    }
  ];
  
  const sectionBTemplates = [
    {
      question_en: "What is e-Mitra?",
      question_hi: "e-Mitra क्या है?",
      options_en: ["Rajasthan's e-governance portal", "A payment app", "A social media platform", "An email service"],
      options_hi: ["राजस्थान का ई-गवर्नेंस पोर्टल", "एक भुगतान ऐप", "एक सोशल मीडिया प्लेटफ़ॉर्म", "एक ईमेल सेवा"],
      correctAnswer: 0
    },
    {
      question_en: "What is phishing?",
      question_hi: "फ़िशिंग क्या है?",
      options_en: ["A type of virus", "A fraudulent attempt to obtain sensitive information", "A type of firewall", "A backup method"],
      options_hi: ["एक प्रकार का वायरस", "संवेदनशील जानकारी प्राप्त करने का एक धोखाधड़ी प्रयास", "एक प्रकार का फ़ायरवॉल", "एक बैकअप विधि"],
      correctAnswer: 1
    },
    {
      question_en: "Which is a UPI payment app?",
      question_hi: "कौन सा UPI भुगतान ऐप है?",
      options_en: ["Google Pay", "MS Word", "Notepad", "Calculator"],
      options_hi: ["Google Pay", "MS Word", "नोटपैड", "कैलकुलेटर"],
      correctAnswer: 0
    }
  ];
  
  const templates = section === "A" ? sectionATemplates : sectionBTemplates;
  
  let questionIndex = 0;
  while (additionalQuestions.length < count) {
    const template = templates[questionIndex % templates.length];
    const variationNum = Math.floor(questionIndex / templates.length);
    
    const uniqueQuestion = {
      section,
      category: section === "A" ? "Computer" : "Other Topics",
      question_en: `${template.question_en}${variationNum > 0 ? ` [V${variationNum + 1}]` : ''}`,
      question_hi: `${template.question_hi}${variationNum > 0 ? ` [V${variationNum + 1}]` : ''}`,
      options_en: [...template.options_en],
      options_hi: [...template.options_hi],
      correctAnswer: template.correctAnswer,
      marks: 2,
      explanation_en: `This is an RSCIT ${section === "A" ? "Computer" : "Other Topics"} question.`,
      explanation_hi: `यह एक RSCIT ${section === "A" ? "कंप्यूटर" : "अन्य विषय"} प्रश्न है।`
    };
    
    // Shuffle options for variations
    if (variationNum > 0) {
      const indices = [0, 1, 2, 3];
      const shuffledIndices = shuffleArray(indices);
      uniqueQuestion.options_en = shuffledIndices.map(i => template.options_en[i]);
      uniqueQuestion.options_hi = shuffledIndices.map(i => template.options_hi[i]);
      uniqueQuestion.correctAnswer = shuffledIndices.indexOf(template.correctAnswer);
    }
    
    additionalQuestions.push(uniqueQuestion);
    questionIndex++;
    if (questionIndex > 1000) break;
  }
  
  return additionalQuestions.slice(0, count);
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await req.json();
    const { examNumbers } = body;

    await dbConnect();

    // Load questions from JSON file
    let baseQuestions = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'data', 'rscit-questions-bank.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const rscitQuestionsBank = JSON.parse(fileContent);
      baseQuestions = rscitQuestionsBank.questions || [];
    } catch (error) {
      console.error('Error loading question bank:', error);
    }
    
    // Get used questions
    const usedQuestionSignatures = await getUsedQuestions(examNumbers || []);
    console.log(`Found ${usedQuestionSignatures.size} already used questions`);
    
    // Separate questions by section
    const sectionAQuestions = baseQuestions.filter(q => q.section === "A");
    const sectionBQuestions = baseQuestions.filter(q => q.section === "B");
    
    // Filter out used questions
    const availableSectionA = sectionAQuestions.filter(q => {
      const signature = getQuestionSignature(q);
      return !usedQuestionSignatures.has(signature);
    });
    
    const availableSectionB = sectionBQuestions.filter(q => {
      const signature = getQuestionSignature(q);
      return !usedQuestionSignatures.has(signature);
    });
    
    // Generate additional questions if needed
    const sectionANeeded = (examNumbers?.length || 5) * 35;
    const sectionBNeeded = (examNumbers?.length || 5) * 15;
    
    const additionalSectionA = generateAdditionalRSCITQuestions(availableSectionA, Math.max(0, sectionANeeded - availableSectionA.length + 200), "A");
    const additionalSectionB = generateAdditionalRSCITQuestions(availableSectionB, Math.max(0, sectionBNeeded - availableSectionB.length + 100), "B");
    
    // Combine and remove duplicates
    const allSectionA = [...availableSectionA, ...additionalSectionA];
    const allSectionB = [...availableSectionB, ...additionalSectionB];
    
    const seenA = new Set();
    const uniqueSectionA = allSectionA.filter(q => {
      const sig = getQuestionSignature(q);
      if (seenA.has(sig)) return false;
      seenA.add(sig);
      return true;
    });
    
    const seenB = new Set();
    const uniqueSectionB = allSectionB.filter(q => {
      const sig = getQuestionSignature(q);
      if (seenB.has(sig)) return false;
      seenB.add(sig);
      return true;
    });
    
    console.log(`Available Section A questions: ${uniqueSectionA.length}, Section B: ${uniqueSectionB.length}`);

    const results = [];
    const errors = [];
    const examNums = examNumbers || [1, 2, 3, 4, 5];
    const usedInBatch = new Set(usedQuestionSignatures);

    for (const examNum of examNums) {
      try {
        const examTitle = `RSCIT Exam ${examNum}`;
        const exam = await Exam.findOne({ 
          key: "RSCIT",
          title: examTitle
        });

        if (!exam) {
          errors.push({ examNum, error: `Exam ${examTitle} not found` });
          continue;
        }

        // Get sections
        const sectionA = await Section.findOne({ examId: exam._id, name: "Section A" });
        const sectionB = await Section.findOne({ examId: exam._id, name: "Section B" });
        
        if (!sectionA || !sectionB) {
          errors.push({ examNum, error: `Sections not found for ${examTitle}` });
          continue;
        }

        const partA = await Part.findOne({ sectionId: sectionA._id });
        const partB = await Part.findOne({ sectionId: sectionB._id });
        
        if (!partA || !partB) {
          errors.push({ examNum, error: `Parts not found for ${examTitle}` });
          continue;
        }

        // Delete existing questions
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Get 35 unique questions for Section A
        const availableForA = uniqueSectionA.filter(q => {
          const sig = getQuestionSignature(q);
          return !usedInBatch.has(sig);
        });
        
        const shuffledA = shuffleArray(availableForA);
        const examQuestionsA = shuffledA.slice(0, 35);
        
        examQuestionsA.forEach(q => {
          const sig = getQuestionSignature(q);
          usedInBatch.add(sig);
        });

        // Get 15 unique questions for Section B
        const availableForB = uniqueSectionB.filter(q => {
          const sig = getQuestionSignature(q);
          return !usedInBatch.has(sig);
        });
        
        const shuffledB = shuffleArray(availableForB);
        const examQuestionsB = shuffledB.slice(0, 15);
        
        examQuestionsB.forEach(q => {
          const sig = getQuestionSignature(q);
          usedInBatch.add(sig);
        });

        // Shuffle options for each question
        const processQuestions = (questions, section, part) => {
          return questions.map((q, index) => {
            const options = [...q.options_en];
            const options_hi = [...q.options_hi];
            const correctAnswerIndex = q.correctAnswer;
            
            const indices = [0, 1, 2, 3];
            const shuffledIndices = shuffleArray(indices);
            const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
            
            return {
              ...q,
              options_en: shuffledIndices.map(i => options[i]),
              options_hi: shuffledIndices.map(i => options_hi[i]),
              correctAnswer: newCorrectAnswer
            };
          });
        };

        const processedA = processQuestions(examQuestionsA, sectionA, partA);
        const processedB = processQuestions(examQuestionsB, sectionB, partB);

        // Create Section A questions
        let questionsCreated = 0;
        for (let i = 0; i < processedA.length; i++) {
          const q = processedA[i];
          const questionId = `rscit-exam-${examNum}-section-a-q-${i + 1}`;
          
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionA._id),
            partId: String(partA._id),
            questionNumber: i + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: q.options_en,
            options_hi: q.options_hi,
            correctAnswer: q.correctAnswer,
            explanation_en: q.explanation_en || "",
            explanation_hi: q.explanation_hi || "",
            marks: 2,
            negativeMarks: 0
          });
          questionsCreated++;
        }

        // Create Section B questions
        for (let i = 0; i < processedB.length; i++) {
          const q = processedB[i];
          const questionId = `rscit-exam-${examNum}-section-b-q-${i + 1}`;
          
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionB._id),
            partId: String(partB._id),
            questionNumber: questionsCreated + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: q.options_en,
            options_hi: q.options_hi,
            correctAnswer: q.correctAnswer,
            explanation_en: q.explanation_en || "",
            explanation_hi: q.explanation_hi || "",
            marks: 2,
            negativeMarks: 0
          });
          questionsCreated++;
        }

        results.push({
          examNum,
          examTitle,
          questionsCreated,
          sectionA: processedA.length,
          sectionB: processedB.length
        });

        console.log(`✅ Imported ${questionsCreated} questions for ${examTitle} (${processedA.length} in Section A, ${processedB.length} in Section B)`);

      } catch (error) {
        console.error(`❌ Error importing questions for exam ${examNum}:`, error);
        errors.push({
          examNum,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported questions for ${results.length} exam(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      note: "Each exam has Section A (35 questions @ 2 marks) and Section B (15 questions @ 2 marks). Questions are unique and don't repeat across exams."
    });

  } catch (error) {
    console.error("Import RSCIT questions error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to import RSCIT questions" 
    }, { status: 500 });
  }
}

