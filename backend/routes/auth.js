const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateUser,
  deleteUser,
  updateOwnProfile,
  uploadResume,
  deleteResume,
  uploadProfilePicture,
  deleteProfilePicture,
} = require("../controllers/authController");
const { authenticate, checkPermission } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateOwnProfile);
router.post("/profile/resume", authenticate, upload.single("resume"), uploadResume);
router.delete("/profile/resume", authenticate, deleteResume);
router.post("/profile/picture", authenticate, upload.single("profilePicture"), uploadProfilePicture);
router.delete("/profile/picture", authenticate, deleteProfilePicture);

// Admin routes for user management (requires manage:users permission)
router.put("/users/:id", authenticate, checkPermission("manage:users"), updateUser);
router.delete("/users/:id", authenticate, checkPermission("manage:users"), deleteUser);

module.exports = router;
