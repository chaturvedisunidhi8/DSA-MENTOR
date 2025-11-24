const jwt = require("jsonwebtoken");

// Generate Access Token (short-lived: 15 minutes)
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

// Generate Refresh Token (long-lived: 7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

// Verify Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
