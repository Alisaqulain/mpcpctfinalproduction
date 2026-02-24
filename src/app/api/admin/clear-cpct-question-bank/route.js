import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";

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

    const body = await req.json();
    const { partName } = body; // Optional: clear only specific part

    // Build query
    let query = {
      examId: "CPCT_QUESTION_BANK"
    };

    // Filter by part name if provided
    if (partName && partName.trim()) {
      query.partName = partName.trim();
    }

    // Count questions before deletion
    const countBefore = await Question.countDocuments(query);

    // Delete questions
    const deleteResult = await Question.deleteMany(query);

    return NextResponse.json({
      success: true,
      message: partName 
        ? `Cleared ${deleteResult.deletedCount} questions from "${partName}" part in CPCT question bank`
        : `Cleared all ${deleteResult.deletedCount} questions from CPCT question bank`,
      deleted: deleteResult.deletedCount,
      partName: partName || "All parts"
    });

  } catch (error) {
    console.error("Error clearing CPCT question bank:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear question bank" },
      { status: 500 }
    );
  }
}



