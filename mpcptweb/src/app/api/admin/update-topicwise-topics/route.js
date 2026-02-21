import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Topic from "@/lib/models/Topic";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, error: "Unauthorized" };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== "admin") return { ok: false, error: "Forbidden" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();

    // Topic names to update
    const topicsToUpdate = [
      {
        topicName: "Computers and their evolution and types",
        topicName_hi: "कंप्यूटर और उनका विकास और प्रकार",
        isFree: true
      },
      {
        topicName: "Computer generations & Printers",
        topicName_hi: "कंप्यूटर पीढ़ियां और प्रिंटर",
        isFree: false
      },
      {
        topicName: "All types of memory",
        topicName_hi: "सभी प्रकार की मेमोरी",
        isFree: false
      },
      {
        topicName: "Software and its types and hardware, input and output devices",
        topicName_hi: "सॉफ़्टवेयर और उसके प्रकार और हार्डवेयर, इनपुट और आउटपुट डिवाइस",
        isFree: false
      },
      {
        topicName: "All programming languages",
        topicName_hi: "सभी प्रोग्रामिंग भाषाएं",
        isFree: false
      },
      {
        topicName: "Data communication media",
        topicName_hi: "डेटा संचार मीडिया",
        isFree: false
      },
      {
        topicName: "Internet browsers and search engines, mail sites, viruses, and network media and topology",
        topicName_hi: "इंटरनेट ब्राउज़र और सर्च इंजन, मेल साइट्स, वायरस, और नेटवर्क मीडिया और टोपोलॉजी",
        isFree: false
      },
      {
        topicName: "Microsoft Office (Word, Excel, PowerPoint)",
        topicName_hi: "Microsoft Office (Word, Excel, PowerPoint)",
        isFree: false
      },
      {
        topicName: "All shortcut keys",
        topicName_hi: "सभी शॉर्टकट कुंजियां",
        isFree: false
      }
    ];

    const results = [];
    const existingTopics = await Topic.find({}).sort({ createdAt: 1 });

    // Update existing topics
    for (let i = 0; i < Math.min(topicsToUpdate.length, existingTopics.length); i++) {
      const topicUpdate = topicsToUpdate[i];
      const existingTopic = existingTopics[i];
      
      existingTopic.topicName = topicUpdate.topicName;
      existingTopic.topicName_hi = topicUpdate.topicName_hi;
      existingTopic.isFree = topicUpdate.isFree;
      await existingTopic.save();

      // Also update all questions with this topicId
      await TopicWiseMCQ.updateMany(
        { topicId: existingTopic.topicId },
        { 
          $set: { 
            topicName: topicUpdate.topicName,
            topicName_hi: topicUpdate.topicName_hi
          } 
        }
      );

      results.push({
        topicId: existingTopic.topicId,
        topicName: topicUpdate.topicName,
        updated: true
      });
    }

    // Create new topics if there are more in the list than existing
    for (let i = existingTopics.length; i < topicsToUpdate.length; i++) {
      const topicUpdate = topicsToUpdate[i];
      const topicId = `topic-${i + 1}`;
      
      const newTopic = await Topic.create({
        topicId: topicId,
        topicName: topicUpdate.topicName,
        topicName_hi: topicUpdate.topicName_hi,
        isFree: topicUpdate.isFree
      });

      results.push({
        topicId: newTopic.topicId,
        topicName: topicUpdate.topicName,
        created: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${results.length} topics`,
      results 
    });
  } catch (error) {
    console.error('Error updating topics:', error);
    return NextResponse.json({ error: error.message || 'Failed to update topics' }, { status: 500 });
  }
}





















