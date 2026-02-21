import mongoose from "mongoose";

const TipSchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true, unique: true, index: true },
    title_en: { type: String, required: true },
    title_hi: { type: String, default: "" },
    paragraph_en: { type: String, default: "" },
    paragraph_hi: { type: String, default: "" },
    steps_en: [{ type: String }],
    steps_hi: [{ type: String }],
    tip_en: { type: String, default: "" },
    tip_hi: { type: String, default: "" },
    imageUrl: { type: String, default: "/homefinger.jpg" },
    cancelText_en: { type: String, default: "Cancel" },
    cancelText_hi: { type: String, default: "रद्द करें" },
    nextText_en: { type: String, default: "Next" },
    nextText_hi: { type: String, default: "आगे" },
  },
  { timestamps: true }
);

// Use existing model if available, otherwise create new one
export default mongoose.models.Tip || mongoose.model("Tip", TipSchema);

