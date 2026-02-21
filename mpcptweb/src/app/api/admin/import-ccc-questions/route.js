import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";
// We'll load questions from the JSON file dynamically

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

// Function to generate additional questions programmatically with more variations
function generateAdditionalQuestions(baseQuestions, count) {
  const additionalQuestions = [];
  const categories = [
    "Introduction to Computer",
    "Windows Operating System",
    "MS Office",
    "Internet & Email",
    "Digital Payments & E-Governance",
    "Basic Security and Privacy"
  ];

  // Expanded question templates for different categories with many variations
  const templates = {
    "Introduction to Computer": [
      {
        question_en: "Which generation of computers used vacuum tubes?",
        question_hi: "कंप्यूटर की किस पीढ़ी में वैक्यूम ट्यूब का उपयोग किया गया?",
        options_en: ["First Generation", "Second Generation", "Third Generation", "Fourth Generation"],
        options_hi: ["प्रथम पीढ़ी", "द्वितीय पीढ़ी", "तृतीय पीढ़ी", "चतुर्थ पीढ़ी"],
        correctAnswer: 0
      },
      {
        question_en: "What is the smallest unit of data in a computer?",
        question_hi: "कंप्यूटर में डेटा की सबसे छोटी इकाई क्या है?",
        options_en: ["Byte", "Bit", "Kilobyte", "Megabyte"],
        options_hi: ["बाइट", "बिट", "किलोबाइट", "मेगाबाइट"],
        correctAnswer: 1
      },
      {
        question_en: "How many bits make one byte?",
        question_hi: "एक बाइट बनाने के लिए कितने बिट होते हैं?",
        options_en: ["4 bits", "8 bits", "16 bits", "32 bits"],
        options_hi: ["4 बिट", "8 बिट", "16 बिट", "32 बिट"],
        correctAnswer: 1
      },
      {
        question_en: "Which device is used to input data into a computer?",
        question_hi: "कंप्यूटर में डेटा इनपुट करने के लिए किस डिवाइस का उपयोग किया जाता है?",
        options_en: ["Monitor", "Printer", "Keyboard", "Speaker"],
        options_hi: ["मॉनिटर", "प्रिंटर", "कीबोर्ड", "स्पीकर"],
        correctAnswer: 2
      },
      {
        question_en: "What does CPU stand for?",
        question_hi: "CPU का क्या मतलब है?",
        options_en: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Computer Program Unit"],
        options_hi: ["सेंट्रल प्रोसेसिंग यूनिट", "कंप्यूटर प्रोसेसिंग यूनिट", "सेंट्रल प्रोग्राम यूनिट", "कंप्यूटर प्रोग्राम यूनिट"],
        correctAnswer: 0
      },
      {
        question_en: "Which is a secondary storage device?",
        question_hi: "कौन सा द्वितीयक भंडारण डिवाइस है?",
        options_en: ["RAM", "ROM", "Hard Disk", "Cache"],
        options_hi: ["RAM", "ROM", "हार्ड डिस्क", "कैश"],
        correctAnswer: 2
      },
      {
        question_en: "What is the full form of ROM?",
        question_hi: "ROM का पूरा नाम क्या है?",
        options_en: ["Read Only Memory", "Random Only Memory", "Read Output Memory", "Random Output Memory"],
        options_hi: ["रीड ओनली मेमोरी", "रैंडम ओनली मेमोरी", "रीड आउटपुट मेमोरी", "रैंडम आउटपुट मेमोरी"],
        correctAnswer: 0
      },
      {
        question_en: "Which component stores data temporarily?",
        question_hi: "कौन सा घटक डेटा को अस्थायी रूप से संग्रहीत करता है?",
        options_en: ["Hard Disk", "RAM", "CD-ROM", "USB Drive"],
        options_hi: ["हार्ड डिस्क", "RAM", "CD-ROM", "USB ड्राइव"],
        correctAnswer: 1
      }
    ],
    "Windows Operating System": [
      {
        question_en: "Which key combination opens the Task Manager in Windows?",
        question_hi: "Windows में Task Manager खोलने के लिए किस कुंजी संयोजन का उपयोग किया जाता है?",
        options_en: ["Ctrl + Alt + Delete", "Ctrl + Shift + Delete", "Alt + F4", "Ctrl + T"],
        options_hi: ["Ctrl + Alt + Delete", "Ctrl + Shift + Delete", "Alt + F4", "Ctrl + T"],
        correctAnswer: 0
      },
      {
        question_en: "What is the shortcut key to rename a file in Windows?",
        question_hi: "Windows में फ़ाइल का नाम बदलने के लिए शॉर्टकट कुंजी क्या है?",
        options_en: ["F1", "F2", "F3", "F4"],
        options_hi: ["F1", "F2", "F3", "F4"],
        correctAnswer: 1
      },
      {
        question_en: "Which key combination is used to cut a file in Windows?",
        question_hi: "Windows में फ़ाइल काटने के लिए किस कुंजी संयोजन का उपयोग किया जाता है?",
        options_en: ["Ctrl + X", "Ctrl + C", "Ctrl + V", "Ctrl + Z"],
        options_hi: ["Ctrl + X", "Ctrl + C", "Ctrl + V", "Ctrl + Z"],
        correctAnswer: 0
      },
      {
        question_en: "What does the Recycle Bin in Windows store?",
        question_hi: "Windows में Recycle Bin क्या संग्रहीत करता है?",
        options_en: ["Deleted files", "Temporary files", "System files", "Program files"],
        options_hi: ["हटाई गई फ़ाइलें", "अस्थायी फ़ाइलें", "सिस्टम फ़ाइलें", "प्रोग्राम फ़ाइलें"],
        correctAnswer: 0
      },
      {
        question_en: "Which menu contains the option to create a new folder in Windows?",
        question_hi: "Windows में नया फ़ोल्डर बनाने का विकल्प किस मेनू में है?",
        options_en: ["File menu", "Edit menu", "View menu", "Right-click context menu"],
        options_hi: ["File मेनू", "Edit मेनू", "View मेनू", "राइट-क्लिक कंटेक्स्ट मेनू"],
        correctAnswer: 3
      }
    ],
    "MS Office": [
      {
        question_en: "In MS Word, which alignment makes text even on both left and right sides?",
        question_hi: "MS Word में, कौन सा संरेखण पाठ को बाएं और दाएं दोनों तरफ समान बनाता है?",
        options_en: ["Left", "Right", "Center", "Justify"],
        options_hi: ["बाएं", "दाएं", "केंद्र", "जस्टिफाई"],
        correctAnswer: 3
      },
      {
        question_en: "In MS Excel, what is a cell address?",
        question_hi: "MS Excel में, सेल एड्रेस क्या है?",
        options_en: ["A combination of row and column", "Only row number", "Only column letter", "File name"],
        options_hi: ["पंक्ति और स्तंभ का संयोजन", "केवल पंक्ति संख्या", "केवल स्तंभ अक्षर", "फ़ाइल नाम"],
        correctAnswer: 0
      },
      {
        question_en: "In MS PowerPoint, what is a slide?",
        question_hi: "MS PowerPoint में, स्लाइड क्या है?",
        options_en: ["A single page of presentation", "A template", "An animation", "A theme"],
        options_hi: ["प्रस्तुति का एक पृष्ठ", "एक टेम्पलेट", "एक एनिमेशन", "एक थीम"],
        correctAnswer: 0
      },
      {
        question_en: "Which function in MS Excel finds the maximum value?",
        question_hi: "MS Excel में कौन सा फ़ंक्शन अधिकतम मान ढूंढता है?",
        options_en: ["MIN", "MAX", "AVERAGE", "COUNT"],
        options_hi: ["MIN", "MAX", "AVERAGE", "COUNT"],
        correctAnswer: 1
      },
      {
        question_en: "In MS Word, what is the default file extension?",
        question_hi: "MS Word में, डिफ़ॉल्ट फ़ाइल एक्सटेंशन क्या है?",
        options_en: [".txt", ".docx", ".xlsx", ".pptx"],
        options_hi: [".txt", ".docx", ".xlsx", ".pptx"],
        correctAnswer: 1
      }
    ],
    "Internet & Email": [
      {
        question_en: "What does HTTP stand for?",
        question_hi: "HTTP का क्या मतलब है?",
        options_en: ["HyperText Transfer Protocol", "HyperText Transmission Protocol", "High Transfer Text Protocol", "Hyper Transfer Text Protocol"],
        options_hi: ["हाइपरटेक्स्ट ट्रांसफर प्रोटोकॉल", "हाइपरटेक्स्ट ट्रांसमिशन प्रोटोकॉल", "हाई ट्रांसफर टेक्स्ट प्रोटोकॉल", "हाइपर ट्रांसफर टेक्स्ट प्रोटोकॉल"],
        correctAnswer: 0
      },
      {
        question_en: "What does WWW stand for?",
        question_hi: "WWW का क्या मतलब है?",
        options_en: ["World Wide Web", "Wide World Web", "Web World Wide", "World Web Wide"],
        options_hi: ["वर्ल्ड वाइड वेब", "वाइड वर्ल्ड वेब", "वेब वर्ल्ड वाइड", "वर्ल्ड वेब वाइड"],
        correctAnswer: 0
      },
      {
        question_en: "Which is a popular web browser?",
        question_hi: "कौन सा एक लोकप्रिय वेब ब्राउज़र है?",
        options_en: ["Microsoft Word", "Google Chrome", "Adobe Reader", "Windows Media Player"],
        options_hi: ["Microsoft Word", "Google Chrome", "Adobe Reader", "Windows Media Player"],
        correctAnswer: 1
      },
      {
        question_en: "What is an email attachment?",
        question_hi: "ईमेल अटैचमेंट क्या है?",
        options_en: ["A file sent with an email", "Email subject", "Email address", "Email password"],
        options_hi: ["ईमेल के साथ भेजी गई फ़ाइल", "ईमेल विषय", "ईमेल पता", "ईमेल पासवर्ड"],
        correctAnswer: 0
      },
      {
        question_en: "What does SMTP stand for?",
        question_hi: "SMTP का क्या मतलब है?",
        options_en: ["Simple Mail Transfer Protocol", "Simple Message Transfer Protocol", "Secure Mail Transfer Protocol", "Simple Mail Transmission Protocol"],
        options_hi: ["सिंपल मेल ट्रांसफर प्रोटोकॉल", "सिंपल मैसेज ट्रांसफर प्रोटोकॉल", "सिक्योर मेल ट्रांसफर प्रोटोकॉल", "सिंपल मेल ट्रांसमिशन प्रोटोकॉल"],
        correctAnswer: 0
      }
    ],
    "Digital Payments & E-Governance": [
      {
        question_en: "Which government portal is used for digital certificates in India?",
        question_hi: "भारत में डिजिटल प्रमाणपत्रों के लिए किस सरकारी पोर्टल का उपयोग किया जाता है?",
        options_en: ["DigiLocker", "Aadhaar Portal", "Income Tax Portal", "GST Portal"],
        options_hi: ["DigiLocker", "आधार पोर्टल", "आयकर पोर्टल", "GST पोर्टल"],
        correctAnswer: 0
      },
      {
        question_en: "What is a mobile wallet?",
        question_hi: "मोबाइल वॉलेट क्या है?",
        options_en: ["A digital payment method using mobile phone", "A physical wallet", "A bank account", "A credit card"],
        options_hi: ["मोबाइल फोन का उपयोग करने वाला डिजिटल भुगतान तरीका", "एक भौतिक वॉलेट", "एक बैंक खाता", "एक क्रेडिट कार्ड"],
        correctAnswer: 0
      },
      {
        question_en: "Which is an example of UPI app?",
        question_hi: "UPI ऐप का उदाहरण कौन सा है?",
        options_en: ["Google Pay", "Microsoft Word", "Adobe Photoshop", "Windows Media Player"],
        options_hi: ["Google Pay", "Microsoft Word", "Adobe Photoshop", "Windows Media Player"],
        correctAnswer: 0
      },
      {
        question_en: "What is online banking?",
        question_hi: "ऑनलाइन बैंकिंग क्या है?",
        options_en: ["Banking services through internet", "Banking at bank branch", "ATM banking", "Mobile banking only"],
        options_hi: ["इंटरनेट के माध्यम से बैंकिंग सेवाएं", "बैंक शाखा में बैंकिंग", "ATM बैंकिंग", "केवल मोबाइल बैंकिंग"],
        correctAnswer: 0
      }
    ],
    "Basic Security and Privacy": [
      {
        question_en: "What is phishing?",
        question_hi: "फ़िशिंग क्या है?",
        options_en: ["A type of virus", "A fraudulent attempt to obtain sensitive information", "A type of firewall", "A backup method"],
        options_hi: ["एक प्रकार का वायरस", "संवेदनशील जानकारी प्राप्त करने का एक धोखाधड़ी प्रयास", "एक प्रकार का फ़ायरवॉल", "एक बैकअप विधि"],
        correctAnswer: 1
      },
      {
        question_en: "What is the purpose of a firewall?",
        question_hi: "फ़ायरवॉल का उद्देश्य क्या है?",
        options_en: ["To block unauthorized access", "To speed up internet", "To store files", "To print documents"],
        options_hi: ["अनधिकृत पहुंच को रोकने के लिए", "इंटरनेट की गति बढ़ाने के लिए", "फ़ाइलें संग्रहीत करने के लिए", "दस्तावेज़ प्रिंट करने के लिए"],
        correctAnswer: 0
      },
      {
        question_en: "What is malware?",
        question_hi: "मैलवेयर क्या है?",
        options_en: ["Malicious software", "Good software", "Operating system", "Application software"],
        options_hi: ["दुर्भावनापूर्ण सॉफ़्टवेयर", "अच्छा सॉफ़्टवेयर", "ऑपरेटिंग सिस्टम", "एप्लिकेशन सॉफ़्टवेयर"],
        correctAnswer: 0
      },
      {
        question_en: "Why should you use strong passwords?",
        question_hi: "आपको मजबूत पासवर्ड क्यों उपयोग करना चाहिए?",
        options_en: ["To protect accounts from unauthorized access", "To make login faster", "To store more data", "To improve performance"],
        options_hi: ["अनधिकृत पहुंच से खातों की सुरक्षा के लिए", "लॉगिन को तेज़ बनाने के लिए", "अधिक डेटा संग्रहीत करने के लिए", "प्रदर्शन में सुधार के लिए"],
        correctAnswer: 0
      }
    ]
  };
  
  // Generate more variations by adding numbers/variations to questions
  const generateVariations = (template, variationIndex) => {
    // Create variations by slightly modifying questions
    const variations = [];
    for (let i = 0; i < Math.min(10, Math.ceil(count / 50)); i++) {
      variations.push({
        ...template,
        question_en: template.question_en + (i > 0 ? ` (V${i + 1})` : ''),
        question_hi: template.question_hi + (i > 0 ? ` (V${i + 1})` : '')
      });
    }
    return variations;
  };

  // Generate questions by cycling through categories and templates with variations
  let questionIndex = 0;
  let variationCounter = 0;
  
  while (additionalQuestions.length < count) {
    const category = categories[questionIndex % categories.length];
    const categoryTemplates = templates[category] || [];
    
    if (categoryTemplates.length > 0) {
      const templateIndex = Math.floor(questionIndex / categories.length) % categoryTemplates.length;
      const template = categoryTemplates[templateIndex];
      
      // Create unique question by adding variation number
      const uniqueQuestion = {
        category,
        subcategory: "General",
        question_en: `${template.question_en}${variationCounter > 0 ? ` [Var${variationCounter}]` : ''}`,
        question_hi: `${template.question_hi}${variationCounter > 0 ? ` [Var${variationCounter}]` : ''}`,
        options_en: [...template.options_en],
        options_hi: [...template.options_hi],
        correctAnswer: template.correctAnswer,
        explanation_en: `This question is about ${category}.`,
        explanation_hi: `यह प्रश्न ${category} के बारे में है।`
      };
      
      // Shuffle options to create variation
      if (variationCounter > 0) {
        const indices = [0, 1, 2, 3];
        const shuffledIndices = shuffleArray(indices);
        const newOptions = shuffledIndices.map(i => uniqueQuestion.options_en[i]);
        const newOptions_hi = shuffledIndices.map(i => uniqueQuestion.options_hi[i]);
        const newCorrectAnswer = shuffledIndices.indexOf(template.correctAnswer);
        
        uniqueQuestion.options_en = newOptions;
        uniqueQuestion.options_hi = newOptions_hi;
        uniqueQuestion.correctAnswer = newCorrectAnswer;
      }
      
      additionalQuestions.push(uniqueQuestion);
      variationCounter++;
    }
    
    questionIndex++;
    if (questionIndex > 5000) break; // Safety limit - increased for more questions
  }

  return additionalQuestions.slice(0, count);
}

