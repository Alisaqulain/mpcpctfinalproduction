import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserExercise from "@/lib/models/UserExercise";
import User from "@/lib/models/User";
import { jwtVerify } from "jose";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// Simple text extraction from PDF (basic implementation)
async function extractTextFromPDF(filePath) {
  try {
    // For a basic implementation, we'll read the file and try to extract text
    // Note: For production, you'd want to use a proper PDF parsing library like pdf-parse
    const buffer = await readFile(filePath);
    // This is a very basic extraction - in production, use pdf-parse or similar
    const text = buffer.toString('utf-8');
    // Remove binary characters and extract readable text
    return text.replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

// Extract text from Word file (basic .docx extraction)
async function extractTextFromWord(filePath) {
  try {
    // For .docx files, we'd need a library like mammoth or docx
    // For now, return empty - user can manually enter text
    // In production, use: const mammoth = require('mammoth');
    return '';
  } catch (error) {
    console.error('Word extraction error:', error);
    return '';
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    
    const formData = await request.formData();
    const file = formData.get("file");
    const name = formData.get("name");
    const difficulty = formData.get("difficulty") || "beginner";

    if (!file || !name) {
      return NextResponse.json({ error: "File and name are required" }, { status: 400 });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check file type
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload PDF, Word (.doc, .docx), or Text (.txt) files only." 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "user-exercises");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const savedFileName = `${userId}_${timestamp}_${random}.${fileExtension}`;
    const filePath = join(uploadsDir, savedFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extract text from file
    let extractedText = '';
    if (fileExtension === 'txt') {
      extractedText = buffer.toString('utf-8');
    } else if (fileExtension === 'pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (['doc', 'docx'].includes(fileExtension)) {
      extractedText = await extractTextFromWord(filePath);
    }

    // If text extraction failed or returned empty, prompt user to enter manually
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        error: "Could not extract text from file. Please enter the content manually in the form.",
        extractedText: extractedText || "",
        fileName: savedFileName
      }, { status: 400 });
    }

    // Create exercise with extracted text
    const exerciseData = {
      userId,
      userName: user.name || user.phoneNumber || "User",
      name: String(name),
      content: {
        english: extractedText,
        hindi_ramington: "",
        hindi_inscript: ""
      },
      difficulty: difficulty || "beginner",
      uploadedFileName: savedFileName,
      uploadedFilePath: filePath
    };

    const exercise = await UserExercise.create(exerciseData);

    return NextResponse.json({ 
      success: true, 
      exercise,
      message: "Exercise created successfully from file!"
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

