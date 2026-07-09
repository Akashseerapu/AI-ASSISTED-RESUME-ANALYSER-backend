const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

// @route   GET /api/user/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", auth, userController.getProfile);

// @route   PUT /api/user/profile
// @desc    Update user profile name/email
// @access  Private
router.put("/profile", auth, userController.updateProfile);

// @route   PUT /api/user/password
// @desc    Change user account password
// @access  Private
router.put("/password", auth, userController.changePassword);

// @route   DELETE /api/user/account
// @desc    Delete user account and cascade erase all data
// @access  Private
router.delete("/account", auth, userController.deleteAccount);

module.exports = router;
