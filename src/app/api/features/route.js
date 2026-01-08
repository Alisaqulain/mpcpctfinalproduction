import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Feature from "@/lib/models/Feature";

// Public endpoint to get active features (applies to all plans)
export async function GET(request) {
  try {
    await dbConnect();
    const features = await Feature.find({ 
      isActive: true
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    
    return NextResponse.json({ features });
  } catch (error) {
    console.error("Features fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
  }
}

