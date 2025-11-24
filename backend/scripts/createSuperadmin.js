const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// User schema (simplified)
const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    role: String,
    problemsSolved: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    currentLevel: { type: String, default: "Expert" },
    streak: { type: Number, default: 0 },
    focusAreas: { type: [String], default: [] },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

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

      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "superadmin";
      await existingAdmin.save();

      console.log("✅ Superadmin password updated successfully!");
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create superadmin
      await User.create({
        username: username,
        email: email,
        password: hashedPassword,
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
