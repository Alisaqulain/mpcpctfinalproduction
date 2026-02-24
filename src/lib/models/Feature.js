import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "✓" }, // Icon or emoji for the feature
    order: { type: Number, default: 0 }, // For ordering features
    isActive: { type: Boolean, default: true },
    showTick: { type: Boolean, default: true }, // Show tick (✓) or wrong (✗) mark
    showWrong: { type: Boolean, default: false } // Show wrong mark instead of tick
  },
  { timestamps: true }
);

export default mongoose.models.Feature || mongoose.model("Feature", FeatureSchema);

