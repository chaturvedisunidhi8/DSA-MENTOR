const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");
const { parseResume } = require("../utils/resumeParser");
const fs = require("fs");
const path = require("path");

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create user (only superadmin can create superadmin accounts)
    const userRole =
      role === "superadmin"
        ? req.user && req.user.role === "superadmin"
          ? "superadmin"
          : "client"
        : "client";

    const user = await User.create({
      username,
      email,
      password,
      role: userRole,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          problemsSolved: user.problemsSolved,
          accuracy: user.accuracy,
          currentLevel: user.currentLevel,
          streak: user.streak,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update refresh token in database
    user.refreshToken = refreshToken;
    user.lastActive = Date.now();
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          problemsSolved: user.problemsSolved,
          accuracy: user.accuracy,
          currentLevel: user.currentLevel,
          streak: user.streak,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found. Please login again.",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token matches
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token. Please login again.",
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    // Optionally rotate refresh token (recommended for security)
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    // Update cookie with new refresh token
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token",
      error: error.message,
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Clear refresh token from database
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken"
    );

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
      error: error.message,
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user",
      error: error.message,
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting user",
      error: error.message,
    });
  }
};

// Update own profile (for authenticated users)
const updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, bio, phone, github, linkedin, skills, experience, education } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if username or email is being changed and already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    // Update profile fields
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];
    if (experience !== undefined) user.experience = experience;
    if (education !== undefined) user.education = education;

    await user.save();

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update own profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: error.message,
    });
  }
};

// Upload and parse resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old resume file if exists
    if (user.resumeUrl) {
      const oldFilePath = path.join(__dirname, "..", user.resumeUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Parse the resume
    const parseResult = await parseResume(req.file.path);

    // Update user with resume data
    user.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    user.resumeUploadedAt = new Date();

    if (parseResult.success && parseResult.data) {
      // Auto-populate fields from resume if they're empty
      const { data } = parseResult;
      
      if (!user.phone && data.phone) user.phone = data.phone;
      if (!user.github && data.github) user.github = data.github;
      if (!user.linkedin && data.linkedin) user.linkedin = data.linkedin;
      if (!user.experience && data.experience) user.experience = data.experience;
      if (!user.education && data.education) user.education = data.education;
      
      // Merge skills
      if (data.skills && data.skills.length > 0) {
        const existingSkills = new Set(user.skills);
        data.skills.forEach(skill => existingSkills.add(skill));
        user.skills = Array.from(existingSkills);
      }

      user.resumeData = {
        ...data,
        rawText: parseResult.rawText,
        parsedAt: new Date(),
      };
    }

    await user.save();

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
      success: true,
      message: "Resume uploaded and parsed successfully",
      user: userResponse,
      parsedData: parseResult.data,
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading resume",
      error: error.message,
    });
  }
};

// Delete resume
const deleteResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete resume file if exists
    if (user.resumeUrl) {
      const filePath = path.join(__dirname, "..", user.resumeUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear resume data from user
    user.resumeUrl = null;
    user.resumeData = null;
    user.resumeUploadedAt = null;

    await user.save();

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
      success: true,
      message: "Resume deleted successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting resume",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  updateUser,
  deleteUser,
  getProfile,
  updateOwnProfile,
  uploadResume,
  deleteResume,
};
