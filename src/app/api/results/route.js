import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Result from "@/lib/models/Result";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Convert answers Map to object if needed
    const answers = body.answers || {};
    
    const result = await Result.create({
      userId: body.userId || 'anonymous',
      examId: body.examId,
      examTitle: body.examTitle,
      examType: body.examType,
      userName: body.userName,
      userMobile: body.userMobile,
      userCity: body.userCity,
      answers: answers,
      sectionStats: body.sectionStats || [],
      totalQuestions: body.totalQuestions || 0,
      totalAnswered: body.totalAnswered || 0,
      totalCorrect: body.totalCorrect || 0,
      totalIncorrect: body.totalIncorrect || 0,
      totalScore: body.totalScore || 0,
      percentage: body.percentage || 0,
      timeTaken: body.timeTaken,
      submittedAt: new Date()
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error saving result:", error);
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
    
    // If resultId is provided, fetch single result
    if (resultId) {
      const result = await Result.findById(resultId);
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
    
    const results = await Result.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(50);
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH endpoint to mark PDF as downloaded
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { resultId } = body;
    
    if (!resultId) {
      return NextResponse.json(
        { success: false, error: "Result ID is required" },
        { status: 400 }
      );
    }
    
    const result = await Result.findByIdAndUpdate(
      resultId,
      {
        pdfDownloaded: true,
        pdfDownloadedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

