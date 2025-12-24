const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connection options for production scale (10,000+ users)
    const options = {
      // Connection pool settings for handling multiple concurrent connections
      maxPoolSize: 50, // Maximum 50 connections in pool (suitable for 10k+ users)
      minPoolSize: 10, // Minimum 10 connections always available
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      
      // Automatic index building
      autoIndex: process.env.NODE_ENV !== 'production', // Disable in prod for better performance
      
      // Retry logic
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection Pool: Max ${options.maxPoolSize}, Min ${options.minPoolSize}`);
    
    // Handle connection events for production monitoring
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
