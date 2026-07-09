const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true
    },
    extractedInfo: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      skills: [{ type: String }],
      projects: [{ type: String }],
      education: [{ type: String }],
      experience: [{ type: String }],
      certifications: [{ type: String }]
    },
    score: {
      type: Number,
      default: 0
    },
    atsScore: {
      type: Number,
      default: 0
    },
    missingKeywords: [{ type: String }],
    grammarSuggestions: [{ type: String }],
    formattingSuggestions: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvementTips: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", AnalysisSchema);