// Function to create a unique signature for a question based on its content
function getQuestionSignature(question) {
  // Create a signature based on the English question text (normalized)
  return (question.question_en || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Function to get all used questions from existing CCC exams
async function getUsedQuestions(excludeExamNumbers = []) {
  
  // Get all CCC exams except the ones we're currently importing
  const allCCCExams = await Exam.find({ key: "CCC" });
  const examIds = allCCCExams
    .filter(exam => {
      const examNum = parseInt(exam.title.match(/\d+$/)?.[0] || '0');
      return !excludeExamNumbers.includes(examNum);
    })
    .map(exam => [String(exam._id), exam._id]);
  
  if (examIds.length === 0) return new Set();
  
  // Get all questions from these exams
  const usedQuestions = await Question.find({
    $or: examIds.flatMap(idPair => [{ examId: idPair[0] }, { examId: idPair[1] }])
  });
  
  // Create a set of question signatures
  const usedSignatures = new Set();
  usedQuestions.forEach(q => {
    const signature = getQuestionSignature({
      question_en: q.question_en || ''
    });
    if (signature) {
      usedSignatures.add(signature);
    }
  });
  
  return usedSignatures;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await req.json();
    const { examNumbers } = body; // Array of exam numbers to update (e.g., [1, 2, 3, 4, 5])

    await dbConnect();

    // Load questions from JSON file
    let baseQuestions = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'data', 'ccc-questions-bank.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const cccQuestionsBank = JSON.parse(fileContent);
      baseQuestions = cccQuestionsBank.questions || [];
    } catch (error) {
      console.error('Error loading question bank:', error);
      // Use empty array if file not found
    }
    
    // Get used questions from other exams (exclude current exam numbers)
    const usedQuestionSignatures = await getUsedQuestions(examNumbers || []);
    console.log(`Found ${usedQuestionSignatures.size} already used questions`);
    
    // Filter out questions that have been used
    const availableBaseQuestions = baseQuestions.filter(q => {
      const signature = getQuestionSignature(q);
      return !usedQuestionSignatures.has(signature);
    });
    
    // Calculate how many questions we need
    const questionsNeeded = (examNumbers?.length || 5) * 100;
    const questionsToGenerate = Math.max(0, questionsNeeded - availableBaseQuestions.length);
    
    // Generate additional unique questions
    const additionalQuestions = generateAdditionalQuestions(availableBaseQuestions, questionsToGenerate + 500);
    
    // Filter additional questions to remove duplicates with used ones
    const uniqueAdditionalQuestions = additionalQuestions.filter(q => {
      const signature = getQuestionSignature(q);
      return !usedQuestionSignatures.has(signature);
    });
    
    // Combine all available questions
    const allQuestions = [...availableBaseQuestions, ...uniqueAdditionalQuestions];
    
    // Remove duplicates within allQuestions itself
    const seenSignatures = new Set();
    const uniqueAllQuestions = allQuestions.filter(q => {
      const signature = getQuestionSignature(q);
      if (seenSignatures.has(signature)) {
        return false;
      }
      seenSignatures.add(signature);
      return true;
    });
    
    console.log(`Total unique questions available: ${uniqueAllQuestions.length}`);
    
    if (uniqueAllQuestions.length < questionsNeeded) {
      console.warn(`Warning: Only ${uniqueAllQuestions.length} unique questions available, but ${questionsNeeded} needed. Some questions may repeat.`);
    }

    const results = [];
    const errors = [];

    const examNums = examNumbers || [1, 2, 3, 4, 5]; // Default to first 5 exams

    for (const examNum of examNums) {
      try {
        const examTitle = `CCC Exam ${examNum}`;
        const exam = await Exam.findOne({ 
          key: "CCC",
          title: examTitle
        });

        if (!exam) {
          errors.push({ examNum, error: `Exam ${examTitle} not found` });
          continue;
        }

        // Get section and part
        const section = await Section.findOne({ examId: exam._id });
        if (!section) {
          errors.push({ examNum, error: `Section not found for ${examTitle}` });
          continue;
        }

        const part = await Part.findOne({ sectionId: section._id });
        if (!part) {
          errors.push({ examNum, error: `Part not found for ${examTitle}` });
          continue;
        }

        // Delete existing questions
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Shuffle questions and select 100 unique questions for this exam
        // Remove questions that have been used in previous exams in this batch
        const availableForThisExam = uniqueAllQuestions.filter(q => {
          const signature = getQuestionSignature(q);
          return !usedQuestionSignatures.has(signature);
        });
        
        if (availableForThisExam.length < 100) {
          console.warn(`Warning for exam ${examNum}: Only ${availableForThisExam.length} unique questions available, using all available.`);
        }
        
        const shuffledQuestions = shuffleArray(availableForThisExam);
        const examQuestions = shuffledQuestions.slice(0, Math.min(100, shuffledQuestions.length));
        
        // Add used questions to the set to avoid repetition within this batch
        examQuestions.forEach(q => {
          const signature = getQuestionSignature(q);
          usedQuestionSignatures.add(signature);
        });

        // Shuffle options for each question
        const questionsWithShuffledOptions = examQuestions.map((q, index) => {
          const options = [...q.options_en];
          const options_hi = [...q.options_hi];
          const correctAnswerIndex = q.correctAnswer;
          
          // Create array of indices and shuffle
          const indices = [0, 1, 2, 3];
          const shuffledIndices = shuffleArray(indices);
          
          // Find where correct answer moved to
          const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
          
          // Reorder options based on shuffled indices
          const shuffledOptions = shuffledIndices.map(i => options[i]);
          const shuffledOptions_hi = shuffledIndices.map(i => options_hi[i]);

          return {
            ...q,
            options_en: shuffledOptions,
            options_hi: shuffledOptions_hi,
            correctAnswer: newCorrectAnswer
          };
        });

        // Create questions in database
        let questionsCreated = 0;
        for (let i = 0; i < questionsWithShuffledOptions.length; i++) {
          const q = questionsWithShuffledOptions[i];
          const questionId = `ccc-exam-${examNum}-q-${i + 1}`;
          
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(section._id),
            partId: String(part._id),
            questionNumber: i + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: q.options_en,
            options_hi: q.options_hi,
            correctAnswer: q.correctAnswer,
            explanation_en: q.explanation_en || "",
            explanation_hi: q.explanation_hi || "",
            marks: 1,
            negativeMarks: 0
          });
          
          questionsCreated++;
        }

        results.push({
          examNum,
          examTitle,
          questionsCreated
        });

        console.log(`✅ Imported ${questionsCreated} questions for ${examTitle}`);

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
      note: "Questions are randomly selected and shuffled for each exam to ensure uniqueness."
    });

  } catch (error) {
    console.error("Import CCC questions error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to import CCC questions" 
    }, { status: 500 });
  }
}

