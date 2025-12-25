const express = require("express");
const router = express.Router();
const { authenticate, checkPermission } = require("../middleware/auth");
const adminSettingsController = require("../controllers/adminSettingsController");

// Get admin settings (requires manage:settings permission)
router.get(
  "/",
  authenticate,
  checkPermission("manage:settings"),
  adminSettingsController.getAdminSettings
);

// Update admin settings (requires manage:settings permission)
router.put(
  "/",
  authenticate,
  checkPermission("manage:settings"),
  adminSettingsController.updateAdminSettings
);

// Backup database (requires manage:settings permission)
router.post(
  "/backup",
  authenticate,
  checkPermission("manage:settings"),
  adminSettingsController.backupDatabase
);

// Restore database (requires manage:settings permission)
router.post(
  "/restore",
  authenticate,
  checkPermission("manage:settings"),
  adminSettingsController.restoreDatabase
);

module.exports = router;
