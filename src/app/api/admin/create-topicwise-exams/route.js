import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Topic from "@/lib/models/Topic";
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

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const createdExams = [];
    const errors = [];

    // Define the 10 topics with their details
    const topicsList = [
      {
        name: "Computers and their evolution and types",
        name_hi: "कंप्यूटर और उनका विकास और प्रकार",
        id: "topic-computers-evolution-types",
        isFree: true
      },
      {
        name: "Computer generations & Printers",
        name_hi: "कंप्यूटर पीढ़ियां और प्रिंटर",
        id: "topic-generations-printers",
        isFree: false
      },
      {
        name: "All types of memory",
        name_hi: "सभी प्रकार की मेमोरी",
        id: "topic-memory-types",
        isFree: false
      },
      {
        name: "Software and its types and hardware, input and output devices",
        name_hi: "सॉफ़्टवेयर और उसके प्रकार और हार्डवेयर, इनपुट और आउटपुट डिवाइस",
        id: "topic-software-hardware-io",
        isFree: false
      },
      {
        name: "All programming languages",
        name_hi: "सभी प्रोग्रामिंग भाषाएं",
        id: "topic-programming-languages",
        isFree: false
      },
      {
        name: "Data communication media",
        name_hi: "डेटा संचार मीडिया",
        id: "topic-data-communication",
        isFree: false
      },
      {
        name: "Internet browsers and search engines, mail sites, viruses, and network media and topology",
        name_hi: "इंटरनेट ब्राउज़र और सर्च इंजन, मेल साइट्स, वायरस, और नेटवर्क मीडिया और टोपोलॉजी",
        id: "topic-internet-browsers-viruses-network",
        isFree: false
      },
      {
        name: "Microsoft Office (Word, Excel, PowerPoint)",
        name_hi: "Microsoft Office (Word, Excel, PowerPoint)",
        id: "topic-ms-office",
        isFree: false
      },
      {
        name: "All shortcut keys",
        name_hi: "सभी शॉर्टकट कुंजियां",
        id: "topic-shortcut-keys",
        isFree: false
      },
      {
        name: "Important sorts of notes",
        name_hi: "नोट्स के महत्वपूर्ण प्रकार",
        id: "topic-important-notes",
        isFree: false
      }
    ];

    // Create 10 topic-wise exams
    for (let topicNum = 0; topicNum < topicsList.length; topicNum++) {
      try {
        const topicData = topicsList[topicNum];
        const topicName = topicData.name;
        const topicName_hi = topicData.name_hi;
        const topicId = topicData.id;
        const isFree = topicData.isFree;

        // Create or update Topic
        let topic = await Topic.findOne({ topicId });
        if (!topic) {
          topic = await Topic.create({
            topicId: topicId,
            topicName: topicName,
            topicName_hi: topicName_hi,
            isFree: isFree
          });
          console.log(`✅ Created topic: ${topicName}`);
        } else {
          topic.topicName = topicName;
          topic.topicName_hi = topicName_hi;
          topic.isFree = isFree;
          await topic.save();
          console.log(`✅ Updated topic: ${topicName}`);
        }

        // Create Exam for this topic
        const examTitle = `Topic Wise: ${topicName}`;
        const examId = `topicwise-exam-${topicId}`;

        // Check if exam already exists
        let exam = await Exam.findOne({
          key: "CUSTOM",
          title: examTitle
        });

        if (!exam) {
          // Create new exam
          exam = await Exam.create({
            key: "CUSTOM",
            title: examTitle,
            totalTime: 90, // 90 minutes
            totalQuestions: 100, // 100 questions
            isFree: isFree // First topic is free, others are paid
          });
          console.log(`✅ Created exam: ${examTitle}`);
        } else {
          // Update existing exam
          exam.totalTime = 90;
          exam.totalQuestions = 100;
          exam.isFree = isFree;
          await exam.save();
          console.log(`✅ Updated exam: ${examTitle}`);
        }

        // Create Section for the exam (single section with 100 questions)
        const sectionId = `${examId}-section-main`;
        let section = await Section.findOne({
          examId: exam._id,
          id: sectionId
        });

        if (!section) {
          section = await Section.create({
            id: sectionId,
            name: topicName,
            examId: exam._id,
            lessonNumber: 1,
            order: 1,
            minimumMarks: 50, // Minimum 50 marks (50%) to pass
            maxMarks: 100 // 100 questions × 1 mark = 100 marks
          });
          console.log(`✅ Created section for: ${topicName}`);
        } else {
          section.name = topicName;
          section.order = 1;
          section.lessonNumber = 1;
          section.minimumMarks = 50; // 50% passing marks
          section.maxMarks = 100;
          await section.save();
          console.log(`✅ Updated section for: ${topicName}`);
        }

        // Create Part for the section
        const partId = `${sectionId}-part-topicwise`;
        let part = await Part.findOne({
          examId: exam._id,
          sectionId: section._id,
          id: partId
        });

        if (!part) {
          part = await Part.create({
            id: partId,
            name: topicName,
            examId: exam._id,
            sectionId: section._id,
            order: 1
          });
          console.log(`✅ Created part for: ${topicName}`);
        } else {
          part.name = topicName;
          part.order = 1;
          await part.save();
          console.log(`✅ Updated part for: ${topicName}`);
        }

        createdExams.push({
          examId: exam._id.toString(),
          examTitle: examTitle,
          topicId: topicId,
          topicName: topicName,
          isFree: isFree,
          totalTime: 90,
          totalQuestions: 100,
          passingMarks: 50
        });

      } catch (error) {
        console.error(`❌ Error creating exam for topic ${topicNum + 1}:`, error);
        errors.push({
          topicNum: topicNum + 1,
          topicName: topicsList[topicNum].name,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdExams.length} topic-wise exams`,
      createdExams: createdExams,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error creating topic-wise exams:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create topic-wise exams" },
      { status: 500 }
    );
  }
}


















