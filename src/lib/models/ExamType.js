import mongoose from "mongoose";

const ExamTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    isTopicWise: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ExamType || mongoose.model("ExamType", ExamTypeSchema);
