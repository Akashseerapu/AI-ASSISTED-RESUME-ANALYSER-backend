const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // One portfolio per user
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    title: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    about: {
      type: String,
      default: ""
    },
    skills: [
      {
        type: String
      }
    ],
    experience: [
      {
        company: { type: String, default: "" },
        role: { type: String, default: "" },
        duration: { type: String, default: "" },
        description: { type: String, default: "" }
      }
    ],
    projects: [
      {
        name: { type: String, default: "" },
        description: { type: String, default: "" },
        link: { type: String, default: "" },
        imageUrl: { type: String, default: "" }
      }
    ],
    education: [
      {
        school: { type: String, default: "" },
        degree: { type: String, default: "" },
        duration: { type: String, default: "" }
      }
    ],
    theme: {
      type: String,
      default: "modern-dark" // Options: "modern-dark", "glassmorphism", "sleek-light", "cyberpunk"
    },
    profileImage: {
      type: String,
      default: ""
    },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" }
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", PortfolioSchema);
