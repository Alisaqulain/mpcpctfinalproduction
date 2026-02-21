import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Feature from "@/lib/models/Feature";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return { ok: false, error: "Unauthorized" };
    }
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }
    return { ok: true, userId: payload.userId };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

// Get all features (admin)
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();
    const features = await Feature.find({})
      .sort({ order: 1, createdAt: 1 });
    
    return NextResponse.json({ features });
  } catch (error) {
    console.error("Features fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
  }
}

// Create new feature (admin)
export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await request.json();
    const { title, description, icon, order, isActive, showTick, showWrong } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    await dbConnect();
    const feature = new Feature({
      title,
      description,
      icon: icon || "✓",
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      showTick: showTick !== undefined ? showTick : true,
      showWrong: showWrong !== undefined ? showWrong : false
    });

    await feature.save();
    return NextResponse.json({ feature, message: "Feature created successfully" });
  } catch (error) {
    console.error("Feature creation error:", error);
    return NextResponse.json({ error: "Failed to create feature" }, { status: 500 });
  }
}

// Update feature (admin)
export async function PUT(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await request.json();
    const { _id, title, description, icon, order, isActive, showTick, showWrong } = body;

    if (!_id) {
      return NextResponse.json({ error: "Feature ID is required" }, { status: 400 });
    }

    await dbConnect();
    const feature = await Feature.findById(_id);
    
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    if (title !== undefined) feature.title = title;
    if (description !== undefined) feature.description = description;
    if (icon !== undefined) feature.icon = icon;
    if (order !== undefined) feature.order = order;
    if (isActive !== undefined) feature.isActive = isActive;
    if (showTick !== undefined) feature.showTick = showTick;
    if (showWrong !== undefined) feature.showWrong = showWrong;

    await feature.save();
    return NextResponse.json({ feature, message: "Feature updated successfully" });
  } catch (error) {
    console.error("Feature update error:", error);
    return NextResponse.json({ error: "Failed to update feature" }, { status: 500 });
  }
}

// Delete feature (admin)
export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Feature ID is required" }, { status: 400 });
    }

    await dbConnect();
    const feature = await Feature.findByIdAndDelete(id);
    
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Feature deletion error:", error);
    return NextResponse.json({ error: "Failed to delete feature" }, { status: 500 });
  }
}

// Initialize default features (admin)
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await request.json();
    if (body.action !== 'initialize') {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await dbConnect();
    
    // Check if features already exist - if yes, skip initialization
    const existingFeatures = await Feature.countDocuments();
    if (existingFeatures > 0) {
      return NextResponse.json({ 
        message: "Features already exist", 
        features: await Feature.find({}).sort({ order: 1 })
      });
    }

    // Default features (applies to all plans)
    const defaultFeatures = [
      {
        title: "Unlimited Learning",
        description: "Access to all learning materials (Learning, Skill Test, Exam)",
        icon: "📚",
        order: 0,
        isActive: true,
        showTick: true,
        showWrong: false
      },
      {
        title: "Skill Test",
        description: "Practice with skill tests to improve your performance",
        icon: "🎯",
        order: 1,
        isActive: true,
        showTick: true,
        showWrong: false
      },
      {
        title: "Exam Mode",
        description: "Take full-length exams in exam mode",
        icon: "📝",
        order: 2,
        isActive: true,
        showTick: true,
        showWrong: false
      },
      {
        title: "Free PDF",
        description: "Download free PDF materials",
        icon: "📄",
        order: 3,
        isActive: true,
        showTick: true,
        showWrong: false
      },
      {
        title: "Syllabus PDF",
        description: "Access complete syllabus in PDF format",
        icon: "📋",
        order: 4,
        isActive: true,
        showTick: true,
        showWrong: false
      },
      {
        title: "Video Notes",
        description: "Watch video notes for better understanding",
        icon: "📹",
        order: 5,
        isActive: true,
        showTick: true,
        showWrong: false
      }
    ];

    const createdFeatures = await Feature.insertMany(defaultFeatures);
    
    return NextResponse.json({ 
      message: "Default features initialized successfully", 
      features: createdFeatures 
    });
  } catch (error) {
    console.error("Feature initialization error:", error);
    return NextResponse.json({ error: "Failed to initialize features" }, { status: 500 });
  }
}

