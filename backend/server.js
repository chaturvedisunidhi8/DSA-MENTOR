const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const problemRoutes = require("./routes/problems");
const rolesRoutes = require("./routes/roles");
const interviewRoutes = require("./routes/interview");

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'SUPERADMIN_EMAIL',
  'SUPERADMIN_PASSWORD',
  'SUPERADMIN_USERNAME'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Please create a .env file in the backend directory with all required variables.');
  console.error('💡 See .env.example for a template.\n');
  process.exit(1);
}

// Validate JWT secrets are not default values
if (process.env.ACCESS_TOKEN_SECRET.includes('your_64_character') || 
    process.env.REFRESH_TOKEN_SECRET.includes('your_64_character')) {
  console.error('❌ ERROR: JWT secrets are using default placeholder values!');
  console.error('🔐 Generate secure secrets using:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('\n💡 Update ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET in your .env file.\n');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logger middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/interview", interviewRoutes);

// Health check with database status
app.get("/api/health", async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbStatus,
    mongodb: mongoose.connection.readyState === 1 ? 'ready' : 'not ready'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.CLIENT_URL}`);
});
