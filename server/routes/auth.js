const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const config = require("../config");
const {
  authenticate,
  requireRole,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

// Rate limiting for auth endpoints - disabled in development
const authLimiter =
  config.server.nodeEnv === "development"
    ? (req, res, next) => next() // No rate limiting in development
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        message: {
          error:
            "Too many authentication attempts from this IP, please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: 15 * 60, // seconds
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

// Validation rules
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Username must be 3-30 characters and contain only letters, numbers, and underscores"
    ),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must be at least 6 characters with uppercase, lowercase, and number"
    ),
  body("firstName")
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage("First name is required and must be less than 50 characters"),
  body("lastName")
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage("Last name is required and must be less than 50 characters"),
  body("role")
    .isIn([
      "admin",
      "manager",
      "operator",
      "machine_worker",
      "stock_manager",
      "quality_checker",
    ])
    .withMessage("Invalid role specified"),
];

const loginValidation = [
  body("username").notEmpty().withMessage("Username is required").trim(),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must be at least 6 characters with uppercase, lowercase, and number"
    ),
];

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
// @access  Private (Admin)
router.post(
  "/register",
  authLimiter,
  authenticate,
  requireRole("admin"),
  registerValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const {
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        department,
        shift,
        assignedArea,
        phone,
        permissions,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.email === email
              ? "Email already registered"
              : "Username already taken",
          code: "USER_EXISTS",
          field: existingUser.email === email ? "email" : "username",
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        department,
        shift,
        assignedArea,
        phone,
        permissions: permissions || [],
        createdBy: req.user._id,
      });

      await user.save();

      // Return user data without password
      const userResponse = await User.findById(user._id).select("-password");

      res.status(201).json({
        message: "User registered successfully",
        user: userResponse,
        code: "USER_CREATED",
      });

      console.log(`New user registered: ${username} by ${req.user.username}`);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Error creating user",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "REGISTRATION_ERROR",
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", authLimiter, loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
        code: "VALIDATION_ERROR",
      });
    }

    const { username, password, rememberMe } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).populate("assignedMachines", "name machineId currentStatus");

    console.log("🔍 Login attempt:", { username, userFound: !!user });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    console.log("👤 User found:", {
      id: user._id,
      username: user.username,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      isActive: user.isActive,
    });

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: "Account is deactivated. Please contact administrator.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Check password
    console.log("🔐 Comparing password...");
    const isMatch = await user.comparePassword(password);
    console.log("🔐 Password match result:", isMatch);

    if (!isMatch) {
      // Log failed attempt
      if (!user.loginAttempts) user.loginAttempts = [];
      user.loginAttempts.push({
        success: false,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      await user.save();

      return res.status(401).json({
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Generate token
    const tokenExpiry = rememberMe ? "30d" : config.auth.jwtExpiresIn;
    const token = user.generateAuthToken(tokenExpiry);

    // Update user login info
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    if (!user.loginAttempts) user.loginAttempts = [];
    user.loginAttempts.push({
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Keep only last 10 login attempts
    if (user.loginAttempts.length > 10) {
      user.loginAttempts = user.loginAttempts.slice(-10);
    }

    await user.save();

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.tokenBlacklist;
    delete userResponse.loginAttempts;

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
      expiresIn: tokenExpiry,
      code: "LOGIN_SUCCESS",
    });

    console.log(`✅ User logged in: ${user.username} from ${req.ip}`);
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      message: "Error during login",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "LOGIN_ERROR",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (blacklist token)
// @access  Private
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Add current token to blacklist
    if (!req.user.tokenBlacklist) {
      req.user.tokenBlacklist = [];
    }

    req.user.tokenBlacklist.push(req.token);

    // Keep only last 5 blacklisted tokens to prevent database bloat
    if (req.user.tokenBlacklist.length > 5) {
      req.user.tokenBlacklist = req.user.tokenBlacklist.slice(-5);
    }

    await req.user.save();

    res.json({
      message: "Logged out successfully",
      code: "LOGOUT_SUCCESS",
    });

    console.log(`User logged out: ${req.user.username}`);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Error during logout",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "LOGOUT_ERROR",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -tokenBlacklist -loginAttempts")
      .populate("assignedMachines", "name machineId currentStatus location");

    res.json({
      message: "Profile retrieved successfully",
      user,
      code: "PROFILE_SUCCESS",
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({
      message: "Error retrieving profile",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "PROFILE_ERROR",
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  authenticate,
  [
    body("firstName").optional().isLength({ min: 1, max: 50 }).trim(),
    body("lastName").optional().isLength({ min: 1, max: 50 }).trim(),
    body("phone").optional().isMobilePhone(),
    body("email").optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const { firstName, lastName, phone, email } = req.body;
      const updateFields = {};

      if (firstName) updateFields.firstName = firstName;
      if (lastName) updateFields.lastName = lastName;
      if (phone) updateFields.phone = phone;
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({
          email,
          _id: { $ne: req.user._id },
        });

        if (existingUser) {
          return res.status(400).json({
            message: "Email already registered to another user",
            code: "EMAIL_EXISTS",
          });
        }

        updateFields.email = email;
        updateFields.emailVerified = false; // Require re-verification
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateFields,
        { new: true, runValidators: true }
      ).select("-password -tokenBlacklist -loginAttempts");

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
        code: "PROFILE_UPDATED",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        message: "Error updating profile",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PROFILE_UPDATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id);

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        message: "Password changed successfully",
        code: "PASSWORD_CHANGED",
      });

      console.log(`Password changed for user: ${user.username}`);
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        message: "Error changing password",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PASSWORD_CHANGE_ERROR",
      });
    }
  }
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post("/refresh-token", authenticate, async (req, res) => {
  try {
    // Generate new token
    const token = req.user.generateAuthToken();

    // Add old token to blacklist
    if (!req.user.tokenBlacklist) {
      req.user.tokenBlacklist = [];
    }
    req.user.tokenBlacklist.push(req.token);

    // Keep only last 5 blacklisted tokens
    if (req.user.tokenBlacklist.length > 5) {
      req.user.tokenBlacklist = req.user.tokenBlacklist.slice(-5);
    }

    await req.user.save();

    res.json({
      message: "Token refreshed successfully",
      token,
      expiresIn: config.auth.jwtExpiresIn,
      code: "TOKEN_REFRESHED",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      message: "Error refreshing token",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "TOKEN_REFRESH_ERROR",
    });
  }
});

// @route   GET /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.get("/verify-token", authenticate, (req, res) => {
  res.json({
    message: "Token is valid",
    user: {
      _id: req.user._id,
      username: req.user.username,
      role: req.user.role,
      isActive: req.user.isActive,
    },
    code: "TOKEN_VALID",
  });
});

