const mongoose = require("mongoose");

const JobMatchSchema = new mongoose.Schema(
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
    jobDescription: {
      type: String,
      required: true
    },
    matchPercentage: {
      type: Number,
      required: true
    },
    missingSkills: [{ type: String }],
    matchingSkills: [{ type: String }],
    recommendedSkills: [{ type: String }],
    recommendation: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobMatch", JobMatchSchema);
