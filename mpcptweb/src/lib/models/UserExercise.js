import mongoose from "mongoose";

const UserExerciseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, required: true },
    name: { type: String, required: true },
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
    uploadedFileName: {
      type: String,
      default: null
    },
    uploadedFilePath: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
UserExerciseSchema.index({ userId: 1 });

export default mongoose.models.UserExercise || mongoose.model("UserExercise", UserExerciseSchema);

