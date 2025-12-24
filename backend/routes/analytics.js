const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const analyticsController = require("../controllers/analyticsController");

// Get admin analytics (superadmin only)
router.get(
  "/admin",
  authenticate,
  checkRole("superadmin"),
  analyticsController.getAdminAnalytics
);

module.exports = router;
