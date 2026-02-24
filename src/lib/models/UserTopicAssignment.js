import mongoose from "mongoose";

const UserTopicAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topicId: { type: String, required: true, index: true },
    topicName: { type: String, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin who assigned
    description: { type: String },
  },
  { timestamps: true }
);

// Index for efficient queries
UserTopicAssignmentSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export default mongoose.models.UserTopicAssignment || mongoose.model("UserTopicAssignment", UserTopicAssignmentSchema);

