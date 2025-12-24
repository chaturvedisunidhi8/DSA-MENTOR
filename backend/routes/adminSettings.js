const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const adminSettingsController = require("../controllers/adminSettingsController");

// Get admin settings (superadmin only)
router.get(
  "/",
  authenticate,
  checkRole("superadmin"),
  adminSettingsController.getAdminSettings
);

// Update admin settings (superadmin only)
router.put(
  "/",
  authenticate,
  checkRole("superadmin"),
  adminSettingsController.updateAdminSettings
);

// Backup database (superadmin only)
router.post(
  "/backup",
  authenticate,
  checkRole("superadmin"),
  adminSettingsController.backupDatabase
);

// Restore database (superadmin only)
router.post(
  "/restore",
  authenticate,
  checkRole("superadmin"),
  adminSettingsController.restoreDatabase
);

module.exports = router;
