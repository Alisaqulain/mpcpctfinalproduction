import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Pricing from "@/lib/models/Pricing";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();
    const pricing = await Pricing.find({}).sort({ type: 1 });
    
    return NextResponse.json({ pricing });
  } catch (error) {
    console.error("Pricing fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const { type, plans } = body;

    if (!type || !plans) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate discounts
    const updatedPlans = { ...plans };
    Object.keys(updatedPlans).forEach(key => {
      const plan = updatedPlans[key];
      if (plan.originalPrice > 0) {
        plan.discount = Math.round(
          ((plan.originalPrice - plan.price) / plan.originalPrice) * 100
        );
      }
    });

    const pricing = await Pricing.findOneAndUpdate(
      { type },
      { type, plans: updatedPlans, isActive: true },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, pricing });
  } catch (error) {
    console.error("Pricing save error:", error);
    return NextResponse.json({ error: "Failed to save pricing" }, { status: 500 });
  }
}

