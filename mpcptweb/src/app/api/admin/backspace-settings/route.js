import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BackspaceSettings from "@/lib/models/BackspaceSettings";
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

// GET - Fetch all backspace settings
export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    await dbConnect();
    const settings = await BackspaceSettings.find({}).sort({ duration: 1 }).lean();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching backspace settings:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

// POST - Create new backspace setting
export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    await dbConnect();
    const body = await req.json();
    const { duration, backspaceLimit, description, isActive } = body;
    
    if (!duration || backspaceLimit === undefined) {
      return NextResponse.json({ error: "Duration and backspaceLimit are required" }, { status: 400 });
    }
    
    // Check if setting for this duration already exists
    const existing = await BackspaceSettings.findOne({ duration });
    if (existing) {
      return NextResponse.json({ error: `Setting for ${duration} minutes already exists. Use PUT to update.` }, { status: 400 });
    }
    
    const setting = await BackspaceSettings.create({
      duration: Number(duration),
      backspaceLimit: Number(backspaceLimit),
      description: description || `${duration}min-${backspaceLimit} backspace`,
      isActive: isActive !== false
    });
    
    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error creating backspace setting:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: `Setting for this duration already exists` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create setting" }, { status: 500 });
  }
}

// PUT - Update backspace setting
export async function PUT(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    await dbConnect();
    const body = await req.json();
    const { _id, duration, backspaceLimit, description, isActive } = body;
    
    if (!_id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }
    
    const updateData = {};
    if (duration !== undefined) updateData.duration = Number(duration);
    if (backspaceLimit !== undefined) updateData.backspaceLimit = Number(backspaceLimit);
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updated = await BackspaceSettings.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }
    
    return NextResponse.json({ setting: updated });
  } catch (error) {
    console.error("Error updating backspace setting:", error);
    return NextResponse.json({ error: error.message || "Failed to update setting" }, { status: 500 });
  }
}

// DELETE - Delete backspace setting
export async function DELETE(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    
    if (!_id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }
    
    const deleted = await BackspaceSettings.findByIdAndDelete(_id);
    if (!deleted) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting backspace setting:", error);
    return NextResponse.json({ error: error.message || "Failed to delete setting" }, { status: 500 });
  }
}

