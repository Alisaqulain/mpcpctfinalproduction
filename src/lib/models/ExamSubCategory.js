import mongoose from "mongoose";

/** Level-2 under MainCategory: CPCT, RSCIT, Topic-wise, etc. */
const ExamSubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainCategory",
      required: true,
      index: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    /** Maps to legacy Exam.key / exam-types for existing exams */
    legacyExamTypeKey: {
      type: String,
      default: null,
      index: true,
    },
    /** When true, list page loads topic-wise MCQ instead of Exam collection */
    isTopicWise: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExamSubCategorySchema.index({ categoryId: 1, slug: 1 }, { unique: true });

export default mongoose.models.ExamSubCategory || mongoose.model("ExamSubCategory", ExamSubCategorySchema);
