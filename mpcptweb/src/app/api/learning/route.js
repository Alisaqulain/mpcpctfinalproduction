import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import dbConnect from "@/lib/db";
import Section from "@/lib/models/Section";
import Lesson from "@/lib/models/Lesson";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "learningData.json");

// GET - Retrieve learning data from database
export async function GET() {
  try {
    await dbConnect();
    
    // Fetch sections and lessons from database
    // Only get learning sections (sections without examId - exam sections should not appear in learning)
    const sections = await Section.find({ examId: { $exists: false } }).sort({ lessonNumber: 1 }).lean();
    const lessons = await Lesson.find({}).lean();
    
    console.log(`[Learning API] Fetched ${sections.length} sections and ${lessons.length} lessons from database`);
    
    // Read languages and settings from JSON (these are static config)
    let languages, settings, metadata;
    try {
      const staticData = await fs.readFile(DATA_FILE_PATH, "utf8");
      const parsed = JSON.parse(staticData);
      languages = parsed.languages;
      settings = parsed.settings;
      metadata = parsed.metadata;
    } catch (staticError) {
      console.error("Error reading static config:", staticError);
      // Default values if JSON file fails
      languages = { main: [{ id: "english", name: "English", subLanguages: [] }] };
      settings = { durations: [3, 5, 10], backspaceOptions: ["OFF", "ON"] };
      metadata = { version: "1.0", totalLessons: 0, estimatedTotalTime: "0 minutes" };
    }
    
    // Format sections with nested lessons
    const formattedSections = sections.map(section => ({
      id: section.id,
      name: section.name,
      lessonNumber: section.lessonNumber,
      description: section.description || "",
      lessons: lessons
        .filter(lesson => lesson.sectionId === section.id)
        .map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          title_hindi: lesson.title_hindi || "",
          description: lesson.description || "",
          description_hindi: lesson.description_hindi || "",
          difficulty: lesson.difficulty,
          estimatedTime: lesson.estimatedTime,
          content: lesson.content || { english: "", hindi_ramington: "", hindi_inscript: "" },
          isFree: lesson.isFree === true || lesson.isFree === 'true',
          lessonType: lesson.lessonType === "word" ? "word" : "alpha"
        }))
    }));
    
    // Calculate metadata
    const totalLessons = lessons.length;
    const difficultyBreakdown = {};
    lessons.forEach(lesson => {
      difficultyBreakdown[lesson.difficulty] = (difficultyBreakdown[lesson.difficulty] || 0) + 1;
    });
    
    const learningData = {
      languages,
      settings,
      sections: formattedSections,
      metadata: {
        ...metadata,
        totalLessons,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };
    
    return NextResponse.json(learningData);
  } catch (error) {
    console.error("Error reading learning data from database:", error);
    // Only fallback to JSON if database connection fails, not if it's just empty
    if (error.message?.includes('connect') || error.message?.includes('Mongo')) {
      console.log("Database connection failed, falling back to JSON file");
      try {
        const data = await fs.readFile(DATA_FILE_PATH, "utf8");
        const learningData = JSON.parse(data);
        return NextResponse.json(learningData);
      } catch (fallbackError) {
        return NextResponse.json(
          { error: "Failed to load learning data", details: error.message },
          { status: 500 }
        );
      }
    }
    // If database is connected but query fails, return empty structure
    return NextResponse.json({
      languages: { main: [{ id: "english", name: "English", subLanguages: [] }] },
      settings: { durations: [3, 5, 10], backspaceOptions: ["OFF", "ON"] },
      sections: [],
      metadata: { version: "1.0", totalLessons: 0, estimatedTotalTime: "0 minutes", lastUpdated: new Date().toISOString().split('T')[0] }
    });
  }
}

// POST - Update learning data
export async function POST(request) {
  try {
    const updatedData = await request.json();
    
    // Validate the data structure
    if (!updatedData.sections || !Array.isArray(updatedData.sections)) {
      return NextResponse.json(
        { error: "Invalid data structure" },
        { status: 400 }
      );
    }

    // Save the updated data back to the file
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      message: "Learning data updated successfully",
      data: updatedData 
    });
  } catch (error) {
    console.error("Error updating learning data:", error);
    return NextResponse.json(
      { error: "Failed to update learning data" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific lesson
export async function PUT(request) {
  try {
    const { sectionId, lessonId, lessonData } = await request.json();
    
    // Read current data
    const data = await fs.readFile(DATA_FILE_PATH, "utf8");
    const learningData = JSON.parse(data);
    
    // Find and update the specific lesson
    const section = learningData.sections.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }
    
    const lessonIndex = section.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }
    
    // Update the lesson
    section.lessons[lessonIndex] = { ...section.lessons[lessonIndex], ...lessonData };
    
    // Save back to file
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(learningData, null, 2));
    
    return NextResponse.json({ 
      message: "Lesson updated successfully",
      lesson: section.lessons[lessonIndex]
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lesson
export async function DELETE(request) {
  try {
    const { sectionId, lessonId } = await request.json();
    
    // Read current data
    const data = await fs.readFile(DATA_FILE_PATH, "utf8");
    const learningData = JSON.parse(data);
    
    // Find the section
    const section = learningData.sections.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }
    
    // Remove the lesson
    const lessonIndex = section.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }
    
    section.lessons.splice(lessonIndex, 1);
    
    // Save back to file
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(learningData, null, 2));
    
    return NextResponse.json({ 
      message: "Lesson deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
