import mongoose from "mongoose";

const DoubtMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, required: true, trim: true },
    attachment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const DoubtSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoCourse", index: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    timestamp: { type: Number, required: true, min: 0, index: true },
    /** Alias for legacy API */
    timestampSeconds: { type: Number, min: 0 },
    message: { type: String, required: true, trim: true },
    attachment: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "replied", "closed", "open", "resolved"],
      default: "pending",
      index: true,
    },
    messages: [DoubtMessageSchema],
    resolvedAt: { type: Date },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

DoubtSchema.pre("save", function syncTimestamp(next) {
  if (this.timestamp == null && this.timestampSeconds != null) {
    this.timestamp = this.timestampSeconds;
  }
  if (this.timestampSeconds == null && this.timestamp != null) {
    this.timestampSeconds = this.timestamp;
  }
  next();
});

DoubtSchema.index({ videoId: 1, createdAt: -1 });

export default mongoose.models.Doubt || mongoose.model("Doubt", DoubtSchema);
