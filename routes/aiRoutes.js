const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const aiController = require("../controllers/aiController");

// @route   POST /api/ai/analyze
// @desc    Perform AI evaluation on uploaded resume
// @access  Private
router.post("/analyze", auth, aiController.analyzeResume);

// @route   POST /api/ai/job-match
// @desc    Compare resume text with job description
// @access  Private
router.post("/job-match", auth, aiController.jobMatch);

// @route   GET /api/ai/analyses
// @desc    Get user analyses history
// @access  Private
router.get("/analyses", auth, aiController.getAnalyses);

// @route   GET /api/ai/analyses/:id
// @desc    Get detailed single analysis result
// @access  Private
router.get("/analyses/:id", auth, aiController.getAnalysisDetail);

// @route   GET /api/ai/job-matches
// @desc    Get user job matches history
// @access  Private
router.get("/job-matches", auth, aiController.getJobMatches);

module.exports = router;
