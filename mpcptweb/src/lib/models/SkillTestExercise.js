import mongoose from "mongoose";

const SkillTestExerciseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    lessonId: { type: String, default: "" }, // Optional link to lesson from learning section
    content: {
      english: { type: String, default: "" },
      hindi_ramington: { type: String, default: "" },
      hindi_inscript: { type: String, default: "" }
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "easy", "medium", "hard"],
      default: "beginner"
    },
    isFree: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 }, // For ordering exercises
  },
  { timestamps: true }
);

export default mongoose.models.SkillTestExercise || mongoose.model("SkillTestExercise", SkillTestExerciseSchema);

