const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Personal Information
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 15,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },

    // Role and Access Control
    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "operator",
        "machine_worker",
        "stock_manager",
        "quality_inspector",
      ],
      required: true,
      index: true,
    },
    permissions: [
      {
        module: {
          type: String,
          enum: [
            "jobs",
            "inventory",
            "machines",
            "users",
            "reports",
            "pricing",
            "quality",
            "analytics",
          ],
        },
        actions: [
          {
            type: String,
            enum: ["create", "read", "update", "delete", "approve", "reject"],
          },
        ],
      },
    ],

    // Work Information
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      enum: [
        "production",
        "quality",
        "inventory",
        "administration",
        "maintenance",
      ],
      index: true,
    },
    position: {
      type: String,
      trim: true,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      index: true,
    },

    // Assigned Resources
    assignedMachines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Machine",
      },
    ],
    assignedArea: {
      type: String,
      enum: [
        "machine_1",
        "machine_2",
        "stock_area",
        "quality_lab",
        "admin_office",
      ],
    },

    // Status and Activity
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Security and Authentication
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        deviceInfo: String,
      },
    ],
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    loginAttempts: [
      {
        success: { type: Boolean, required: true },
        timestamp: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
      },
    ],
    tokenBlacklist: [String],
    accountLockedUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Preferences and Settings
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "Asia/Kolkata" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      dashboard: {
        widgets: [String],
        layout: String,
      },
    },

    // Performance and Analytics
    performance: {
      jobsCompleted: { type: Number, default: 0 },
      averageCompletionTime: Number, // in minutes
      qualityScore: { type: Number, min: 0, max: 100 },
      efficiency: { type: Number, min: 0, max: 100 },
      lastEvaluation: Date,
    },

    // Audit and Compliance
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Training and Certifications
    training: [
      {
        name: String,
        completedDate: Date,
        expiryDate: Date,
        certificateUrl: String,
        isValid: { type: Boolean, default: true },
      },
    ],

    // Notes and Comments
    notes: String,
    avatar: String, // URL to avatar image
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.passwordResetToken;
        delete ret.emailVerificationToken;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ department: 1, shift: 1 });
userSchema.index({ assignedArea: 1 });
userSchema.index({ lastActivity: -1 });
userSchema.index({ "performance.qualityScore": -1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

// Virtual for display name with role
userSchema.virtual("displayName").get(function () {
  return `${this.fullName} (${this.role})`;
});

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Auto-generate employee ID if new user
  if (this.isNew && !this.employeeId) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, "0")}`;
  }

  // Update lastActivity
  if (this.isModified() && !this.isNew) {
    this.lastActivity = new Date();
  }

  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT tokens
userSchema.methods.generateTokens = function () {
  const payload = {
    userId: this._id,
    username: this.username,
    role: this.role,
    permissions: this.permissions,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Instance method to generate auth token (for backward compatibility)
userSchema.methods.generateAuthToken = function (expiresIn = "24h") {
  const payload = {
    userId: this._id,
    username: this.username,
    role: this.role,
    permissions: this.permissions,
    assignedArea: this.assignedArea,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || require("../config").auth.jwtSecret,
    {
      expiresIn,
    }
  );
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function (token, deviceInfo) {
  this.refreshTokens.push({
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    deviceInfo,
  });

  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  return this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
  return this.save();
};

// Instance method to increment failed login attempts
userSchema.methods.incrementLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { failedLoginAttempts: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // If we have reached max attempts and it's not locked already, lock it
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { accountLockedUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { failedLoginAttempts: 1, accountLockedUntil: 1 },
  });
};

// Instance method to check permissions
userSchema.methods.hasPermission = function (module, action) {
  // Admin has all permissions
  if (this.role === "admin") return true;

  const permission = this.permissions.find((p) => p.module === module);
  return permission && permission.actions.includes(action);
};

// Instance method to update performance metrics
userSchema.methods.updatePerformance = function (metrics) {
  this.performance = { ...this.performance, ...metrics };
  this.performance.lastEvaluation = new Date();
  return this.save();
};

// Static method to get users by role
userSchema.statics.getUsersByRole = function (role) {
  return this.find({ role, isActive: true }).sort({ firstName: 1 });
};

// Static method to get online users
userSchema.statics.getOnlineUsers = function () {
  return this.find({ isOnline: true, isActive: true })
    .select("username fullName role assignedArea lastActivity")
    .sort({ lastActivity: -1 });
};

// Static method to get users by department
userSchema.statics.getUsersByDepartment = function (department) {
  return this.find({ department, isActive: true })
    .select("username fullName role shift assignedMachines")
    .populate("assignedMachines", "name status")
    .sort({ firstName: 1 });
};

// Static method to search users
userSchema.statics.searchUsers = function (searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { username: { $regex: searchTerm, $options: "i" } },
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { employeeId: { $regex: searchTerm, $options: "i" } },
        ],
      },
    ],
  }).select("-password -refreshTokens");
};

module.exports = mongoose.model("User", userSchema);
