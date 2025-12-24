const AdminSettings = require("../models/AdminSettings");
const mongoose = require("mongoose");

// Get admin settings
exports.getAdminSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await AdminSettings.findOne({ userId });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await AdminSettings.create({
        userId,
        emailNotifications: {
          newUsers: true,
          systemAlerts: true,
          reportSummaries: true,
        },
        twoFactorAuth: false,
        sessionTimeout: 30,
        maintenanceMode: false,
        allowNewRegistrations: true,
        pushNotifications: true,
        emailDigest: "weekly",
      });
    }

    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    const dbSizeGB = (dbStats.dataSize / (1024 * 1024 * 1024)).toFixed(2);

    const User = require("../models/User");
    const Problem = require("../models/Problem");
    const Interview = require("../models/Interview");

    const totalUsers = await User.countDocuments();
    const totalProblems = await Problem.countDocuments();
    const totalInterviews = await Interview.countDocuments();
    const totalRecords = totalUsers + totalProblems + totalInterviews;

    const databaseInfo = {
      size: `${dbSizeGB} GB`,
      totalRecords: totalRecords.toLocaleString(),
      collections: dbStats.collections,
      lastBackup: "Manual backup only", // Would need backup service integration
    };

    res.status(200).json({
      success: true,
      data: {
        settings,
        databaseInfo,
      },
    });
  } catch (error) {
    console.error("Get admin settings error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin settings",
      error: error.message,
    });
  }
};

// Update admin settings
exports.updateAdminSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Validate updates
    const allowedFields = [
      "emailNotifications",
      "twoFactorAuth",
      "sessionTimeout",
      "maintenanceMode",
      "allowNewRegistrations",
      "pushNotifications",
      "emailDigest",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    let settings = await AdminSettings.findOne({ userId });

    if (!settings) {
      // Create new settings if they don't exist
      settings = await AdminSettings.create({
        userId,
        ...updateData,
      });
    } else {
      // Update existing settings
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update admin settings error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating admin settings",
      error: error.message,
    });
  }
};

// Database backup (placeholder - would need actual backup service)
exports.backupDatabase = async (req, res) => {
  try {
    // This is a placeholder. In production, you would:
    // 1. Use mongodump or mongoose to export database
    // 2. Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 3. Keep track of backup history
    
    res.status(200).json({
      success: true,
      message: "Database backup initiated. This feature requires integration with a backup service.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database backup error:", error);
    res.status(500).json({
      success: false,
      message: "Error initiating database backup",
      error: error.message,
    });
  }
};

// Database restore (placeholder - would need actual restore service)
exports.restoreDatabase = async (req, res) => {
  try {
    const { backupId } = req.body;

    // This is a placeholder. In production, you would:
    // 1. Validate backup exists
    // 2. Stop all write operations
    // 3. Restore from backup file
    // 4. Verify data integrity
    // 5. Resume operations

    res.status(200).json({
      success: true,
      message: "Database restore feature requires integration with a backup service.",
      backupId,
    });
  } catch (error) {
    console.error("Database restore error:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring database",
      error: error.message,
    });
  }
};

module.exports = exports;