// @route   GET /api/auth/permissions
// @desc    Get user permissions and role info
// @access  Private
router.get("/permissions", authenticate, (req, res) => {
  res.json({
    message: "Permissions retrieved successfully",
    permissions: {
      role: req.user.role,
      permissions: req.user.permissions,
      assignedMachines: req.user.assignedMachines,
      assignedArea: req.user.assignedArea,
      department: req.user.department,
      shift: req.user.shift,
    },
    code: "PERMISSIONS_SUCCESS",
  });
});

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices (invalidate all tokens)
// @access  Private
router.post("/logout-all", authenticate, async (req, res) => {
  try {
    // This would require a more sophisticated token management system
    // For now, we'll just clear the blacklist and update a field that
    // would be checked during token verification
    req.user.tokenBlacklist = [];
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();

    res.json({
      message: "Logged out from all devices successfully",
      code: "LOGOUT_ALL_SUCCESS",
    });

    console.log(`User logged out from all devices: ${req.user.username}`);
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      message: "Error logging out from all devices",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "LOGOUT_ALL_ERROR",
    });
  }
});

// @route   POST /api/auth/test-token
// @desc    Generate test JWT token (for development/testing only)
// @access  Public (Development only)
router.post("/test-token", async (req, res) => {
  try {
    // Only allow in development environment
    if (config.server.nodeEnv !== "development") {
      return res.status(403).json({
        message: "Test tokens only available in development environment",
        code: "NOT_ALLOWED",
      });
    }

    const {
      role = "admin",
      username = "test_user",
      expiresIn = "24h",
    } = req.body;

    // Generate a proper ObjectId for testing
    const mongoose = require("mongoose");
    const testUserId = new mongoose.Types.ObjectId();

    // Create a test payload
    const payload = {
      userId: testUserId.toString(),
      username: username,
      role: role,
      permissions: role === "admin" ? ["all"] : ["read"],
      assignedArea: role === "machine_worker" ? "machine_1" : "admin_office",
    };

    // Generate token using the same method as real auth
    const token = jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn,
    });

    res.json({
      message: "Test JWT token generated successfully",
      token,
      payload,
      expiresIn,
      usage: {
        header: "Authorization: Bearer " + token,
        curl: `curl -H "Authorization: Bearer ${token}" http://localhost:${config.server.port}/api/auth/test-verify`,
      },
      note: "This token can be used for API testing but user lookup will fail since no real user exists with this ID",
      code: "TEST_TOKEN_GENERATED",
    });

    console.log(
      `Test JWT token generated for role: ${role}, userId: ${testUserId}`
    );
  } catch (error) {
    console.error("Test token generation error:", error);
    res.status(500).json({
      message: "Error generating test token",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "TEST_TOKEN_ERROR",
    });
  }
});

