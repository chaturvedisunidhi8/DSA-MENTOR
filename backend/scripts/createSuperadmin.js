const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import the actual User model with password hashing
const User = require("../models/User");

async function createSuperadmin() {
  try {
    console.log('🔄 Starting superadmin creation process...\n');
    
    // Validate environment variables first
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const username = process.env.SUPERADMIN_USERNAME;

    if (!email || !password || !username) {
      console.error("❌ ERROR: Missing superadmin credentials in .env file\n");
      console.log("Required environment variables:");
      console.log("   - SUPERADMIN_EMAIL");
      console.log("   - SUPERADMIN_PASSWORD");
      console.log("   - SUPERADMIN_USERNAME");
      console.log("\n💡 Please add these to your .env file in the backend directory");
      console.log("📝 See .env.example for reference\n");
      process.exit(1);
    }

    // Validate MONGO_URI exists
    if (!process.env.MONGO_URI) {
      console.error("❌ ERROR: MONGO_URI not found in .env file\n");
      console.log("💡 Add MONGO_URI to your .env file, for example:");
      console.log("   MONGO_URI=mongodb://localhost:27017/dsa-mentor\n");
      process.exit(1);
    }

    console.log('📊 Configuration:');
    console.log(`   Database: ${process.env.MONGO_URI}`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}\n`);

    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB successfully\n");

    // Check if superadmin already exists
    console.log('🔍 Checking for existing superadmin account...');
    const existingAdmin = await User.findOne({ email });
    
    if (existingAdmin) {
      console.log(`⚠️  Superadmin already exists with email: ${email}`);
      console.log('🔄 Updating credentials...\n');

      // Update password (User model pre-save hook will hash it)
      existingAdmin.password = password;
      existingAdmin.username = username;
      existingAdmin.role = "superadmin";
      await existingAdmin.save();

      console.log("✅ Superadmin account updated successfully!");
    } else {
      console.log('👤 Creating new superadmin account...\n');
      
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

      console.log("✅ Superadmin account created successfully!");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 SETUP COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📝 Login Credentials:");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     superadmin`);
    console.log("\n🌐 Login URL:");
    console.log(`   ${process.env.CLIENT_URL || 'http://localhost:5173'}/login`);
    console.log("\n⚠️  SECURITY REMINDER:");
    console.log("   • Change your password immediately after first login");
    console.log("   • Never share these credentials");
    console.log("   • Use a strong, unique password\n");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error("\n💡 TROUBLESHOOTING:");
      console.error("   MongoDB connection refused. Possible solutions:");
      console.error("   1. Start MongoDB service:");
      console.error("      - Linux: sudo systemctl start mongod");
      console.error("      - macOS: brew services start mongodb-community");
      console.error("      - Windows: net start MongoDB");
      console.error("   2. Verify MongoDB is running: mongosh");
      console.error("   3. Check MONGO_URI in .env file\n");
    } else if (error.code === 11000) {
      console.error("\n💡 TROUBLESHOOTING:");
      console.error("   Duplicate key error - username or email already exists");
      console.error("   This might be from a previous user with the same credentials\n");
    }
    
    console.error("Full error details:", error);
    process.exit(1);
  }
}

createSuperadmin();
