import mongoose from "mongoose";

const TopicWiseMCQSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    topicId: { type: String, required: true, index: true }, // Topic/Chapter ID
    topicName: { type: String, required: true },
    topicName_hi: { type: String }, // Hindi topic name
    question_en: { type: String, required: true },
    question_hi: { type: String },
    options_en: [{ type: String, required: true }],
    options_hi: [{ type: String }],
    correctAnswer: { type: Number, required: true },
    marks: { type: Number, default: 1 }, // Marks per question
    negativeMarks: { type: Number, default: 0 }, // Negative marks for wrong answer
    imageUrl: { type: String }, // Image URL for question
    explanation_en: { type: String },
    explanation_hi: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false, index: true },
    solutionVideoLink: { type: String }, // Video link for solution (e.g., Google Drive link)
  },
  { timestamps: true }
);

export default mongoose.models.TopicWiseMCQ || mongoose.model("TopicWiseMCQ", TopicWiseMCQSchema);

