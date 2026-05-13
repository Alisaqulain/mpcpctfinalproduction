import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    totalTime: { type: Number, required: true, default: 75 },
    totalQuestions: { type: Number, required: true, default: 75 },
    isFree: { type: Boolean, default: false, index: true },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSubCategory",
      default: null,
      index: true,
    },
    durationMinutes: { type: Number },
    totalMarks: { type: Number },
    passingMarks: { type: Number },
    negativeMarking: { type: Boolean, default: false },
    hasTypingSection: { type: Boolean, default: false },
    typingTimeMinutes: { type: Number },
    instructions: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slug: { type: String, sparse: true, lowercase: true, trim: true },
    /** Admin-defined rules, e.g. { mcqMin: 38, englishNwpm: 30, hindiNwpm: 20 } */
    passingRules: { type: mongoose.Schema.Types.Mixed },
    allowResume: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Exam || mongoose.model("Exam", ExamSchema);


