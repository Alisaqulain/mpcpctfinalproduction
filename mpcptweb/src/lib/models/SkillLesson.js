import mongoose from "mongoose";

const SkillLessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    language: { type: String, enum: ["English", "Hindi"], required: true },
    scriptType: { 
      type: String, 
      enum: ["Remington Gail", "Inscript"], 
      required: function() { return this.language === "Hindi"; }
    },
    duration: { type: Number, required: true }, // Duration in minutes (1, 3, 5)
    contentType: { 
      type: String, 
      enum: ["word", "paragraph"], 
      required: true 
    },
    textContent: { type: String, required: true }, // The text to type
    isFree: { type: Boolean, default: false },
    order: { type: Number, default: 0 }, // For ordering lessons
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.SkillLesson || mongoose.model("SkillLesson", SkillLessonSchema);






