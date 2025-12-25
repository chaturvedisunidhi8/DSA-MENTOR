const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const defaultRoles = [
  {
    name: 'superadmin',
    description: 'Full system access with all permissions',
    permissions: ['all'],
    color: '#ef4444',
    isSystem: true
  },
  {
    name: 'client',
    description: 'Standard user with problem-solving access',
    permissions: ['read:problems', 'submit:solutions', 'view:analytics', 'access:mentor'],
    color: '#3b82f6',
    isSystem: true
  },
  {
    name: 'moderator',
    description: 'Can manage problems and view reports',
    permissions: ['read:problems', 'create:problems', 'update:problems', 'view:reports', 'view:analytics'],
    color: '#10b981',
    isSystem: false
  },
  {
    name: 'content-creator',
    description: 'Can create and edit problems',
    permissions: ['read:problems', 'create:problems', 'update:problems'],
    color: '#f59e0b',
    isSystem: false
  }
];

const seedRoles = async () => {
  try {
    await connectDB();

    console.log('Seeding roles...');

    // Create or update roles
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        console.log(`Role "${roleData.name}" already exists, updating permissions...`);
        existingRole.permissions = roleData.permissions;
        existingRole.description = roleData.description;
        existingRole.color = roleData.color;
        existingRole.isSystem = roleData.isSystem;
        await existingRole.save();
      } else {
        console.log(`Creating role "${roleData.name}"...`);
        await Role.create(roleData);
      }
    }

    console.log('\n✓ Roles seeded successfully');

    // Migrate existing users to use roleId
    console.log('\nMigrating users to new role system...');
    
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    const clientRole = await Role.findOne({ name: 'client' });

    // Update superadmin users
    const superadminUsers = await User.find({ role: 'superadmin', roleId: null });
    if (superadminUsers.length > 0) {
      await User.updateMany(
        { role: 'superadmin', roleId: null },
        { $set: { roleId: superadminRole._id } }
      );
      console.log(`✓ Migrated ${superadminUsers.length} superadmin user(s)`);
    }

    // Update client users
    const clientUsers = await User.find({ role: 'client', roleId: null });
    if (clientUsers.length > 0) {
      await User.updateMany(
        { role: 'client', roleId: null },
        { $set: { roleId: clientRole._id } }
      );
      console.log(`✓ Migrated ${clientUsers.length} client user(s)`);
    }

    console.log('\n✓ Migration completed successfully');
    console.log('\nRole Summary:');
    const roles = await Role.find();
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.permissions.join(', ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
