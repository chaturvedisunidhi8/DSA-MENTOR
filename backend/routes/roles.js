const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

// Define all available permissions
const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'All Permissions', category: 'System' },
  { id: 'read:problems', label: 'View Problems', category: 'Problems' },
  { id: 'create:problems', label: 'Create Problems', category: 'Problems' },
  { id: 'update:problems', label: 'Update Problems', category: 'Problems' },
  { id: 'delete:problems', label: 'Delete Problems', category: 'Problems' },
  { id: 'submit:solutions', label: 'Submit Solutions', category: 'Solutions' },
  { id: 'view:analytics', label: 'View Analytics', category: 'Analytics' },
  { id: 'view:reports', label: 'View Reports', category: 'Reports' },
  { id: 'manage:users', label: 'Manage Users', category: 'Users' },
  { id: 'manage:roles', label: 'Manage Roles', category: 'Roles' },
  { id: 'access:mentor', label: 'Access AI Mentor', category: 'Features' },
  { id: 'manage:settings', label: 'Manage Settings', category: 'System' },
];

// Get all available permissions
router.get(
  "/permissions",
  authenticate,
  checkRole("superadmin"),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: AVAILABLE_PERMISSIONS
      });
    } catch (error) {
      console.error("Get permissions error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Mock role storage (in production, this would be in database)
let roles = [
  {
    id: 1,
    name: 'Super Admin',
    description: 'Full system access with all administrative privileges',
    permissions: ['all'],
    userCount: 2,
    color: '#ef4444',
    isSystem: true // System roles cannot be deleted
  },
  {
    id: 2,
    name: 'Client',
    description: 'Standard user access for problem solving',
    permissions: ['read:problems', 'submit:solutions', 'view:analytics', 'access:mentor'],
    userCount: 150,
    color: '#4ade80',
    isSystem: true
  }
];

let nextRoleId = 3;

// Get all roles - accessible only by superadmin
router.get(
  "/",
  authenticate,
  checkRole("superadmin"),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Create new role - accessible only by superadmin
router.post(
  "/",
  authenticate,
  checkRole("superadmin"),
  async (req, res) => {
    try {
      const { name, description, permissions, color } = req.body;

      // Validation
      if (!name || !description || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "Name, description, and permissions array are required"
        });
      }

      if (name.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Role name must be at least 3 characters"
        });
      }

      if (permissions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one permission must be selected"
        });
      }

      // Check if role name already exists
      const existingRole = roles.find(r => r.name.toLowerCase() === name.trim().toLowerCase());
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: "Role with this name already exists"
        });
      }

      // Create new role
      const newRole = {
        id: nextRoleId++,
        name: name.trim(),
        description: description.trim(),
        permissions,
        color: color || '#4ade80',
        userCount: 0,
        isSystem: false
      };

      roles.push(newRole);

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: newRole
      });
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Update role - accessible only by superadmin
router.put(
  "/:id",
  authenticate,
  checkRole("superadmin"),
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { name, description, permissions, color } = req.body;

      const roleIndex = roles.findIndex(r => r.id === roleId);
      if (roleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Role not found"
        });
      }

      const role = roles[roleIndex];

      // Cannot modify system roles' core properties
      if (role.isSystem && role.name === 'Super Admin') {
        return res.status(403).json({
          success: false,
          message: "Cannot modify Super Admin role"
        });
      }

      // Validation
      if (name && name.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Role name must be at least 3 characters"
        });
      }

      if (permissions && (!Array.isArray(permissions) || permissions.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "At least one permission must be selected"
        });
      }

      // Check if new name conflicts with existing role
      if (name && name.toLowerCase() !== role.name.toLowerCase()) {
        const existingRole = roles.find(r => r.id !== roleId && r.name.toLowerCase() === name.trim().toLowerCase());
        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: "Role with this name already exists"
          });
        }
      }

      // Update role
      roles[roleIndex] = {
        ...role,
        name: name ? name.trim() : role.name,
        description: description ? description.trim() : role.description,
        permissions: permissions || role.permissions,
        color: color || role.color
      };

      res.status(200).json({
        success: true,
        message: "Role updated successfully",
        data: roles[roleIndex]
      });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Delete role - accessible only by superadmin
router.delete(
  "/:id",
  authenticate,
  checkRole("superadmin"),
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);

      const roleIndex = roles.findIndex(r => r.id === roleId);
      if (roleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Role not found"
        });
      }

      const role = roles[roleIndex];

      // Cannot delete system roles
      if (role.isSystem) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete system roles"
        });
      }

      // Cannot delete role with assigned users
      if (role.userCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role with ${role.userCount} assigned user(s). Reassign users first.`
        });
      }

      roles.splice(roleIndex, 1);

      res.status(200).json({
        success: true,
        message: "Role deleted successfully"
      });
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

module.exports = router;
