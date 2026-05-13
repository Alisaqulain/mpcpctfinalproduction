import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import { requireAdmin } from "@/lib/apiAuth";
import crypto from "crypto";

function makeQuestionId() {
  return crypto.randomUUID();
}

/**
 * POST /api/questions — admin bulk create (JSON array).
 * Each item should match existing Question schema (examId, sectionId, etc.).
 */
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const list = body.questions || body;
    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json(
        { error: "Body must be { questions: [...] } with a non-empty array" },
        { status: 400 }
      );
    }
    const prepared = list.map((raw) => {
      const q = { ...raw };
      if (!q.id) q.id = makeQuestionId();
      if (!q.questionType) q.questionType = "MCQ";
      return q;
    });
    const inserted = await Question.insertMany(prepared, { ordered: false });
    return NextResponse.json({
      success: true,
      count: inserted.length,
      insertedIds: inserted.map((d) => d._id),
    });
  } catch (e) {
    console.error("Bulk questions error:", e);
    const partial = e.insertedDocs?.length;
    if (partial) {
      return NextResponse.json(
        {
          success: false,
          partial: true,
          inserted: partial,
          error: e.message,
        },
        { status: 207 }
      );
    }
    return NextResponse.json({ success: false, error: e.message || "Bulk insert failed" }, { status: 500 });
  }
}