// @route   GET /api/auth/test-verify
// @desc    Test JWT token verification (for development/testing only)
// @access  Public (Development only)
router.get("/test-verify", async (req, res) => {
  try {
    // Only allow in development environment
    if (config.server.nodeEnv !== "development") {
      return res.status(403).json({
        message: "Test verification only available in development environment",
        code: "NOT_ALLOWED",
      });
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
        code: "NO_TOKEN",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    res.json({
      message: "Token verification successful",
      decoded,
      tokenValid: true,
      note: "This endpoint only verifies the token structure, not user existence",
      code: "TOKEN_VALID",
    });
  } catch (error) {
    res.status(401).json({
      message: "Token verification failed",
      error: error.message,
      code: "TOKEN_INVALID",
    });
  }
});

// @route   GET /api/auth/debug-users
// @desc    Debug endpoint to check what users exist (TEMPORARY)
// @access  Public (for debugging only)
router.get("/debug-users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("username email role isActive")
      .limit(10);

    res.json({
      message: "Debug: Users in database",
      count: users.length,
      users: users,
      code: "DEBUG_USERS",
    });
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message,
      code: "DEBUG_ERROR",
    });
  }
});

// @route   GET /api/auth/debug-password
// @desc    Debug endpoint to check password hashing (TEMPORARY)
// @access  Public (for debugging only)
router.get("/debug-password/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.json({
        message: "User not found",
        username,
        code: "USER_NOT_FOUND",
      });
    }

    // Test password comparison
    const testPassword = "admin123";
    const isMatch = await user.comparePassword(testPassword);

    res.json({
      message: "Debug: Password info",
      username: user.username,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordPrefix: user.password
        ? user.password.substring(0, 10) + "..."
        : null,
      testPasswordResult: isMatch,
      testPassword: testPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      code: "DEBUG_PASSWORD",
    });
  } catch (error) {
    console.error("Debug password error:", error);
    res.status(500).json({
      message: "Error checking password",
      error: error.message,
      code: "DEBUG_ERROR",
    });
  }
});

