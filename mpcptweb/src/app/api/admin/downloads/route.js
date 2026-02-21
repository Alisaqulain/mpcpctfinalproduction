import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Download from "@/lib/models/Download";
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

export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    const filter = {};
    if (type) filter.type = type;
    
    const downloads = await Download.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ downloads });
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch downloads' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const body = await req.json();
    const { id, type, title, title_hi, description, description_hi, fileUrl, thumbnailUrl, fileSize, duration, category, order, isFree } = body;
    
    if (!id || !type || !title || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields: id, type, title, and fileUrl are required" }, { status: 400 });
    }
    
    // Check if download ID already exists
    const existing = await Download.findOne({ id });
    if (existing) {
      return NextResponse.json({ error: `Download with ID "${id}" already exists` }, { status: 400 });
    }
    
    const download = await Download.create({
      id,
      type,
      title,
      title_hi: title_hi || '',
      description: description || '',
      description_hi: description_hi || '',
      fileUrl,
      thumbnailUrl: thumbnailUrl || '',
      fileSize: fileSize || '',
      duration: duration || '',
      category: category || '',
      order: order || 0,
      isFree: isFree === true || isFree === 'true'
    });
    
    return NextResponse.json({ download });
  } catch (error) {
    console.error('Error creating download:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: `Download with this ID already exists` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create download' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const body = await req.json();
    const { _id, id, type, title, title_hi, description, description_hi, fileUrl, thumbnailUrl, fileSize, duration, category, order, isFree } = body;
    
    if (!_id) {
      return NextResponse.json({ error: "Missing _id field" }, { status: 400 });
    }
    
    const updateData = {};
    if (id) updateData.id = id;
    if (type) updateData.type = type;
    if (title) updateData.title = title;
    if (title_hi !== undefined) updateData.title_hi = title_hi;
    if (description !== undefined) updateData.description = description;
    if (description_hi !== undefined) updateData.description_hi = description_hi;
    if (fileUrl) updateData.fileUrl = fileUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (duration !== undefined) updateData.duration = duration;
    if (category !== undefined) updateData.category = category;
    if (order !== undefined) updateData.order = order;
    if (isFree !== undefined) updateData.isFree = isFree === true || isFree === 'true';
    
    const updated = await Download.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 });
    }
    
    return NextResponse.json({ download: updated });
  } catch (error) {
    console.error('Error updating download:', error);
    return NextResponse.json({ error: error.message || 'Failed to update download' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get('_id');
    
    if (!_id) {
      return NextResponse.json({ error: "Missing _id parameter" }, { status: 400 });
    }
    
    const deleted = await Download.findByIdAndDelete(_id);
    if (!deleted) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, download: deleted });
  } catch (error) {
    console.error('Error deleting download:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete download' }, { status: 500 });
  }
}

