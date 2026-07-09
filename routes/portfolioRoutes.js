const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const portfolioController = require("../controllers/portfolioController");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "portfolio-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// Image File Filter
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Error: Only images (jpeg, jpg, png, webp, gif) are allowed!"));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});

// @route   GET /api/portfolio
// @desc    Get user portfolio config
// @access  Private
router.get("/", auth, portfolioController.getPortfolio);

// @route   PUT /api/portfolio
// @desc    Update user portfolio config
// @access  Private
router.put("/", auth, portfolioController.updatePortfolio);

// @route   GET /api/portfolio/public/:slug
// @desc    Get public portfolio by slug
// @access  Public
router.get("/public/:slug", portfolioController.getPublicPortfolio);

// @route   POST /api/portfolio/upload
// @desc    Upload portfolio media (profile/project image)
// @access  Private
router.post("/upload", auth, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }
    // Return relative url path accessible from the client
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ message: "Server error during media upload", error: error.message });
  }
});

module.exports = router;
