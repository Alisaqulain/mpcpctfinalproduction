import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true, index: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    title_hindi: { type: String, default: "" },
    description: { type: String, default: "" },
    description_hindi: { type: String, default: "" },
    difficulty: { 
      type: String, 
      enum: ["beginner", "intermediate", "advanced", "easy", "medium", "hard"], 
      default: "beginner" 
    },
    estimatedTime: { type: String, default: "5 minutes" },
    content: {
      english: { type: String, default: "" },
      hindi_ramington: { type: String, default: "" },
      hindi_inscript: { type: String, default: "" }
    },
    isFree: { type: Boolean, default: false, index: true },
    lessonType: { type: String, enum: ["alpha", "word"], default: "alpha" },
  },
  { timestamps: true }
);

// Use existing model if available, otherwise create new one
export default mongoose.models.Lesson || mongoose.model("Lesson", LessonSchema);
