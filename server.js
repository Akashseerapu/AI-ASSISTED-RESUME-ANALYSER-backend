require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Connect to Database
connectDB();

const app = express();
const apiKey = process.env.GEMINI_API_KEY;

console.log("Mailer Configured:", {
  method: (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) ? "Gmail API (OAuth2)" : (process.env.EMAIL_HOST ? "SMTP" : "None"),
  user: process.env.EMAIL_USER
});


// Rate limiting middleware to protect endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use("/api", limiter);

// Configure CORS dynamically to allow any local development port (e.g. 5173, 5174, etc.)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
    if (isLocalhost || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors({ origin: true, credentials: true }));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder (optional helper)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes Modules
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/portfolio", require("./routes/portfolioRoutes"));

// Health Check API (for keep-alives and sanity checking)
app.get("/api/health", (req, res) => {
  res.json({ status: "online", message: "AI Resume Analyzer Backend API is running." });
});

// Serve frontend static assets in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React frontend/dist folder
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Catch-all route to serve React's index.html for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
} else {
  // Base Check API for local development
  app.get("/", (req, res) => {
    res.json({ status: "online", message: "AI Resume Analyzer Backend API is running in development." });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Custom Multer error handling
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File is too large. Max size allowed is 5MB." });
  }

  res.status(err.status || 500).json({
    message: err.message || "An unexpected server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
