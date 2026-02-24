import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";

async function requireAdmin(req) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { ok: false, error: "Unauthorized" };
    }

    const { jwtVerify } = await import("jose");
    const JWT_SECRET = process.env.JWT_SECRET || "secret123";
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

    const User = (await import("@/lib/models/User")).default;
    await dbConnect();
    const user = await User.findById(payload.userId);

    if (!user || user.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }

    return { ok: true, userId: payload.userId };
  } catch (error) {
    return { ok: false, error: "Unauthorized" };
  }
}

function parseOption(optionText) {
  const hindiMatch = optionText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (hindiMatch) {
    return {
      en: hindiMatch[1].trim(),
      hi: hindiMatch[2].trim()
    };
  }
  return {
    en: optionText.trim(),
    hi: optionText.trim()
  };
}

// Pre-defined 10 passages with questions
const predefinedPassages = [
  {
    title_en: "Importance of Education",
    title_hi: "शिक्षा का महत्व",
    passage_en: "Education helps individuals gain knowledge, skills, and confidence. It improves employment opportunities and contributes to national development. An educated society is more aware of health, rights, and responsibilities.",
    passage_hi: "शिक्षा व्यक्ति को ज्ञान, कौशल और आत्मविश्वास प्रदान करती है। यह रोजगार के अवसर बढ़ाती है और राष्ट्रीय विकास में योगदान देती है। शिक्षित समाज स्वास्थ्य, अधिकारों और कर्तव्यों के प्रति अधिक जागरूक होता है।",
    questions: [
      {
        question_en: "What does education provide?",
        question_hi: "शिक्षा क्या प्रदान करती है?",
        options_en: ["Fear", "Knowledge", "Laziness", "Poverty"],
        options_hi: ["Fear", "Knowledge", "Laziness", "Poverty"],
        correctAnswer: 1
      },
      {
        question_en: "Education improves:",
        question_hi: "शिक्षा सुधारती है:",
        options_en: ["Unemployment", "Employment opportunities", "Illiteracy", "Crime"],
        options_hi: ["Unemployment", "Employment opportunities", "Illiteracy", "Crime"],
        correctAnswer: 1
      },
      {
        question_en: "Education contributes to:",
        question_hi: "शिक्षा योगदान देती है:",
        options_en: ["National development", "Pollution", "Inflation", "Corruption"],
        options_hi: ["National development", "Pollution", "Inflation", "Corruption"],
        correctAnswer: 0
      },
      {
        question_en: "Educated society is aware of:",
        question_hi: "शिक्षित समाज जागरूक होता है:",
        options_en: ["Games", "Fashion", "Health and rights", "Movies"],
        options_hi: ["Games", "Fashion", "Health and rights", "Movies"],
        correctAnswer: 2
      },
      {
        question_en: "Education gives:",
        question_hi: "शिक्षा देती है:",
        options_en: ["Confidence", "Fear", "Weakness", "Stress"],
        options_hi: ["Confidence", "Fear", "Weakness", "Stress"],
        correctAnswer: 0
      }
    ]
  },
  {
    title_en: "Cleanliness and Health",
    title_hi: "स्वच्छता और स्वास्थ्य",
    passage_en: "Cleanliness prevents diseases and keeps the environment healthy. Proper sanitation and waste management reduce infections. Clean surroundings improve quality of life.",
    passage_hi: "स्वच्छता रोगों को रोकती है और पर्यावरण को स्वस्थ रखती है। उचित स्वच्छता और कचरा प्रबंधन संक्रमण को कम करता है। साफ वातावरण जीवन की गुणवत्ता बढ़ाता है।",
    questions: [
      {
        question_en: "Cleanliness helps prevent:",
        question_hi: "स्वच्छता किसे रोकती है?",
        options_en: ["Growth", "Diseases", "Education", "Rain"],
        options_hi: ["Growth", "Diseases", "Education", "Rain"],
        correctAnswer: 1
      },
      {
        question_en: "Sanitation reduces:",
        question_hi: "स्वच्छता कम करती है:",
        options_en: ["Happiness", "Pollution only", "Infections", "Temperature"],
        options_hi: ["Happiness", "Pollution only", "Infections", "Temperature"],
        correctAnswer: 2
      },
      {
        question_en: "Clean environment improves:",
        question_hi: "स्वच्छ वातावरण सुधारता है:",
        options_en: ["Laziness", "Quality of life", "Hunger", "Noise"],
        options_hi: ["Laziness", "Quality of life", "Hunger", "Noise"],
        correctAnswer: 1
      },
      {
        question_en: "Waste management is related to:",
        question_hi: "कचरा प्रबंधन जुड़ा है:",
        options_en: ["Fashion", "Health", "Sports", "Travel"],
        options_hi: ["Fashion", "Health", "Sports", "Travel"],
        correctAnswer: 1
      },
      {
        question_en: "Cleanliness keeps environment:",
        question_hi: "स्वच्छता पर्यावरण को रखती है:",
        options_en: ["Dirty", "Healthy", "Hot", "Dry"],
        options_hi: ["Dirty", "Healthy", "Hot", "Dry"],
        correctAnswer: 1
      }
    ]
  },
  {
    title_en: "Importance of Trees",
    title_hi: "पेड़ों का महत्व",
    passage_en: "Trees provide oxygen, fruits, and shade. They help reduce pollution and maintain climate balance. Trees also prevent soil erosion.",
    passage_hi: "पेड़ ऑक्सीजन, फल और छाया प्रदान करते हैं। वे प्रदूषण कम करते हैं और जलवायु संतुलन बनाए रखते हैं। पेड़ मिट्टी कटाव रोकते हैं।",
    questions: [
      {
        question_en: "Trees give:",
        question_hi: "पेड़ देते हैं:",
        options_en: ["Smoke", "Oxygen", "Noise", "Dust"],
        options_hi: ["Smoke", "Oxygen", "Noise", "Dust"],
        correctAnswer: 1
      },
      {
        question_en: "Trees help reduce:",
        question_hi: "पेड़ कम करते हैं:",
        options_en: ["Pollution", "Rain", "Rivers", "Wind"],
        options_hi: ["Pollution", "Rain", "Rivers", "Wind"],
        correctAnswer: 0
      },
      {
        question_en: "Trees maintain:",
        question_hi: "पेड़ बनाए रखते हैं:",
        options_en: ["Traffic", "Climate balance", "Noise", "Population"],
        options_hi: ["Traffic", "Climate balance", "Noise", "Population"],
        correctAnswer: 1
      },
      {
        question_en: "Trees prevent:",
        question_hi: "पेड़ रोकते हैं:",
        options_en: ["Soil erosion", "Flood only", "Fire", "Heat"],
        options_hi: ["Soil erosion", "Flood only", "Fire", "Heat"],
        correctAnswer: 0
      },
      {
        question_en: "Trees provide:",
        question_hi: "पेड़ प्रदान करते हैं:",
        options_en: ["Fruits", "Plastic", "Metals", "Oil"],
        options_hi: ["Fruits", "Plastic", "Metals", "Oil"],
        correctAnswer: 0
      }
    ]
  },
  {
    title_en: "Importance of Water",
    title_hi: "जल का महत्व",
    passage_en: "Water is essential for life. It is used for drinking, farming, and industries. Saving water helps avoid future shortages.",
    passage_hi: "जल जीवन के लिए आवश्यक है। इसका उपयोग पीने, खेती और उद्योगों में किया जाता है। पानी बचाने से भविष्य की कमी से बचा जा सकता है।",
    questions: [
      {
        question_en: "Water is necessary for:",
        question_hi: "जल आवश्यक है:",
        options_en: ["Life", "Noise", "Smoke", "Machines only"],
        options_hi: ["Life", "Noise", "Smoke", "Machines only"],
        correctAnswer: 0
      },
      {
        question_en: "Water is used in:",
        question_hi: "जल का उपयोग होता है:",
        options_en: ["Drinking", "Farming", "Industry", "All of these"],
        options_hi: ["Drinking", "Farming", "Industry", "All of these"],
        correctAnswer: 3
      },
      {
        question_en: "Saving water avoids:",
        question_hi: "जल बचाने से बचते हैं:",
        options_en: ["Rain", "Shortages", "Floods", "Cold"],
        options_hi: ["Rain", "Shortages", "Floods", "Cold"],
        correctAnswer: 1
      },
      {
        question_en: "Water is related to:",
        question_hi: "जल जुड़ा है:",
        options_en: ["Survival", "Pollution", "Fashion", "Traffic"],
        options_hi: ["Survival", "Pollution", "Fashion", "Traffic"],
        correctAnswer: 0
      },
      {
        question_en: "Water is a:",
        question_hi: "जल है:",
        options_en: ["Luxury", "Waste", "Resource", "Problem"],
        options_hi: ["Luxury", "Waste", "Resource", "Problem"],
        correctAnswer: 2
      }
    ]
  },
  {
    title_en: "Road Safety",
    title_hi: "सड़क सुरक्षा",
    passage_en: "Road safety rules help prevent accidents. Wearing helmets and seat belts saves lives. Obeying traffic signals ensures smooth movement.",
    passage_hi: "सड़क सुरक्षा नियम दुर्घटनाओं को रोकते हैं। हेलमेट और सीट बेल्ट जीवन बचाते हैं। ट्रैफिक संकेतों का पालन सुरक्षित आवागमन सुनिश्चित करता है।",
    questions: [
      {
        question_en: "Road safety prevents:",
        question_hi: "सड़क सुरक्षा रोकती है:",
        options_en: ["Traffic", "Accidents", "Rain", "Pollution"],
        options_hi: ["Traffic", "Accidents", "Rain", "Pollution"],
        correctAnswer: 1
      },
      {
        question_en: "Helmet protects:",
        question_hi: "हेलमेट बचाता है:",
        options_en: ["Hands", "Head", "Feet", "Eyes"],
        options_hi: ["Hands", "Head", "Feet", "Eyes"],
        correctAnswer: 1
      },
      {
        question_en: "Seat belts save:",
        question_hi: "सीट बेल्ट बचाती है:",
        options_en: ["Fuel", "Time", "Lives", "Money"],
        options_hi: ["Fuel", "Time", "Lives", "Money"],
        correctAnswer: 2
      },
      {
        question_en: "Traffic signals ensure:",
        question_hi: "संकेत सुनिश्चित करते हैं:",
        options_en: ["Noise", "Chaos", "Smooth movement", "Delay"],
        options_hi: ["Noise", "Chaos", "Smooth movement", "Delay"],
        correctAnswer: 2
      },
      {
        question_en: "Road rules are for:",
        question_hi: "सड़क नियम हैं:",
        options_en: ["Decoration", "Safety", "Fun", "Racing"],
        options_hi: ["Decoration", "Safety", "Fun", "Racing"],
        correctAnswer: 1
      }
    ]
  },
  {
    title_en: "Renewable Energy",
    title_hi: "नवीकरणीय ऊर्जा",
    passage_en: "Renewable energy comes from natural sources like sunlight and wind. It reduces pollution and saves fossil fuels. Solar and wind power are common examples.",
    passage_hi: "नवीकरणीय ऊर्जा सूर्य और हवा जैसे प्राकृतिक स्रोतों से आती है। यह प्रदूषण कम करती है और ईंधन बचाती है। सौर और पवन ऊर्जा इसके उदाहरण हैं।",
    questions: [
      {
        question_en: "Renewable energy comes from:",
        question_hi: "नवीकरणीय ऊर्जा आती है:",
        options_en: ["Coal", "Nature", "Plastic", "Machines"],
        options_hi: ["Coal", "Nature", "Plastic", "Machines"],
        correctAnswer: 1
      },
      {
        question_en: "It reduces:",
        question_hi: "यह कम करती है:",
        options_en: ["Pollution", "Rain", "Oxygen", "Population"],
        options_hi: ["Pollution", "Rain", "Oxygen", "Population"],
        correctAnswer: 0
      },
      {
        question_en: "Example of renewable energy:",
        question_hi: "उदाहरण है:",
        options_en: ["Diesel", "Solar power", "Petrol", "Gas"],
        options_hi: ["Diesel", "Solar power", "Petrol", "Gas"],
        correctAnswer: 1
      },
      {
        question_en: "Renewable energy saves:",
        question_hi: "यह बचाती है:",
        options_en: ["Money only", "Fossil fuels", "Water only", "Time only"],
        options_hi: ["Money only", "Fossil fuels", "Water only", "Time only"],
        correctAnswer: 1
      },
      {
        question_en: "Wind power uses:",
        question_hi: "पवन ऊर्जा उपयोग करती है:",
        options_en: ["Air", "Fire", "Water", "Oil"],
        options_hi: ["Air", "Fire", "Water", "Oil"],
        correctAnswer: 0
      }
    ]
  },
  {
    title_en: "Importance of Exercise",
    title_hi: "व्यायाम का महत्व",
    passage_en: "Exercise keeps the body fit and healthy. It improves heart health and reduces stress. Daily physical activity increases energy.",
    passage_hi: "व्यायाम शरीर को स्वस्थ और तंदुरुस्त रखता है। यह हृदय स्वास्थ्य सुधारता है और तनाव कम करता है। रोज़ की गतिविधि ऊर्जा बढ़ाती है।",
    questions: [
      {
        question_en: "Exercise keeps body:",
        question_hi: "व्यायाम शरीर को रखता है:",
        options_en: ["Weak", "Fit", "Lazy", "Sick"],
        options_hi: ["Weak", "Fit", "Lazy", "Sick"],
        correctAnswer: 1
      },
      {
        question_en: "Exercise improves:",
        question_hi: "व्यायाम सुधारता है:",
        options_en: ["Heart health", "Pollution", "Hunger", "Noise"],
        options_hi: ["Heart health", "Pollution", "Hunger", "Noise"],
        correctAnswer: 0
      },
      {
        question_en: "Exercise reduces:",
        question_hi: "व्यायाम कम करता है:",
        options_en: ["Stress", "Water", "Sleep", "Growth"],
        options_hi: ["Stress", "Water", "Sleep", "Growth"],
        correctAnswer: 0
      },
      {
        question_en: "Daily activity increases:",
        question_hi: "रोज़ की गतिविधि बढ़ाती है:",
        options_en: ["Fat", "Energy", "Illness", "Tiredness"],
        options_hi: ["Fat", "Energy", "Illness", "Tiredness"],
        correctAnswer: 1
      },
      {
        question_en: "Exercise is good for:",
        question_hi: "व्यायाम अच्छा है:",
        options_en: ["Body", "Machines", "Roads", "Buildings"],
        options_hi: ["Body", "Machines", "Roads", "Buildings"],
        correctAnswer: 0
      }
    ]
  },
  {
    title_en: "Importance of Farmers",
    title_hi: "किसानों का महत्व",
    passage_en: "Farmers grow crops and provide food to the nation. Agriculture is the backbone of the economy. Farmers ensure food security.",
    passage_hi: "किसान फसल उगाते हैं और देश को भोजन प्रदान करते हैं। कृषि अर्थव्यवस्था की रीढ़ है। किसान खाद्य सुरक्षा सुनिश्चित करते हैं।",
    questions: [
      {
        question_en: "Farmers provide:",
        question_hi: "किसान प्रदान करते हैं:",
        options_en: ["Clothes", "Food", "Machines", "Tools"],
        options_hi: ["Clothes", "Food", "Machines", "Tools"],
        correctAnswer: 1
      },
      {
        question_en: "Agriculture is backbone of:",
        question_hi: "कृषि रीढ़ है:",
        options_en: ["Education", "Economy", "Health", "Tourism"],
        options_hi: ["Education", "Economy", "Health", "Tourism"],
        correctAnswer: 1
      },
      {
        question_en: "Farmers ensure:",
        question_hi: "किसान सुनिश्चित करते हैं:",
        options_en: ["Pollution", "Food security", "Traffic", "Power"],
        options_hi: ["Pollution", "Food security", "Traffic", "Power"],
        correctAnswer: 1
      },
      {
        question_en: "Crops are grown by:",
        question_hi: "फसल उगाई जाती है:",
        options_en: ["Teachers", "Doctors", "Farmers", "Drivers"],
        options_hi: ["Teachers", "Doctors", "Farmers", "Drivers"],
        correctAnswer: 2
      },
      {
        question_en: "Food comes from:",
        question_hi: "भोजन आता है:",
        options_en: ["Factories", "Shops only", "Farms", "Banks"],
        options_hi: ["Factories", "Shops only", "Farms", "Banks"],
        correctAnswer: 2
      }
    ]
  },
  {
    title_en: "Importance of Time",
    title_hi: "समय का महत्व",
    passage_en: "Time is valuable and once lost cannot be recovered. Proper time management leads to success. Punctuality builds discipline.",
    passage_hi: "समय मूल्यवान है और एक बार खो जाने पर वापस नहीं आता। समय प्रबंधन सफलता दिलाता है। समय पालन अनुशासन बनाता है।",
    questions: [
      {
        question_en: "Time once lost:",
        question_hi: "खोया समय:",
        options_en: ["Returns", "Stays", "Cannot be recovered", "Multiplies"],
        options_hi: ["Returns", "Stays", "Cannot be recovered", "Multiplies"],
        correctAnswer: 2
      },
      {
        question_en: "Time management leads to:",
        question_hi: "समय प्रबंधन लाता है:",
        options_en: ["Failure", "Success", "Laziness", "Fear"],
        options_hi: ["Failure", "Success", "Laziness", "Fear"],
        correctAnswer: 1
      },
      {
        question_en: "Punctuality builds:",
        question_hi: "समय पालन बनाता है:",
        options_en: ["Stress", "Discipline", "Noise", "Hunger"],
        options_hi: ["Stress", "Discipline", "Noise", "Hunger"],
        correctAnswer: 1
      },
      {
        question_en: "Time is:",
        question_hi: "समय है:",
        options_en: ["Waste", "Valuable", "Cheap", "Free"],
        options_hi: ["Waste", "Valuable", "Cheap", "Free"],
        correctAnswer: 1
      },
      {
        question_en: "Good use of time brings:",
        question_hi: "अच्छा उपयोग लाता है:",
        options_en: ["Growth", "Illness", "Delay", "Loss"],
        options_hi: ["Growth", "Illness", "Delay", "Loss"],
        correctAnswer: 0
      }
    ]
  },
  {
    title_en: "Importance of Books",
    title_hi: "पुस्तकों का महत्व",
    passage_en: "Books increase knowledge and imagination. Reading improves language skills. Books guide people in life.",
    passage_hi: "पुस्तकें ज्ञान और कल्पना बढ़ाती हैं। पढ़ने से भाषा कौशल सुधरता है। पुस्तकें जीवन में मार्गदर्शन करती हैं।",
    questions: [
      {
        question_en: "Books increase:",
        question_hi: "पुस्तकें बढ़ाती हैं:",
        options_en: ["Noise", "Knowledge", "Dust", "Hunger"],
        options_hi: ["Noise", "Knowledge", "Dust", "Hunger"],
        correctAnswer: 1
      },
      {
        question_en: "Reading improves:",
        question_hi: "पढ़ना सुधारता है:",
        options_en: ["Language", "Pollution", "Stress", "Traffic"],
        options_hi: ["Language", "Pollution", "Stress", "Traffic"],
        correctAnswer: 0
      },
      {
        question_en: "Books help in:",
        question_hi: "पुस्तकें मदद करती हैं:",
        options_en: ["Confusion", "Guidance", "Illness", "Laziness"],
        options_hi: ["Confusion", "Guidance", "Illness", "Laziness"],
        correctAnswer: 1
      },
      {
        question_en: "Books are source of:",
        question_hi: "पुस्तकें स्रोत हैं:",
        options_en: ["Learning", "Noise", "Waste", "Fire"],
        options_hi: ["Learning", "Noise", "Waste", "Fire"],
        correctAnswer: 0
      },
      {
        question_en: "Books develop:",
        question_hi: "पुस्तकें विकसित करती हैं:",
        options_en: ["Imagination", "Fear", "Sleep", "Weakness"],
        options_hi: ["Imagination", "Fear", "Sleep", "Weakness"],
        correctAnswer: 0
      }
    ]
  }
];

