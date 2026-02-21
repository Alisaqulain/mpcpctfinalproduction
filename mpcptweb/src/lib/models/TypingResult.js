import mongoose from "mongoose";

const TypingResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userMobile: { type: String },
    userCity: { type: String },
    exerciseId: { type: String, required: true },
    exerciseName: { type: String, required: true },
    language: { type: String, required: true }, // English, Hindi
    subLanguage: { type: String }, // Ramington Gail, Inscript
    duration: { type: Number, required: true }, // in minutes
    backspaceEnabled: { type: Boolean, default: false },
    // Typing statistics
    grossSpeed: { type: Number, required: true }, // WPM
    netSpeed: { type: Number, required: true }, // WPM
    totalWords: { type: Number, required: true },
    correctWords: { type: Number, required: true },
    wrongWords: { type: Number, required: true },
    accuracy: { type: Number, required: true }, // percentage
    timeTaken: { type: Number, required: true }, // in seconds
    backspaceCount: { type: Number, default: 0 },
    errors: [{ type: String }], // Array of error strings like "THGe [The]"
    finalResult: { type: String, required: true }, // PASS or FAIL
    remarks: { type: String }, // Fair, Good, Excellent, etc.
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.TypingResult || mongoose.model("TypingResult", TypingResultSchema);

