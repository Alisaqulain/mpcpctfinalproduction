import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";

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

// Generate questions based on topic
function generateQuestionsForTopic(topicId, topicName, topicName_hi, existingCount, targetCount) {
  const questions = [];
  const questionsNeeded = Math.max(0, targetCount - existingCount);

  // Topic-specific question templates
  const questionTemplates = {
    "topic-computers-evolution-types": [
      { en: "What is a digital computer?", hi: "डिजिटल कंप्यूटर क्या है?", opts_en: ["Processes discrete data", "Processes analog signals", "Only stores data", "Only displays output"], opts_hi: ["असतत डेटा प्रसंस्करण", "एनालॉग सिग्नल प्रसंस्करण", "केवल डेटा संग्रहण", "केवल आउटपुट प्रदर्शन"], ans: 0 },
      { en: "When was the first electronic computer invented?", hi: "पहला इलेक्ट्रॉनिक कंप्यूटर कब बनाया गया था?", opts_en: ["1940s", "1950s", "1960s", "1970s"], opts_hi: ["1940 के दशक", "1950 के दशक", "1960 के दशक", "1970 के दशक"], ans: 0 },
      { en: "What is a hybrid computer?", hi: "हाइब्रिड कंप्यूटर क्या है?", opts_en: ["Combines analog and digital", "Only analog", "Only digital", "Mechanical computer"], opts_hi: ["एनालॉग और डिजिटल का संयोजन", "केवल एनालॉग", "केवल डिजिटल", "यांत्रिक कंप्यूटर"], ans: 0 },
      { en: "Which computer type is used in banks?", hi: "बैंकों में किस प्रकार के कंप्यूटर का उपयोग किया जाता है?", opts_en: ["Mainframe", "Supercomputer", "Microcomputer", "Minicomputer"], opts_hi: ["मेनफ्रेम", "सुपरकंप्यूटर", "माइक्रोकंप्यूटर", "मिनीकंप्यूटर"], ans: 0 },
      { en: "What is a workstation computer?", hi: "वर्कस्टेशन कंप्यूटर क्या है?", opts_en: ["High-performance single-user computer", "Multi-user server", "Portable computer", "Gaming console"], opts_hi: ["उच्च प्रदर्शन एकल-उपयोगकर्ता कंप्यूटर", "बहु-उपयोगकर्ता सर्वर", "पोर्टेबल कंप्यूटर", "गेमिंग कंसोल"], ans: 0 },
    ],
    "topic-generations-printers": [
      { en: "Which generation used Integrated Circuits (ICs)?", hi: "किस पीढ़ी में इंटीग्रेटेड सर्किट (IC) का उपयोग किया गया?", opts_en: ["Third generation", "First generation", "Second generation", "Fourth generation"], opts_hi: ["तीसरी पीढ़ी", "पहली पीढ़ी", "दूसरी पीढ़ी", "चौथी पीढ़ी"], ans: 0 },
      { en: "What is DPI in printers?", hi: "प्रिंटर में DPI क्या है?", opts_en: ["Dots Per Inch", "Data Processing Index", "Digital Print Interface", "Display Print Image"], opts_hi: ["डॉट्स पर इंच", "डेटा प्रसंस्करण सूचकांक", "डिजिटल प्रिंट इंटरफेस", "डिस्प्ले प्रिंट छवि"], ans: 0 },
      { en: "Which printer uses impact mechanism?", hi: "कौन सा प्रिंटर प्रभाव तंत्र का उपयोग करता है?", opts_en: ["Dot matrix printer", "Laser printer", "Inkjet printer", "Thermal printer"], opts_hi: ["डॉट मैट्रिक्स प्रिंटर", "लेजर प्रिंटर", "इंकजेट प्रिंटर", "थर्मल प्रिंटर"], ans: 0 },
    ],
    "topic-memory-types": [
      { en: "What is SRAM?", hi: "SRAM क्या है?", opts_en: ["Static Random Access Memory", "System Random Access Memory", "Secondary Random Access Memory", "Secure Random Access Memory"], opts_hi: ["स्टेटिक रैंडम एक्सेस मेमोरी", "सिस्टम रैंडम एक्सेस मेमोरी", "सेकेंडरी रैंडम एक्सेस मेमोरी", "सुरक्षित रैंडम एक्सेस मेमोरी"], ans: 0 },
      { en: "What is DRAM?", hi: "DRAM क्या है?", opts_en: ["Dynamic Random Access Memory", "Digital Random Access Memory", "Data Random Access Memory", "Direct Random Access Memory"], opts_hi: ["डायनामिक रैंडम एक्सेस मेमोरी", "डिजिटल रैंडम एक्सेस मेमोरी", "डेटा रैंडम एक्सेस मेमोरी", "डायरेक्ट रैंडम एक्सेस मेमोरी"], ans: 0 },
      { en: "Which memory type is used in USB drives?", hi: "USB ड्राइव में किस प्रकार की मेमोरी का उपयोग किया जाता है?", opts_en: ["Flash memory", "RAM", "ROM", "Cache"], opts_hi: ["फ्लैश मेमोरी", "RAM", "ROM", "कैश"], ans: 0 },
    ]
  };

  const templates = questionTemplates[topicId] || [];
  
  // Generate questions by varying the templates
  for (let i = 0; i < questionsNeeded; i++) {
    const templateIndex = i % templates.length;
    const template = templates[templateIndex];
    const variation = Math.floor(i / templates.length);
    
    questions.push({
      question_en: template.en + (variation > 0 ? ` (${variation + 1})` : ""),
      question_hi: template.hi + (variation > 0 ? ` (${variation + 1})` : ""),
      options_en: template.opts_en,
      options_hi: template.opts_hi,
      correctAnswer: template.ans,
      marks: 1,
      explanation_en: `Explanation for question ${i + 1}`,
      explanation_hi: `प्रश्न ${i + 1} के लिए स्पष्टीकरण`
    });
  }

  return questions;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { topicIds } = body;

    // Default to first 3 topics
    const topicsToProcess = topicIds || [
      "topic-computers-evolution-types",
      "topic-generations-printers",
      "topic-memory-types"
    ];

    const results = [];
    const errors = [];

    for (const topicId of topicsToProcess) {
      try {
        const topic = await Topic.findOne({ topicId });
        if (!topic) {
          errors.push({ topicId, error: "Topic not found" });
          continue;
        }

        // Count existing questions
        const existingCount = await TopicWiseMCQ.countDocuments({ topicId });
        const questionsNeeded = 100 - existingCount;

        if (questionsNeeded <= 0) {
          results.push({
            topicId,
            topicName: topic.topicName,
            message: `Already has ${existingCount} questions. No new questions needed.`
          });
          continue;
        }

        // Generate questions
        const newQuestions = generateQuestionsForTopic(
          topicId,
          topic.topicName,
          topic.topicName_hi,
          existingCount,
          100
        );

        // Insert new questions
        const questionsToInsert = newQuestions.map((q, index) => ({
          id: `${topicId}-q-${existingCount + index + 1}`,
          topicId: topicId,
          topicName: topic.topicName,
          topicName_hi: topic.topicName_hi || '',
          question_en: q.question_en,
          question_hi: q.question_hi,
          options_en: q.options_en,
          options_hi: q.options_hi,
          correctAnswer: q.correctAnswer,
          marks: q.marks || 1,
          negativeMarks: 0,
          explanation_en: q.explanation_en || '',
          explanation_hi: q.explanation_hi || '',
          difficulty: 'medium',
          order: existingCount + index + 1,
          isFree: topic.isFree || false
        }));

        if (questionsToInsert.length > 0) {
          await TopicWiseMCQ.insertMany(questionsToInsert);
          results.push({
            topicId,
            topicName: topic.topicName,
            questionsAdded: questionsToInsert.length,
            totalQuestions: existingCount + questionsToInsert.length
          });
        }

      } catch (error) {
        console.error(`Error generating questions for ${topicId}:`, error);
        errors.push({ topicId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated questions for ${results.length} topic(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error generating topic-wise questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}














