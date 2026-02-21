import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SkillLesson from "@/lib/models/SkillLesson";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const contentType = searchParams.get("contentType");
    
    const query = {};
    if (language) query.language = language;
    if (contentType) query.contentType = contentType;
    
    const lessons = await SkillLesson.find(query).sort({ order: 1, createdAt: 1 });
    
    return NextResponse.json({ 
      success: true,
      lessons 
    });
  } catch (error) {
    console.error("Error fetching skill lessons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}






