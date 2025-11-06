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
  },
  { timestamps: true }
);

export default mongoose.models.Section || mongoose.model("Section", SectionSchema);


