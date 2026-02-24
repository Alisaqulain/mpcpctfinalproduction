import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CharacterLesson from "@/lib/models/CharacterLesson";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const rowType = searchParams.get("rowType");
    
    const query = {};
    if (language) query.language = language;
    if (rowType) query.rowType = rowType;
    
    const lessons = await CharacterLesson.find(query).sort({ order: 1, createdAt: 1 });
    
    return NextResponse.json({ 
      success: true,
      lessons 
    });
  } catch (error) {
    console.error("Error fetching character lessons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}






