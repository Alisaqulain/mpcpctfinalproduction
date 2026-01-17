import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    examId: { type: String, required: true, index: true },
    sectionId: { type: String, required: true, index: true },
    partId: { type: String, index: true }, // Optional for backward compatibility
    id: { type: String, required: true, unique: true },
    questionType: { type: String, enum: ['MCQ', 'TYPING'], default: 'MCQ' },
    // MCQ fields
    question_en: { type: String },
    question_hi: { type: String },
    options_en: [{ type: String }],
    options_hi: [{ type: String }],
    correctAnswer: { type: Number },
    explanation_en: { type: String },
    explanation_hi: { type: String },
    passage_en: { type: String },
    passage_hi: { type: String },
    // Typing fields
    typingLanguage: { type: String, enum: ['English', 'Hindi'] },
    typingScriptType: { type: String, enum: ['Ramington Gail', 'Inscript'] }, // Only for Hindi
    typingContent_english: { type: String },
    typingContent_hindi_ramington: { type: String },
    typingContent_hindi_inscript: { type: String },
    typingDuration: { type: Number }, // in minutes
    typingBackspaceEnabled: { type: Boolean, default: false },
    isFree: { type: Boolean, default: false, index: true },
    marks: { type: Number, default: 1 }, // Marks per question
    imageUrl: { 
      type: String,
      // Remove default and validation that might interfere
      // Just let it be a simple String field
    }, // Image URL for question
    negativeMarks: { type: Number, default: 0 }, // Negative marks for wrong answer (optional)
    questionNumber: { type: Number }, // Question number from source paper
    paperName: { type: String }, // Paper name/identifier (e.g., "21th Nov 2025 Shift2 QP1")
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model("Question", QuestionSchema);


