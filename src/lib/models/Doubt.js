import mongoose from "mongoose";

const DoubtSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    timestampSeconds: { type: Number, required: true, min: 0, index: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
    resolvedAt: { type: Date },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

DoubtSchema.index({ videoId: 1, createdAt: -1 });

export default mongoose.models.Doubt || mongoose.model("Doubt", DoubtSchema);

