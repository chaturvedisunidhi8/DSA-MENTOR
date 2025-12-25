const express = require("express");
const router = express.Router();
const { authenticate, checkPermission } = require("../middleware/auth");
const analyticsController = require("../controllers/analyticsController");

// Get admin analytics (requires view:analytics permission)
router.get(
  "/admin",
  authenticate,
  checkPermission("view:analytics"),
  analyticsController.getAdminAnalytics
);

module.exports = router;
