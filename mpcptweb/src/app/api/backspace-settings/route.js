import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BackspaceSettings from "@/lib/models/BackspaceSettings";

// GET - Fetch all backspace settings
export async function GET() {
  try {
    await dbConnect();
    
    const settings = await BackspaceSettings.find({ isActive: true })
      .sort({ duration: 1 })
      .lean();
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Backspace settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch backspace settings" }, { status: 500 });
  }
}

