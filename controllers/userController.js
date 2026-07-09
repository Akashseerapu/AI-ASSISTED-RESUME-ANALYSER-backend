const User = require("../models/User");
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const JobMatch = require("../models/JobMatch");
const bcrypt = require("bcryptjs");
const fs = require("fs");

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      // Check if email already registered
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      user.email = email;
    }

    if (name) user.name = name;

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please enter both old and new passwords" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Set and save new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete User Account & Cascade Delete everything
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all user resumes to clean up files
    const resumes = await Resume.find({ user: user._id });
    for (const resume of resumes) {
      if (fs.existsSync(resume.filePath)) {
        try {
          fs.unlinkSync(resume.filePath);
        } catch (err) {
          console.error(`Failed to delete physical file: ${resume.filePath}`, err.message);
        }
      }
    }

    // Cascade delete DB collections for this user
    await Resume.deleteMany({ user: user._id });
    await Analysis.deleteMany({ user: user._id });
    await JobMatch.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({ message: "Your account and all associated data have been permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting account", error: error.message });
  }
};
