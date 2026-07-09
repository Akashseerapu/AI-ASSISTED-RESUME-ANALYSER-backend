const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", authController.register);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post("/login", authController.login);

// @route   POST /api/auth/verify-email
// @desc    Verify email OTP code
// @access  Public
router.post("/verify-email", authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email OTP
// @access  Public
router.post("/resend-verification", authController.resendVerificationOTP);

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token
// @access  Public
router.post("/forgot-password", authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post("/reset-password", authController.resetPassword);

module.exports = router;
