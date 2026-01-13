import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Get key from query parameters
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    
    // Build query
    const query = {};
    if (key) {
      query.key = key;
    }
    
    // Fetch exams from database - sort by title to show Exam 1 first, then 2, 3, etc.
    const exams = await Exam.find(query).sort({ title: 1, createdAt: 1 });
    
    return NextResponse.json({ 
      success: true,
      exams 
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

