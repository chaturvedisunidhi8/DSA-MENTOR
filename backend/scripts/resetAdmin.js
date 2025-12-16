const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const User = require('../models/User');
    
    // Delete existing admin
    await User.deleteOne({ email: 'admin@dsamentor.com' });
    console.log('✅ Deleted existing admin');
    
    // Create new admin (this will trigger the pre-save hook)
    const admin = await User.create({
      username: 'admin',
      email: 'admin@dsamentor.com',
      password: 'SuperAdmin@123',
      role: 'superadmin',
      problemsSolved: 0,
      accuracy: 100,
      currentLevel: 'Expert',
      streak: 0,
      focusAreas: ['System Administration']
    });
    
    console.log('✅ Created new admin');
    console.log('Password is hashed:', admin.password.startsWith('$2'));
    
    // Test password
    const isMatch = await admin.matchPassword('SuperAdmin@123');
    console.log('Password verification test:', isMatch);
    
    console.log('\n📝 Login Credentials:');
    console.log('   Email: admin@dsamentor.com');
    console.log('   Password: SuperAdmin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdmin();
