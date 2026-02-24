import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TypingResult from "@/lib/models/TypingResult";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const result = await TypingResult.create({
      userId: body.userId || 'anonymous',
      userName: body.userName,
      userMobile: body.userMobile,
      userCity: body.userCity,
      exerciseId: body.exerciseId,
      exerciseName: body.exerciseName,
      language: body.language,
      subLanguage: body.subLanguage,
      duration: body.duration,
      backspaceEnabled: body.backspaceEnabled || false,
      grossSpeed: body.grossSpeed,
      netSpeed: body.netSpeed,
      totalWords: body.totalWords,
      correctWords: body.correctWords,
      wrongWords: body.wrongWords,
      accuracy: body.accuracy,
      timeTaken: body.timeTaken,
      backspaceCount: body.backspaceCount || 0,
      errors: body.errors || [],
      finalResult: body.finalResult,
      remarks: body.remarks,
      submittedAt: new Date()
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error saving typing result:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const resultId = searchParams.get("resultId");
    
    if (resultId) {
      // Get single result by ID
      const result = await TypingResult.findById(resultId);
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Result not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, result });
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const results = await TypingResult.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(50);
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error fetching typing results:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

