import mongoose from "mongoose";

const ExamStartLogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    city: { type: String, required: true, trim: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", default: null, index: true },
    examTitle: { type: String, default: "" },
    topicId: { type: String, default: "", index: true },
    topicName: { type: String, default: "" },
    examType: { type: String, default: "", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true }
);

ExamStartLogSchema.index({ createdAt: -1 });

export default mongoose.models.ExamStartLog ||
  mongoose.model("ExamStartLog", ExamStartLogSchema);
