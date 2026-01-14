import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true, unique: true, index: true },
    topicName: { type: String, required: true },
    topicName_hi: { type: String, default: '' },
    isFree: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Topic || mongoose.model("Topic", TopicSchema);

