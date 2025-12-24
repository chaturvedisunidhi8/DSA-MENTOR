const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Email Settings
    emailNotifications: {
      newUsers: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
      reportSummaries: { type: Boolean, default: true },
    },
    // Security Settings
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 }, // minutes
    // Platform Settings
    maintenanceMode: { type: Boolean, default: false },
    allowNewRegistrations: { type: Boolean, default: true },
    // Notification Settings
    pushNotifications: { type: Boolean, default: true },
    emailDigest: { type: String, enum: ["daily", "weekly", "monthly", "never"], default: "weekly" },
  },
  {
    timestamps: true,
  }
);

// Index for fast user lookups
adminSettingsSchema.index({ userId: 1 });

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