// @route   POST /api/auth/reseed-users
// @desc    Clear and re-seed users with proper password hashing (TEMPORARY)
// @access  Public (for debugging only)
router.post("/reseed-users", async (req, res) => {
  try {
    const dbConnection = require("../database/connection");

    // Clear existing users
    await User.deleteMany({});
    console.log("🗑️ Cleared existing users");

    // Re-seed with proper hashing
    const users = await dbConnection.seedUsers();

    res.json({
      message: "Users re-seeded successfully",
      count: users.length,
      users: users.map((u) => ({ username: u.username, role: u.role })),
      code: "RESEED_SUCCESS",
    });
  } catch (error) {
    console.error("Reseed users error:", error);
    res.status(500).json({
      message: "Error re-seeding users",
      error: error.message,
      code: "RESEED_ERROR",
    });
  }
});

// @route   POST /api/auth/seed-customers
// @desc    Seed customers if none exist
// @access  Public (for debugging only)
router.post("/seed-customers", async (req, res) => {
  try {
    const dbConnection = require("../database/connection");
    const Customer = require("../models/Customer");

    const count = await Customer.countDocuments();
    if (count > 0) {
      return res.json({
        message: "Customers already exist",
        count,
        code: "CUSTOMERS_EXIST",
      });
    }

    const customers = await dbConnection.seedCustomers();

    res.json({
      message: "Customers seeded successfully",
      count: customers.length,
      customers: customers.map((c) => ({
        code: c.customerCode,
        name: c.partyName,
      })),
      code: "SEED_SUCCESS",
    });
  } catch (error) {
    console.error("Seed customers error:", error);
    res.status(500).json({
      message: "Error seeding customers",
      error: error.message,
      code: "SEED_ERROR",
    });
  }
});

// @route   POST /api/auth/seed-papertypes
// @desc    Seed paper types if none exist
// @access  Public (for debugging only)
router.post("/seed-papertypes", async (req, res) => {
  try {
    const dbConnection = require("../database/connection");
    const PaperType = require("../models/PaperType");

    const count = await PaperType.countDocuments();
    if (count > 0) {
      return res.json({
        message: "Paper types already exist",
        count,
        code: "PAPERTYPES_EXIST",
      });
    }

    const paperTypes = await dbConnection.seedPaperTypes();

    res.json({
      message: "Paper types seeded successfully",
      count: paperTypes.length,
      paperTypes: paperTypes.map((p) => ({
        name: p.name,
        category: p.category,
      })),
      code: "SEED_SUCCESS",
    });
  } catch (error) {
    console.error("Seed paper types error:", error);
    res.status(500).json({
      message: "Error seeding paper types",
      error: error.message,
      code: "SEED_ERROR",
    });
  }
});

// @route   POST /api/auth/seed-machines
// @desc    Seed machines if none exist
// @access  Public (for debugging only)
router.post("/seed-machines", async (req, res) => {
  try {
    const dbConnection = require("../database/connection");
    const Machine = require("../models/Machine");

    const count = await Machine.countDocuments();
    if (count > 0) {
      return res.json({
        message: "Machines already exist",
        count,
        code: "MACHINES_EXIST",
      });
    }

    const machines = await dbConnection.seedMachines();

    res.json({
      message: "Machines seeded successfully",
      count: machines.length,
      machines: machines.map((m) => ({ id: m.machineId, name: m.name })),
      code: "SEED_SUCCESS",
    });
  } catch (error) {
    console.error("Seed machines error:", error);
    res.status(500).json({
      message: "Error seeding machines",
      error: error.message,
      code: "SEED_ERROR",
    });
  }
});

// @route   POST /api/auth/seed-all
// @desc    Trigger complete database seeding
// @access  Public (for debugging only)
router.post("/seed-all", async (req, res) => {
  try {
    const dbConnection = require("../database/connection");

    await dbConnection.seedDatabase();
    const stats = await dbConnection.getStats();

    res.json({
      message: "Database seeding completed",
      statistics: stats,
      code: "SEED_ALL_SUCCESS",
    });
  } catch (error) {
    console.error("Seed all error:", error);
    res.status(500).json({
      message: "Error seeding database",
      error: error.message,
      code: "SEED_ALL_ERROR",
    });
  }
});

module.exports = router;
