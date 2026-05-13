import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    doubtId: { type: mongoose.Schema.Types.ObjectId, ref: "Doubt", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true, index: true },
    type: { type: String, enum: ["text", "video"], default: "text", index: true },
    message: { type: String, default: "" },
    /** For admin solution videos: stored on filesystem, streamed via API */
    videoFilePath: { type: String, default: null },
    videoPublicId: { type: String, default: null, index: true },
    mimeType: { type: String, default: null },
    sizeBytes: { type: Number, default: null },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ doubtId: 1, createdAt: 1 });

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);

