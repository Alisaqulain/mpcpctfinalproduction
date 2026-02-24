import mongoose from "mongoose";

const CharacterLessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    language: { type: String, enum: ["English", "Hindi"], required: true },
    scriptType: { 
      type: String, 
      enum: ["Remington Gail", "Inscript"], 
      required: function() { return this.language === "Hindi"; }
    },
    rowType: { 
      type: String, 
      enum: ["home", "upper", "lower"], 
      required: true 
    },
    characters: [{ type: String }], // Array of characters to practice
    isFree: { type: Boolean, default: false },
    order: { type: Number, default: 0 }, // For ordering lessons within a row
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.CharacterLesson || mongoose.model("CharacterLesson", CharacterLessonSchema);






