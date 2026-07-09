const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const resumeController = require("../controllers/resumeController");

// @route   POST /api/resume/upload
// @desc    Upload PDF resume and parse text
// @access  Private
router.post("/upload", auth, upload.single("resume"), resumeController.uploadResume);

// @route   GET /api/resume
// @desc    Get all resumes of user
// @access  Private
router.get("/", auth, resumeController.getResumes);

// @route   GET /api/resume/download/:id
// @desc    Download raw PDF resume
// @access  Private
router.get("/download/:id", auth, resumeController.downloadResume);

// @route   DELETE /api/resume/:id
// @desc    Delete resume and related analyses
// @access  Private
router.delete("/:id", auth, resumeController.deleteResume);

module.exports = router;
