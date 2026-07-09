const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOTPEmail, sendVerificationEmail } = require("../utils/mailer");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: emailLower });
    
    // Generate a 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    let user;
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      // If user registered but never verified, we update details and send new OTP
      user = existingUser;
      user.name = name;
      user.password = password;
      user.verificationOTP = otp;
      user.verificationOTPExpires = otpExpires;
    } else {
      // Create unverified user
      user = new User({
        name,
        email: emailLower,
        password,
        isVerified: false,
        verificationOTP: otp,
        verificationOTPExpires: otpExpires
      });
    }

    await user.save();

    // Trigger verification email
    await sendVerificationEmail(user.email, otp);

    res.status(201).json({
      message: "Verification code sent to your email (check your spam folder if you don't see it). Please enter it to complete registration.",
      email: user.email,
      devOTP: process.env.NODE_ENV === "development" ? otp : undefined // Include code in response for easier local testing/development
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const emailLower = email.toLowerCase().trim();

    // Check user existence
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check verification status
    if (!user.isVerified) {
      // Generate a new verification OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = otp;
      user.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      
      await sendVerificationEmail(user.email, otp);

      return res.status(400).json({
        status: "unverified",
        message: "Your email address is not verified. A verification code has been sent to your email (check your spam folder if you don't see it).",
        email: user.email,
        devOTP: process.env.NODE_ENV === "development" ? otp : undefined
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code (OTP) are required" });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({
      email: emailLower,
      verificationOTP: otp,
      verificationOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code (OTP)" });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpires = null;
    await user.save();

    // Generate token for automatic login
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during email verification", error: error.message });
  }
};

// Resend Verification OTP
exports.resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This email address is already verified." });
    }

    // Generate a new 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = otp;
    user.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, otp);

    res.json({
      message: "A new verification code has been sent to your email (check your spam folder if you don't see it).",
      devOTP: process.env.NODE_ENV === "development" ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during resend", error: error.message });
  }
};

// Forgot Password (OTP generation and delivery)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address" });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      // Return success regardless to prevent user enumeration attacks
      return res.json({
        message: "If an account exists with that email, a verification code has been sent."
      });
    }

    // Generate a 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Trigger transactional mailer
    await sendOTPEmail(user.email, otp);

    res.json({
      message: "If an account exists with that email, a verification code has been sent (check your spam folder if you don't see it).",
      devOTP: process.env.NODE_ENV === "development" ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during forgot password", error: error.message });
  }
};

// Reset Password (OTP validation and hash updates)
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    
    if (!email || !otp || !password) {
      return res.status(400).json({ message: "Email, verification code (OTP), and new password are required" });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({
      email: emailLower,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code (OTP)" });
    }

    // Hash and update password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save();

    res.json({ message: "Password reset successful! You can now log in with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Server error during password reset", error: error.message });
  }
};
