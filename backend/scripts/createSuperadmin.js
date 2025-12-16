const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import the actual User model with password hashing
const User = require("../models/User");

async function createSuperadmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get credentials from .env
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const username = process.env.SUPERADMIN_USERNAME;

    if (!email || !password || !username) {
      console.error("❌ Error: Superadmin credentials not found in .env file");
      console.log(
        "Please set SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, and SUPERADMIN_USERNAME in your .env file"
      );
      process.exit(1);
    }

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("⚠️  Superadmin already exists with email:", email);
      console.log("Updating password...");

      // Update password (User model pre-save hook will hash it)
      existingAdmin.password = password;
      existingAdmin.role = "superadmin";
      await existingAdmin.save();

      console.log("✅ Superadmin password updated successfully!");
    } else {
      // Create superadmin (User model pre-save hook will hash password)
      await User.create({
        username: username,
        email: email,
        password: password,
        role: "superadmin",
        problemsSolved: 0,
        accuracy: 100,
        currentLevel: "Expert",
        streak: 0,
        focusAreas: ["System Administration"],
      });

      console.log("✅ Superadmin created successfully!");
    }

    console.log("\n📝 Login Credentials:");
    console.log("   Email:", email);
    console.log("   Password:", password);
    console.log(
      "\n⚠️  Remember to change these credentials after first login!\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating superadmin:", error.message);
    process.exit(1);
  }
}

createSuperadmin();
