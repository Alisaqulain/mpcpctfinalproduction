import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    lessonNumber: { type: Number, required: true },
    // Optional fields for exam sections
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    order: { type: Number, default: 0 },
    // Typing section timing (in minutes) - if set, this section has separate timing
    typingTime: { type: Number, default: null }, // null means no separate timing, uses main exam timer
  },
  { timestamps: true }
);

export default mongoose.models.Section || mongoose.model("Section", SectionSchema);


