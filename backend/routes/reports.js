const express = require("express");
const router = express.Router();
const { authenticate, checkPermission } = require("../middleware/auth");
const reportsController = require("../controllers/reportsController");

// Get report by type (requires view:reports permission)
router.get(
  "/:type",
  authenticate,
  checkPermission("view:reports"),
  reportsController.getReport
);

module.exports = router;
