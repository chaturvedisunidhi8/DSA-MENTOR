const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const reportsController = require("../controllers/reportsController");

// Get report by type (superadmin only)
router.get(
  "/:type",
  authenticate,
  checkRole("superadmin"),
  reportsController.getReport
);

module.exports = router;
