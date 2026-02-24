import mongoose from "mongoose";

const PartSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure unique part IDs within a section
PartSchema.index({ id: 1, sectionId: 1 }, { unique: true });

export default mongoose.models.Part || mongoose.model("Part", PartSchema);

