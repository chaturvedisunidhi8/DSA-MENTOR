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
} = require("../controllers/authController");
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);

// Admin routes for user management
router.put("/users/:id", authenticate, checkRole("superadmin"), updateUser);
router.delete("/users/:id", authenticate, checkRole("superadmin"), deleteUser);

module.exports = router;
