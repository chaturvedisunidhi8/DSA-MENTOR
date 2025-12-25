const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const achievementController = require("../controllers/achievementController");

// Get all achievements definitions
router.get("/", achievementController.getAllAchievements);

// Get user's achievement progress (requires authentication)
router.get("/user", authenticate, achievementController.getUserAchievements);

module.exports = router;
