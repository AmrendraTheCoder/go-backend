const express = require("express");
const { body, validationResult, query } = require("express-validator");
const User = require("../models/User");
const Machine = require("../models/Machine");
const config = require("../config");
const {
  authenticate,
  requireRole,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin/Manager)
router.get(
  "/",
  authenticate,
  requireRole("admin", "manager"),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("role")
      .optional()
      .isIn([
        "admin",
        "manager",
        "operator",
        "machine_worker",
        "stock_manager",
        "quality_checker",
      ]),
    query("department").optional().isLength({ min: 1 }),
    query("isActive").optional().isBoolean(),
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

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.department)
        filter.department = new RegExp(req.query.department, "i");
      if (req.query.isActive !== undefined)
        filter.isActive = req.query.isActive === "true";
      if (req.query.search) {
        filter.$or = [
          { firstName: new RegExp(req.query.search, "i") },
          { lastName: new RegExp(req.query.search, "i") },
          { username: new RegExp(req.query.search, "i") },
          { email: new RegExp(req.query.search, "i") },
        ];
      }

      // Get users with pagination
      const users = await User.find(filter)
        .select("-password -tokenBlacklist -loginAttempts")
        .populate("assignedMachines", "name machineId currentStatus")
        .populate("createdBy", "firstName lastName username")
        .populate("lastModifiedBy", "firstName lastName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        message: "Users retrieved successfully",
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        code: "USERS_SUCCESS",
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        message: "Error retrieving users",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "USERS_ERROR",
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Manager or own profile)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can access this profile
    const canAccess =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      req.user._id.toString() === id;

    if (!canAccess) {
      return res.status(403).json({
        message: "Access denied. You can only view your own profile.",
        code: "ACCESS_DENIED",
      });
    }

    const user = await User.findById(id)
      .select("-password -tokenBlacklist")
      .populate("assignedMachines", "name machineId currentStatus location")
      .populate("createdBy", "firstName lastName username")
      .populate("lastModifiedBy", "firstName lastName username");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Hide sensitive data for non-admin users viewing their own profile
    if (req.user.role !== "admin" && req.user._id.toString() === id) {
      user.loginAttempts = undefined;
    }

    res.json({
      message: "User retrieved successfully",
      user,
      code: "USER_SUCCESS",
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      message: "Error retrieving user",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "USER_ERROR",
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put(
  "/:id",
  authenticate,
  requireRole("admin"),
  [
    body("firstName").optional().isLength({ min: 1, max: 50 }).trim(),
    body("lastName").optional().isLength({ min: 1, max: 50 }).trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("role")
      .optional()
      .isIn([
        "admin",
        "manager",
        "operator",
        "machine_worker",
        "stock_manager",
        "quality_checker",
      ]),
    body("department").optional().isLength({ min: 1 }),
    body("shift").optional().isIn(["morning", "afternoon", "night"]),
    body("assignedArea").optional().isLength({ min: 1 }),
    body("phone").optional().isMobilePhone(),
    body("isActive").optional().isBoolean(),
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

      const { id } = req.params;
      const updates = { ...req.body };

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Check if email is already taken by another user
      if (updates.email) {
        const emailUser = await User.findOne({
          email: updates.email,
          _id: { $ne: id },
        });

        if (emailUser) {
          return res.status(400).json({
            message: "Email already registered to another user",
            code: "EMAIL_EXISTS",
          });
        }

        updates.emailVerified = false; // Require re-verification
      }

      // Add audit fields
      updates.lastModifiedBy = req.user._id;

      // Update user
      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).select("-password -tokenBlacklist -loginAttempts");

      res.json({
        message: "User updated successfully",
        user: updatedUser,
        code: "USER_UPDATED",
      });

      console.log(
        `User updated: ${updatedUser.username} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        message: "Error updating user",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "USER_UPDATE_ERROR",
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Deactivate user (soft delete)
// @access  Private (Admin only)
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: "Cannot deactivate your own account",
        code: "SELF_DEACTIVATION_ERROR",
      });
    }

    // Soft delete by setting isActive to false
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        isActive: false,
        lastModifiedBy: req.user._id,
      },
      { new: true }
    ).select("-password -tokenBlacklist -loginAttempts");

    res.json({
      message: "User deactivated successfully",
      user: updatedUser,
      code: "USER_DEACTIVATED",
    });

    console.log(
      `User deactivated: ${updatedUser.username} by ${req.user.username}`
    );
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      message: "Error deactivating user",
      error:
        config.server.nodeEnv === "development"
          ? error.message
          : "Internal server error",
      code: "USER_DEACTIVATE_ERROR",
    });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Reactivate user
// @access  Private (Admin only)
router.put(
  "/:id/activate",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          isActive: true,
          lastModifiedBy: req.user._id,
        },
        { new: true }
      ).select("-password -tokenBlacklist -loginAttempts");

      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.json({
        message: "User activated successfully",
        user: updatedUser,
        code: "USER_ACTIVATED",
      });

      console.log(
        `User activated: ${updatedUser.username} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Activate user error:", error);
      res.status(500).json({
        message: "Error activating user",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "USER_ACTIVATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.put(
  "/:id/reset-password",
  authenticate,
  requireRole("admin"),
  [
    body("newPassword")
      .isLength({ min: 6 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must be at least 6 characters with uppercase, lowercase, and number"
      ),
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

      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Update password
      user.password = newPassword;
      user.lastModifiedBy = req.user._id;
      user.tokenBlacklist = []; // Clear all existing tokens
      user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all existing tokens
      await user.save();

      res.json({
        message: "Password reset successfully",
        code: "PASSWORD_RESET",
      });

      console.log(
        `Password reset for user: ${user.username} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        message: "Error resetting password",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PASSWORD_RESET_ERROR",
      });
    }
  }
);

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private (Admin only)
router.put(
  "/:id/permissions",
  authenticate,
  requireRole("admin"),
  [
    body("permissions").isArray().withMessage("Permissions must be an array"),
    body("permissions.*.module")
      .isLength({ min: 1 })
      .withMessage("Module is required"),
    body("permissions.*.actions")
      .isArray()
      .withMessage("Actions must be an array"),
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

      const { id } = req.params;
      const { permissions } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          permissions,
          lastModifiedBy: req.user._id,
        },
        { new: true, runValidators: true }
      ).select("-password -tokenBlacklist -loginAttempts");

      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.json({
        message: "User permissions updated successfully",
        user: updatedUser,
        code: "PERMISSIONS_UPDATED",
      });

      console.log(
        `Permissions updated for user: ${updatedUser.username} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Update permissions error:", error);
      res.status(500).json({
        message: "Error updating permissions",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "PERMISSIONS_UPDATE_ERROR",
      });
    }
  }
);

// @route   PUT /api/users/:id/assign-machines
// @desc    Assign machines to user
// @access  Private (Admin/Manager)
router.put(
  "/:id/assign-machines",
  authenticate,
  requireRole("admin", "manager"),
  [
    body("machineIds").isArray().withMessage("Machine IDs must be an array"),
    body("machineIds.*").isMongoId().withMessage("Invalid machine ID"),
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

      const { id } = req.params;
      const { machineIds } = req.body;

      // Check if all machines exist
      const machines = await Machine.find({
        _id: { $in: machineIds },
        isActive: true,
      });
      if (machines.length !== machineIds.length) {
        return res.status(400).json({
          message: "One or more machines not found or inactive",
          code: "MACHINES_NOT_FOUND",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          assignedMachines: machineIds,
          lastModifiedBy: req.user._id,
        },
        { new: true, runValidators: true }
      )
        .select("-password -tokenBlacklist -loginAttempts")
        .populate("assignedMachines", "name machineId currentStatus location");

      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.json({
        message: "Machines assigned successfully",
        user: updatedUser,
        code: "MACHINES_ASSIGNED",
      });

      console.log(
        `Machines assigned to user: ${updatedUser.username} by ${req.user.username}`
      );
    } catch (error) {
      console.error("Assign machines error:", error);
      res.status(500).json({
        message: "Error assigning machines",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "MACHINE_ASSIGNMENT_ERROR",
      });
    }
  }
);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin/Manager)
router.get(
  "/stats/overview",
  authenticate,
  requireRole("admin", "manager"),
  async (req, res) => {
    try {
      const stats = {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        inactive: await User.countDocuments({ isActive: false }),
        byRole: {},
        byDepartment: {},
        byShift: {},
        recentLogins: await User.find({
          lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).countDocuments(),
      };

      // Get role distribution
      const roleStats = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);
      roleStats.forEach((stat) => {
        stats.byRole[stat._id] = stat.count;
      });

      // Get department distribution
      const deptStats = await User.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
      ]);
      deptStats.forEach((stat) => {
        stats.byDepartment[stat._id || "unassigned"] = stat.count;
      });

      // Get shift distribution
      const shiftStats = await User.aggregate([
        { $group: { _id: "$shift", count: { $sum: 1 } } },
      ]);
      shiftStats.forEach((stat) => {
        stats.byShift[stat._id || "unassigned"] = stat.count;
      });

      res.json({
        message: "User statistics retrieved successfully",
        stats,
        code: "STATS_SUCCESS",
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({
        message: "Error retrieving user statistics",
        error:
          config.server.nodeEnv === "development"
            ? error.message
            : "Internal server error",
        code: "STATS_ERROR",
      });
    }
  }
);

module.exports = router;
