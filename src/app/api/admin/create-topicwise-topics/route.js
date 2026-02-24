import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Topic from "@/lib/models/Topic";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// Function to generate topic-specific questions
function generateTopicQuestions(topicData, count) {
  const questions = [];
  const topicId = topicData.id;
  const topicName = topicData.name;
  const topicName_hi = topicData.name_hi;
  
  // Comprehensive question templates based on topic
  const templates = {
    "topic-computers-evolution-types": [
      { q: "What is the main component of a computer?", opts: ["CPU", "Monitor", "Keyboard", "Mouse"], ans: 0 },
      { q: "Which type of computer is used for scientific research?", opts: ["Supercomputer", "Desktop", "Laptop", "Tablet"], ans: 0 },
      { q: "What does PC stand for?", opts: ["Personal Computer", "Program Computer", "Process Computer", "Print Computer"], ans: 0 },
      { q: "Which is the largest type of computer?", opts: ["Supercomputer", "Mainframe", "Minicomputer", "Microcomputer"], ans: 0 },
      { q: "What is a laptop computer?", opts: ["Portable computer", "Desktop computer", "Server", "Workstation"], ans: 0 },
      { q: "When was the first computer invented?", opts: ["1940s", "1950s", "1960s", "1970s"], ans: 0 },
      { q: "What is a server computer?", opts: ["Network computer", "Personal computer", "Gaming computer", "Office computer"], ans: 0 },
      { q: "Which computer is used in homes?", opts: ["Personal Computer", "Mainframe", "Supercomputer", "Server"], ans: 0 },
      { q: "What is a workstation?", opts: ["High-performance computer", "Low-performance computer", "Mobile device", "Printer"], ans: 0 },
      { q: "What is an embedded computer?", opts: ["Computer in devices", "Desktop computer", "Laptop", "Server"], ans: 0 }
    ],
    "topic-generations-printers": [
      { q: "Which generation used integrated circuits?", opts: ["First", "Second", "Third", "Fourth"], ans: 2 },
      { q: "What type of printer uses laser technology?", opts: ["Inkjet", "Laser", "Dot Matrix", "Thermal"], ans: 1 },
      { q: "Which generation introduced microprocessors?", opts: ["Second", "Third", "Fourth", "Fifth"], ans: 2 },
      { q: "What was used in first generation computers?", opts: ["Vacuum tubes", "Transistors", "ICs", "Microprocessors"], ans: 0 },
      { q: "Which generation used transistors?", opts: ["First", "Second", "Third", "Fourth"], ans: 1 },
      { q: "What is an impact printer?", opts: ["Dot matrix", "Laser", "Inkjet", "Thermal"], ans: 0 },
      { q: "Which printer is fastest?", opts: ["Laser", "Inkjet", "Dot Matrix", "Thermal"], ans: 0 },
      { q: "What is a non-impact printer?", opts: ["Laser printer", "Dot matrix", "Impact printer", "Manual printer"], ans: 0 },
      { q: "Which generation is current?", opts: ["Fourth", "Fifth", "Sixth", "Seventh"], ans: 1 },
      { q: "What does AI stand for in fifth generation?", opts: ["Artificial Intelligence", "Auto Input", "Advanced Interface", "Auto Install"], ans: 0 }
    ],
    "topic-memory-types": [
      { q: "What is cache memory?", opts: ["Fast memory", "Slow memory", "External memory", "Network memory"], ans: 0 },
      { q: "Which memory is fastest?", opts: ["RAM", "ROM", "Cache", "Hard Disk"], ans: 2 },
      { q: "What is virtual memory?", opts: ["RAM extension", "ROM extension", "Hard disk", "USB drive"], ans: 0 },
      { q: "What is primary memory?", opts: ["RAM and ROM", "Hard disk", "USB", "CD"], ans: 0 },
      { q: "What is secondary memory?", opts: ["Hard disk", "RAM", "ROM", "Cache"], ans: 0 },
      { q: "What is volatile memory?", opts: ["RAM", "ROM", "Hard disk", "SSD"], ans: 0 },
      { q: "What is non-volatile memory?", opts: ["ROM", "RAM", "Cache", "Register"], ans: 0 },
      { q: "What is DRAM?", opts: ["Dynamic RAM", "Data RAM", "Direct RAM", "Digital RAM"], ans: 0 },
      { q: "What is SRAM?", opts: ["Static RAM", "Slow RAM", "System RAM", "Storage RAM"], ans: 0 },
      { q: "What is flash memory?", opts: ["USB memory", "RAM", "ROM", "Cache"], ans: 0 }
    ],
    "topic-software-hardware-io": [
      { q: "What is application software?", opts: ["OS", "MS Word", "BIOS", "Driver"], ans: 1 },
      { q: "Which is an output device?", opts: ["Keyboard", "Mouse", "Monitor", "Scanner"], ans: 2 },
      { q: "What manages hardware resources?", opts: ["Application", "System Software", "Utility", "Driver"], ans: 1 },
      { q: "What is system software?", opts: ["Operating System", "MS Word", "Games", "Browser"], ans: 0 },
      { q: "What is utility software?", opts: ["Antivirus", "OS", "Word", "Excel"], ans: 0 },
      { q: "Which is input device?", opts: ["Scanner", "Printer", "Monitor", "Speaker"], ans: 0 },
      { q: "What is hardware?", opts: ["Physical components", "Software", "Data", "Programs"], ans: 0 },
      { q: "What is software?", opts: ["Programs", "Hardware", "Data", "Devices"], ans: 0 },
      { q: "Which is both input and output?", opts: ["Touchscreen", "Keyboard", "Mouse", "Printer"], ans: 0 },
      { q: "What is firmware?", opts: ["Software in hardware", "Hardware", "Data", "Network"], ans: 0 }
    ],
    "topic-programming-languages": [
      { q: "Which is a programming language?", opts: ["HTML", "Java", "CSS", "XML"], ans: 1 },
      { q: "What is Python?", opts: ["OS", "Programming Language", "Browser", "Database"], ans: 1 },
      { q: "Which language is used for web development?", opts: ["C++", "JavaScript", "Assembly", "Machine"], ans: 1 },
      { q: "What is C language?", opts: ["Programming language", "OS", "Browser", "Database"], ans: 0 },
      { q: "What is C++?", opts: ["Object-oriented language", "Markup language", "OS", "Browser"], ans: 0 },
      { q: "What is Java?", opts: ["Platform-independent language", "OS", "Browser", "Hardware"], ans: 0 },
      { q: "What is HTML?", opts: ["Markup language", "Programming language", "OS", "Browser"], ans: 0 },
      { q: "What is SQL?", opts: ["Database language", "Programming language", "OS", "Browser"], ans: 0 },
      { q: "What is assembly language?", opts: ["Low-level language", "High-level language", "OS", "Browser"], ans: 0 },
      { q: "What is machine language?", opts: ["Binary code", "High-level code", "OS", "Browser"], ans: 0 }
    ],
    "topic-data-communication": [
      { q: "What is bandwidth?", opts: ["Data speed", "Storage", "Memory", "Processor"], ans: 0 },
      { q: "Which is a communication medium?", opts: ["Fiber optic", "RAM", "ROM", "Cache"], ans: 0 },
      { q: "What is a protocol?", opts: ["Rules", "Device", "Software", "Hardware"], ans: 0 },
      { q: "What is data transmission?", opts: ["Sending data", "Storing data", "Processing data", "Deleting data"], ans: 0 },
      { q: "What is a modem?", opts: ["Modulator-demodulator", "Memory", "Processor", "Storage"], ans: 0 },
      { q: "What is a router?", opts: ["Network device", "Storage", "Memory", "Processor"], ans: 0 },
      { q: "What is Ethernet?", opts: ["Network standard", "OS", "Browser", "Software"], ans: 0 },
      { q: "What is Wi-Fi?", opts: ["Wireless network", "Wired network", "Storage", "Memory"], ans: 0 },
      { q: "What is Bluetooth?", opts: ["Wireless technology", "Wired technology", "Storage", "Memory"], ans: 0 },
      { q: "What is data rate?", opts: ["Speed of transmission", "Storage size", "Memory size", "Processor speed"], ans: 0 }
    ],
    "topic-internet-browsers-viruses-network": [
      { q: "Which is a search engine?", opts: ["Google", "Chrome", "Firefox", "Edge"], ans: 0 },
      { q: "What is malware?", opts: ["Good software", "Malicious software", "OS", "Browser"], ans: 1 },
      { q: "What is network topology?", opts: ["Layout", "Speed", "Size", "Color"], ans: 0 },
      { q: "Which is a web browser?", opts: ["Chrome", "Google", "Yahoo", "Bing"], ans: 0 },
      { q: "What is a virus?", opts: ["Malicious program", "Good program", "OS", "Browser"], ans: 0 },
      { q: "What is a firewall?", opts: ["Security system", "Browser", "OS", "Software"], ans: 0 },
      { q: "What is phishing?", opts: ["Fraud attempt", "Virus", "Browser", "OS"], ans: 0 },
      { q: "What is Gmail?", opts: ["Email service", "Browser", "OS", "Virus"], ans: 0 },
      { q: "What is star topology?", opts: ["Network layout", "Browser", "OS", "Software"], ans: 0 },
      { q: "What is bus topology?", opts: ["Network layout", "Browser", "OS", "Software"], ans: 0 }
    ],
    "topic-ms-office": [
      { q: "In Excel, what is a cell?", opts: ["Intersection", "Row", "Column", "Sheet"], ans: 0 },
      { q: "In PowerPoint, what is a slide?", opts: ["Page", "Document", "Sheet", "Cell"], ans: 0 },
      { q: "In Word, what is formatting?", opts: ["Styling", "Saving", "Opening", "Closing"], ans: 0 },
      { q: "In Excel, what is SUM function?", opts: ["Adds numbers", "Averages", "Counts", "Finds max"], ans: 0 },
      { q: "In Word, what is a table?", opts: ["Grid of cells", "Text", "Image", "Chart"], ans: 0 },
      { q: "In PowerPoint, what is animation?", opts: ["Motion effect", "Text", "Image", "Sound"], ans: 0 },
      { q: "In Excel, what is a chart?", opts: ["Visual representation", "Text", "Formula", "Function"], ans: 0 },
      { q: "In Word, what is header?", opts: ["Top section", "Bottom section", "Side section", "Middle section"], ans: 0 },
      { q: "In Excel, what is AVERAGE function?", opts: ["Calculates average", "Adds", "Counts", "Finds max"], ans: 0 },
      { q: "In PowerPoint, what is a theme?", opts: ["Design template", "Text", "Image", "Animation"], ans: 0 }
    ],
    "topic-shortcut-keys": [
      { q: "What does Ctrl+Z do?", opts: ["Undo", "Redo", "Copy", "Paste"], ans: 0 },
      { q: "What does Ctrl+A do?", opts: ["Select All", "Copy", "Paste", "Cut"], ans: 0 },
      { q: "What does Alt+F4 do?", opts: ["Close", "Open", "Save", "Print"], ans: 0 },
      { q: "What does Ctrl+Y do?", opts: ["Redo", "Undo", "Copy", "Paste"], ans: 0 },
      { q: "What does Ctrl+F do?", opts: ["Find", "Format", "File", "Font"], ans: 0 },
      { q: "What does Ctrl+H do?", opts: ["Replace", "Help", "Home", "Hide"], ans: 0 },
      { q: "What does Ctrl+B do?", opts: ["Bold", "Back", "Bookmark", "Browser"], ans: 0 },
      { q: "What does Ctrl+I do?", opts: ["Italic", "Insert", "Info", "Image"], ans: 0 },
      { q: "What does Ctrl+U do?", opts: ["Underline", "Undo", "Update", "Upload"], ans: 0 },
      { q: "What does Ctrl+P do?", opts: ["Print", "Paste", "Page", "Program"], ans: 0 }
    ],
    "topic-important-notes": [
      { q: "What are sticky notes?", opts: ["Reminder notes", "Storage", "Memory", "Processor"], ans: 0 },
      { q: "What is a digital notebook?", opts: ["Electronic notes", "Paper", "Book", "File"], ans: 0 },
      { q: "What is note-taking software?", opts: ["Evernote", "Word", "Excel", "PowerPoint"], ans: 0 },
      { q: "What is OneNote?", opts: ["Note app", "Browser", "OS", "Virus"], ans: 0 },
      { q: "What are meeting notes?", opts: ["Notes from meetings", "Storage", "Memory", "Processor"], ans: 0 },
      { q: "What is a voice note?", opts: ["Audio recording", "Text note", "Image", "Video"], ans: 0 },
      { q: "What is a handwritten note?", opts: ["Written by hand", "Typed", "Printed", "Digital"], ans: 0 },
      { q: "What is a reminder note?", opts: ["Alert note", "Storage", "Memory", "Processor"], ans: 0 },
      { q: "What is a to-do note?", opts: ["Task list", "Storage", "Memory", "Processor"], ans: 0 },
      { q: "What is a study note?", opts: ["Learning notes", "Storage", "Memory", "Processor"], ans: 0 }
    ]
  };
  
  // Generate more variations by creating combinations and variations
  const baseTemplates = templates[topicId] || [];
  const generatedQuestions = [];
  
  // Generate questions by cycling through templates and creating variations
  for (let i = 0; i < count; i++) {
    const templateIndex = i % baseTemplates.length;
    const variationNum = Math.floor(i / baseTemplates.length);
    const template = baseTemplates[templateIndex];
    
    // Create variation by slightly modifying the question
    let questionText = template.q;
    if (variationNum > 0) {
      // Add variation number or modify question slightly
      questionText = `${template.q}${variationNum > 0 ? ` (Question ${i + 1})` : ''}`;
    }
    
    // Shuffle options for variations
    const shuffledIndices = [0, 1, 2, 3];
    for (let j = shuffledIndices.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffledIndices[j], shuffledIndices[k]] = [shuffledIndices[k], shuffledIndices[j]];
    }
    
    const shuffledOptions = shuffledIndices.map(idx => template.opts[idx]);
    const newCorrectAnswer = shuffledIndices.indexOf(template.ans);
    
    generatedQuestions.push({
      question_en: questionText,
      question_hi: questionText, // Can be translated later
      options_en: shuffledOptions,
      options_hi: shuffledOptions, // Can be translated later
      correctAnswer: newCorrectAnswer,
      marks: 1,
      negativeMarks: 0,
      explanation_en: `This question is about ${topicName}.`,
      explanation_hi: `यह प्रश्न ${topicName_hi} के बारे में है।`
    });
  }
  
  return generatedQuestions;
  
  const topicTemplates = templates[topicId] || [];
  
  for (let i = 0; i < count; i++) {
    const template = topicTemplates[i % topicTemplates.length];
    const variation = Math.floor(i / topicTemplates.length);
    
    questions.push({
      question_en: `${template.q}${variation > 0 ? ` (V${variation + 1})` : ''}`,
      question_hi: `${template.q}${variation > 0 ? ` (V${variation + 1})` : ''}`,
      options_en: template.opts,
      options_hi: template.opts.map(opt => opt), // Same in Hindi for now
      correctAnswer: template.ans,
      marks: 1,
      negativeMarks: 0,
      explanation_en: `This question is about ${topicName}.`,
      explanation_hi: `यह प्रश्न ${topicName_hi} के बारे में है।`
    });
  }
  
  return questions;
}

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

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const createdTopics = [];
    const errors = [];

    // Delete "das" topic if it exists
    try {
      const dasTopic = await Topic.findOne({ topicId: "das" });
      if (dasTopic) {
        // Delete all questions for "das" topic
        await TopicWiseMCQ.deleteMany({ topicId: "das" });
        // Delete the topic
        await Topic.findOneAndDelete({ topicId: "das" });
        console.log("✅ Deleted 'das' topic and all its questions");
      }
    } catch (error) {
      console.error("Error deleting 'das' topic:", error);
    }

    // Define the 10 topics
    const topicsList = [
      {
        name: "Computers and their evolution and types",
        name_hi: "कंप्यूटर और उनका विकास और प्रकार",
        id: "topic-computers-evolution-types"
      },
      {
        name: "Computer generations & Printers",
        name_hi: "कंप्यूटर पीढ़ियां और प्रिंटर",
        id: "topic-generations-printers"
      },
      {
        name: "All types of memory",
        name_hi: "सभी प्रकार की मेमोरी",
        id: "topic-memory-types"
      },
      {
        name: "Software and its types and hardware, input and output devices",
        name_hi: "सॉफ़्टवेयर और उसके प्रकार और हार्डवेयर, इनपुट और आउटपुट डिवाइस",
        id: "topic-software-hardware-io"
      },
      {
        name: "All programming languages",
        name_hi: "सभी प्रोग्रामिंग भाषाएं",
        id: "topic-programming-languages"
      },
      {
        name: "Data communication media",
        name_hi: "डेटा संचार मीडिया",
        id: "topic-data-communication"
      },
      {
        name: "Internet browsers and search engines, mail sites, viruses, and network media and topology",
        name_hi: "इंटरनेट ब्राउज़र और सर्च इंजन, मेल साइट्स, वायरस, और नेटवर्क मीडिया और टोपोलॉजी",
        id: "topic-internet-browsers-viruses-network"
      },
      {
        name: "Microsoft Office (Word, Excel, PowerPoint)",
        name_hi: "Microsoft Office (Word, Excel, PowerPoint)",
        id: "topic-ms-office"
      },
      {
        name: "All shortcut keys",
        name_hi: "सभी शॉर्टकट कुंजियां",
        id: "topic-shortcut-keys"
      },
      {
        name: "Important sorts of notes",
        name_hi: "नोट्स के महत्वपूर्ण प्रकार",
        id: "topic-important-notes"
      }
    ];

    // Create 10 topics
    for (let topicNum = 0; topicNum < topicsList.length; topicNum++) {
      try {
        const topicData = topicsList[topicNum];
        const topicName = topicData.name;
        const topicName_hi = topicData.name_hi;
        const topicId = topicData.id;
        
        // Check if topic already exists
        let topic = await Topic.findOne({ topicId });

        if (topic) {
          // Update existing topic
          topic.topicName = topicName;
          topic.topicName_hi = topicName_hi;
          await topic.save();
          
          // Delete existing questions for this topic
          await TopicWiseMCQ.deleteMany({ topicId });
          
          console.log(`✅ Updated topic ${topicNum + 1}/10: ${topicName}`);
        } else {
          // Create new topic
          topic = await Topic.create({
            topicId: topicId,
            topicName: topicName,
            topicName_hi: topicName_hi
          });
          
          console.log(`✅ Created topic ${topicNum + 1}/10: ${topicName}`);
        }

        // Load questions from question bank
        let topicQuestions = [];
        try {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(process.cwd(), 'src', 'data', 'topicwise-questions-bank.json');
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const questionBank = JSON.parse(fileContent);
          topicQuestions = questionBank.topics?.[topicId]?.questions || [];
        } catch (error) {
          console.error(`Error loading questions for ${topicId}:`, error);
        }
        
        // Generate additional questions if needed
        const questionsNeeded = 100;
        const additionalQuestions = generateTopicQuestions(topicData, Math.max(0, questionsNeeded - topicQuestions.length));
        const allQuestions = [...topicQuestions, ...additionalQuestions].slice(0, questionsNeeded);
        
        // Create 100 questions for this topic
        let totalQuestionsCreated = 0;
        for (let qIndex = 0; qIndex < allQuestions.length; qIndex++) {
          const q = allQuestions[qIndex];
          totalQuestionsCreated++;
          const questionId = `${topicId}-q-${qIndex + 1}`;
          
          // Delete any existing question with this id
          await TopicWiseMCQ.deleteOne({ id: questionId });
          
          await TopicWiseMCQ.create({
            id: questionId,
            topicId: topicId,
            topicName: topicName,
            topicName_hi: topicName_hi,
            question_en: q.question_en || `${topicName} - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: q.question_hi || `${topicName_hi} - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: q.options_en || ["Option A", "Option B", "Option C", "Option D"],
            options_hi: q.options_hi || ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
            marks: q.marks || 1,
            negativeMarks: q.negativeMarks || 0,
            explanation_en: q.explanation_en || "",
            explanation_hi: q.explanation_hi || "",
            difficulty: q.difficulty || "medium",
            order: qIndex + 1,
            isFree: false
          });
        }

        createdTopics.push({
          topicId: topicId,
          topicName: topicName,
          questions: totalQuestionsCreated
        });

        console.log(`✅ Created ${totalQuestionsCreated} questions for ${topicName}`);

      } catch (error) {
        console.error(`❌ Error creating topic ${topicNum}:`, error);
        errors.push({
          topicNum,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created/updated ${createdTopics.length} topics with 100 questions each`,
      topics: createdTopics,
      summary: {
        total: createdTopics.length,
        totalQuestions: createdTopics.reduce((sum, t) => sum + t.questions, 0)
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Each topic has 100 questions with placeholder content that can be edited through the admin panel. The 'das' topic has been deleted if it existed."
    });

  } catch (error) {
    console.error("Create Topic Wise Topics error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create topics" 
    }, { status: 500 });
  }
}

