const { verifyAccessToken } = require("../utils/tokenUtils");
const User = require("../models/User");
const Role = require("../models/Role");

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user and attach to request
    const user = await User.findById(decoded.id)
      .select("-password -refreshToken")
      .populate('roleId', 'name permissions');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Update last active (don't await to improve response time - fire and forget)
    user.lastActive = Date.now();
    user.save().catch(err => console.error('Failed to update lastActive:', err));

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

// Permission checking middleware
const checkPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // Get user permissions from multiple sources
      let userPermissions = [];

      // 1. Get permissions from roleId (database Role)
      if (req.user.roleId && req.user.roleId.permissions) {
        userPermissions = [...req.user.roleId.permissions];
      }

      // 2. Get permissions from user's custom permissions array
      if (req.user.permissions && req.user.permissions.length > 0) {
        userPermissions = [...userPermissions, ...req.user.permissions];
      }

      // 3. Fallback: if using old role string and no roleId, grant default permissions
      if (!req.user.roleId && req.user.role === 'superadmin') {
        userPermissions = ['all'];
      } else if (!req.user.roleId && req.user.role === 'client') {
        userPermissions = ['read:problems', 'submit:solutions', 'view:analytics', 'access:mentor'];
      }

      // Check if user has 'all' permission (superadmin)
      if (userPermissions.includes('all')) {
        return next();
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          required: requiredPermissions,
          userPermissions: userPermissions
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
        error: error.message
      });
    }
  };
};

// Get user's effective permissions (helper for frontend)
const getUserPermissions = (user) => {
  let permissions = [];

  if (user.roleId && user.roleId.permissions) {
    permissions = [...user.roleId.permissions];
  }

  if (user.permissions && user.permissions.length > 0) {
    permissions = [...permissions, ...user.permissions];
  }

  // Fallback for old role string
  if (!user.roleId && user.role === 'superadmin') {
    permissions = ['all'];
  } else if (!user.roleId && user.role === 'client') {
    permissions = ['read:problems', 'submit:solutions', 'view:analytics', 'access:mentor'];
  }

  // Remove duplicates
  return [...new Set(permissions)];
};

module.exports = { authenticate, checkPermission, getUserPermissions };
module.exports.default = authenticate;

