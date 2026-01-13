import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    examId: { type: String, required: true, index: true },
    examTitle: { type: String, required: true },
    examType: { type: String, required: true },
    userName: { type: String, required: true },
    userMobile: { type: String },
    userCity: { type: String },
    // Answers: questionId -> selectedAnswerIndex (stored as object)
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Section-wise statistics
    sectionStats: [{
      sectionName: String,
      totalQuestions: Number,
      answered: Number,
      notAnswered: Number,
      markedForReview: Number,
      answeredAndMarked: Number,
      notVisited: Number,
      correct: Number,
      incorrect: Number,
      score: Number
    }],
    // Overall statistics
    totalQuestions: { type: Number, required: true },
    totalAnswered: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalIncorrect: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    timeTaken: { type: Number }, // in seconds
    submittedAt: { type: Date, default: Date.now },
    pdfDownloaded: { type: Boolean, default: false }, // Track if PDF was downloaded
    pdfDownloadedAt: { type: Date } // Track when PDF was downloaded
  },
  { timestamps: true }
);

export default mongoose.models.Result || mongoose.model("Result", ResultSchema);

