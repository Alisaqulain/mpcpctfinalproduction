import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Result from "@/lib/models/Result";
import { getAuth } from "@/lib/apiAuth";

/**
 * Authenticated exam submission (JWT). Falls back to body.userId if no token (legacy).
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { user } = await getAuth(req);
    const userId = user?.userId || body.userId || "anonymous";

    const answers = body.answers || {};

    const result = await Result.create({
      userId,
      examId: body.examId,
      examTitle: body.examTitle,
      examType: body.examType,
      userName: body.userName,
      userMobile: body.userMobile,
      userCity: body.userCity,
      answers,
      sectionStats: body.sectionStats || [],
      totalQuestions: body.totalQuestions || 0,
      totalAnswered: body.totalAnswered || 0,
      totalCorrect: body.totalCorrect || 0,
      totalIncorrect: body.totalIncorrect || 0,
      totalScore: body.totalScore || 0,
      totalMaxMarks: body.totalMaxMarks || 0,
      percentage: body.percentage || 0,
      passingMarks: body.passingMarks || 0,
      isPassed: body.isPassed || false,
      typingResults: body.typingResults || [],
      typingSpeed: body.typingSpeed,
      typingAccuracy: body.typingAccuracy,
      timeTaken: body.timeTaken,
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("submit-exam error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Submit failed" },
      { status: 500 }
    );
  }
}
