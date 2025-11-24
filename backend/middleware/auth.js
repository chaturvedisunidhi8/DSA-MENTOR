const { verifyAccessToken } = require("../utils/tokenUtils");
const User = require("../models/User");

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
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Update last active
    user.lastActive = Date.now();
    await user.save();

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

module.exports = authenticate;
