const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const JobMatch = require("../models/JobMatch");
const { extractTextFromPDF } = require("../utils/pdfParser");
const fs = require("fs");
const path = require("path");

// Upload Resume and extract text
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Extract text from PDF
    let extractedText = "";
    try {
      extractedText = await extractTextFromPDF(filePath);
    } catch (parseError) {
      // Clean up uploaded file if parsing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(422).json({ message: parseError.message });
    }

    // Save to Database
    const resume = new Resume({
      user: req.user.id,
      fileName,
      filePath,
      extractedText
    });

    await resume.save();

    res.status(201).json({
      message: "Resume uploaded and processed successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        createdAt: resume.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during upload", error: error.message });
  }
};

// Get all resumes for user
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .select("-extractedText -filePath")
      .sort({ createdAt: -1 });

    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching resumes", error: error.message });
  }
};

// Download resume PDF
exports.downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (!fs.existsSync(resume.filePath)) {
      return res.status(404).json({ message: "Physical file not found on server" });
    }

    res.download(resume.filePath, resume.fileName);
  } catch (error) {
    res.status(500).json({ message: "Server error downloading resume", error: error.message });
  }
};

// Delete Resume
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Delete physically
    if (fs.existsSync(resume.filePath)) {
      try {
        fs.unlinkSync(resume.filePath);
      } catch (err) {
        console.error("Failed to delete physical file:", err.message);
      }
    }

    // Delete cascading items
    await Analysis.deleteMany({ resume: resume._id });
    await JobMatch.deleteMany({ resume: resume._id });

    // Delete record
    await Resume.deleteOne({ _id: resume._id });

    res.json({ message: "Resume and associated analyses deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting resume", error: error.message });
  }
};
