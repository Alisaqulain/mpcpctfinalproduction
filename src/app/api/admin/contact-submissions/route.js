import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ContactSubmission from "@/lib/models/ContactSubmission";
import { requireAdmin } from "@/lib/apiAuth";
import { isValidObjectId } from "@/lib/objectId";

export const runtime = "nodejs";

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = {};
    if (status) query.status = status;

    const [submissions, newCount] = await Promise.all([
      ContactSubmission.find(query).sort({ createdAt: -1 }).limit(500).lean(),
      ContactSubmission.countDocuments({ status: "new" }),
    ]);

    return NextResponse.json({ success: true, submissions, newCount });
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json(
      { error: "Failed to load contact submissions" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { _id, status } = body;

    if (!_id || !isValidObjectId(_id)) {
      return NextResponse.json({ error: "Valid _id is required" }, { status: 400 });
    }

    if (!["new", "read", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await ContactSubmission.findByIdAndUpdate(
      _id,
      { status },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error("Error updating contact submission:", error);
    return NextResponse.json(
      { error: "Failed to update contact submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");

    if (!_id || !isValidObjectId(_id)) {
      return NextResponse.json({ error: "Valid _id is required" }, { status: 400 });
    }

    const deleted = await ContactSubmission.findByIdAndDelete(_id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    return NextResponse.json(
      { error: "Failed to delete contact submission" },
      { status: 500 }
    );
  }
}
