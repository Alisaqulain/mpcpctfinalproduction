import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema({
  key: { type: String, enum: ["CPCT", "RSCIT", "CCC", "CUSTOM"], required: true },
  title: { type: String, required: true },
  totalTime: { type: Number, required: true, default: 75 },
  totalQuestions: { type: Number, required: true, default: 75 },
  isFree: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.models.Exam || mongoose.model("Exam", ExamSchema);


