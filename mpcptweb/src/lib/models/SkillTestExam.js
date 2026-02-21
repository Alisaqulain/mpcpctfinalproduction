import mongoose from "mongoose";

const SkillTestExamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    description_hindi: { type: String, default: "" },
    isFree: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 }, // For ordering exams
  },
  { timestamps: true }
);

export default mongoose.models.SkillTestExam || mongoose.model("SkillTestExam", SkillTestExamSchema);