// Shuffle array function
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await dbConnect();
    
    // Duplicate the 10 passages to make 20 (each appears twice)
    const allPassages = [...predefinedPassages, ...predefinedPassages];
    
    // Shuffle the 20 passages
    const shuffledPassages = shuffleArray(allPassages);
    
    console.log(`Prepared ${shuffledPassages.length} passages (10 unique, duplicated to 20, then shuffled)`);
    
    // Get all CPCT exams (limit to 20)
    const cpctExams = await Exam.find({ key: 'CPCT' })
      .sort({ title: 1 })
      .limit(20);
    
    if (cpctExams.length === 0) {
      return NextResponse.json(
        { error: "No CPCT exams found" },
        { status: 400 }
      );
    }
    
    if (cpctExams.length < 20) {
      console.warn(`Only found ${cpctExams.length} CPCT exams, but need 20`);
    }
    
    // Import to question bank first
    const partName = "READING COMPREHENSION";
    let importedCount = 0;
    
    // Generate unique IDs for question bank questions
    let questionBankCounter = 1;
    for (const passage of shuffledPassages) {
      for (const q of passage.questions) {
        const uniqueId = `cpct-question-bank-reading-${Date.now()}-${questionBankCounter++}`;
        const bankQuestion = new Question({
          id: uniqueId,
          examId: "CPCT_QUESTION_BANK",
          sectionId: "CPCT_QUESTION_BANK_SECTION", // Dummy section ID for question bank
          partName: partName,
          question_en: q.question_en,
          question_hi: q.question_hi,
          options_en: q.options_en,
          options_hi: q.options_hi,
          correctAnswer: q.correctAnswer,
          passage_en: passage.passage_en,
          passage_hi: passage.passage_hi,
          title_en: passage.title_en,
          title_hi: passage.title_hi,
          marks: 1,
          negativeMarks: 0,
          questionType: "MCQ"
        });
        
        await bankQuestion.save();
        importedCount++;
      }
    }
    
    console.log(`Imported ${importedCount} questions to question bank`);
    
    // Distribute one passage to each exam
    const distributionResults = [];
    const errors = [];
    
    for (let i = 0; i < Math.min(shuffledPassages.length, cpctExams.length); i++) {
      const exam = cpctExams[i];
      const passage = shuffledPassages[i];
      
      try {
        // Get Section A
        const sectionA = await Section.findOne({ 
          examId: exam._id,
          name: { $in: ["Section A", "CPCT MCQ", "Section 1 (CPCT MCQ)"] }
        });
        
        if (!sectionA) {
          const allSections = await Section.find({ examId: exam._id });
          console.error(`❌ ${exam.title}: Section A not found. Available sections:`, allSections.map(s => s.name));
          errors.push(`${exam.title}: Section A not found. Available: ${allSections.map(s => s.name).join(', ')}`);
          continue;
        }
        
        console.log(`✅ Found Section A for ${exam.title}: ${sectionA.name} (ID: ${sectionA._id})`);
        
        // Get Reading Comprehension part
        const readingPart = await Part.findOne({
          sectionId: sectionA._id,
          name: { $regex: /reading|comprehension/i }
        });
        
        if (!readingPart) {
          const allParts = await Part.find({ sectionId: sectionA._id });
          console.error(`❌ ${exam.title}: Reading Comprehension part not found. Available parts:`, allParts.map(p => p.name));
          errors.push(`${exam.title}: Reading Comprehension part not found. Available: ${allParts.map(p => p.name).join(', ')}`);
          continue;
        }
        
        console.log(`✅ Found Reading Comprehension part for ${exam.title}: ${readingPart.name} (ID: ${readingPart._id})`);
        
        // Delete existing questions for this part
        await Question.deleteMany({
          examId: String(exam._id),
          partId: String(readingPart._id),
          questionType: { $ne: "TYPING" }
        });
        
        // Insert questions - ensure unique IDs
        const examNumber = exam.title.match(/\d+/)?.[0] || (i + 1).toString();
        const questionsToInsert = passage.questions.map((q, index) => {
          // Create unique ID using exam number, passage index, and question index
          const uniqueId = `cpct-exam-${examNumber}-reading-p${i}-q${index + 1}`;
          return {
            id: uniqueId,
            examId: String(exam._id),
            sectionId: String(sectionA._id),
            partId: String(readingPart._id),
            questionNumber: index + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: q.options_en,
            options_hi: q.options_hi,
            correctAnswer: q.correctAnswer,
            passage_en: passage.passage_en,
            passage_hi: passage.passage_hi,
            title_en: passage.title_en,
            title_hi: passage.title_hi,
            marks: 1,
            negativeMarks: 0,
            isFree: exam.isFree || false
          };
        });
        
        await Question.insertMany(questionsToInsert);
        
        distributionResults.push({
          examTitle: exam.title,
          questionsAdded: questionsToInsert.length,
          passageTitle: passage.title_en
        });
        
        console.log(`✅ Distributed "${passage.title_en}" (${questionsToInsert.length} questions) to ${exam.title}`);
      } catch (error) {
        errors.push(`${exam.title}: ${error.message}`);
        console.error(`Error distributing to ${exam.title}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      passagesImported: shuffledPassages.length,
      questionsImported: importedCount,
      examsUpdated: distributionResults.length,
      distributionResults,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error("Error in auto import:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto import passages" },
      { status: 500 }
    );
  }
}

