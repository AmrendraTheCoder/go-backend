const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config");

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    // Check if token follows Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message:
          "Access denied. Invalid token format. Expected: Bearer <token>",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // Get user from database
    const user = await User.findById(decoded.userId)
      .select("-password")
      .populate("assignedMachines", "name machineId currentStatus");

    if (!user) {
      return res.status(401).json({
        message: "Access denied. User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "Access denied. User account is deactivated.",
        code: "USER_DEACTIVATED",
      });
    }

    // Check if token is blacklisted (if user was logged out)
    if (user.tokenBlacklist && user.tokenBlacklist.includes(token)) {
      return res.status(401).json({
        message: "Access denied. Token has been invalidated.",
        code: "TOKEN_INVALIDATED",
      });
    }

    // Update last activity
    user.lastActivity = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Access denied. Invalid token.",
        code: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access denied. Token has expired.",
        code: "TOKEN_EXPIRED",
        expiredAt: error.expiredAt,
      });
    }

    console.error("Token verification error:", error);
    res.status(500).json({
      message: "Internal server error during authentication.",
      code: "AUTH_ERROR",
    });
  }
};

// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Access denied. Authentication required.",
        code: "AUTH_REQUIRED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(
          " or "
        )}. Your role: ${req.user.role}`,
        code: "INSUFFICIENT_ROLE",
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

// Check if user has specific permission
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Access denied. Authentication required.",
        code: "AUTH_REQUIRED",
      });
    }

    // Admin always has all permissions
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user has the specific permission
    const hasPermission = req.user.permissions.some(
      (perm) => perm.module === module && perm.actions.includes(action)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${action} on ${module}`,
        code: "INSUFFICIENT_PERMISSION",
        required: { module, action },
        userPermissions: req.user.permissions,
      });
    }

    next();
  };
};

// Check if user can access specific machine
const requireMachineAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Access denied. Authentication required.",
      code: "AUTH_REQUIRED",
    });
  }

  // Admin and managers can access all machines
  if (["admin", "manager"].includes(req.user.role)) {
    return next();
  }

  const { machineId } = req.params;

  if (!machineId) {
    return res.status(400).json({
      message: "Machine ID is required.",
      code: "MACHINE_ID_REQUIRED",
    });
  }

  // Check if user is assigned to this machine
  const hasAccess = req.user.assignedMachines.some(
    (machine) =>
      machine.machineId === machineId || machine._id.toString() === machineId
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: `Access denied. You are not assigned to machine: ${machineId}`,
      code: "MACHINE_ACCESS_DENIED",
      machineId,
      assignedMachines: req.user.assignedMachines.map((m) => m.machineId),
    });
  }

  next();
};

// Check if user can access specific area/department
const requireAreaAccess = (area) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Access denied. Authentication required.",
        code: "AUTH_REQUIRED",
      });
    }

    // Admin can access all areas
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user is assigned to this area
    if (req.user.assignedArea !== area) {
      return res.status(403).json({
        message: `Access denied. Required area: ${area}. Your area: ${req.user.assignedArea}`,
        code: "AREA_ACCESS_DENIED",
        required: area,
        current: req.user.assignedArea,
      });
    }

    next();
  };
};

// Middleware to check if user is active during their shift
const requireActiveShift = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Access denied. Authentication required.",
      code: "AUTH_REQUIRED",
    });
  }

  // Admin and managers can access anytime
  if (["admin", "manager"].includes(req.user.role)) {
    return next();
  }

  const now = new Date();
  const currentHour = now.getHours();

  // Define shift hours
  const shifts = {
    morning: { start: 6, end: 14 }, // 6 AM to 2 PM
    afternoon: { start: 14, end: 22 }, // 2 PM to 10 PM
    night: { start: 22, end: 6 }, // 10 PM to 6 AM (next day)
  };

  const userShift = shifts[req.user.shift];

  if (!userShift) {
    return next(); // If no shift defined, allow access
  }

  let isInShift = false;

  if (userShift.start < userShift.end) {
    // Normal shift (doesn't cross midnight)
    isInShift = currentHour >= userShift.start && currentHour < userShift.end;
  } else {
    // Night shift (crosses midnight)
    isInShift = currentHour >= userShift.start || currentHour < userShift.end;
  }

  if (!isInShift) {
    return res.status(403).json({
      message: `Access denied. Outside of your shift hours. Your shift: ${req.user.shift} (${userShift.start}:00 - ${userShift.end}:00)`,
      code: "OUTSIDE_SHIFT_HOURS",
      userShift: req.user.shift,
      shiftHours: userShift,
      currentHour,
    });
  }

  next();
};

// Middleware to log all authentication attempts
const logAuthAttempt = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Log authentication results
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userId: req.user ? req.user._id : null,
      username: req.user ? req.user.username : null,
    };

    // Only log auth-related endpoints or failures
    if (req.url.includes("/auth") || res.statusCode >= 400) {
      console.log("Auth attempt:", JSON.stringify(logData));
    }

    originalSend.call(this, data);
  };

  next();
};

// Optional middleware to refresh token if near expiry
const refreshTokenIfNeeded = async (req, res, next) => {
  if (!req.user || !req.token) {
    return next();
  }

  try {
    const decoded = jwt.decode(req.token);
    const now = Date.now() / 1000;
    const timeUntilExpiry = decoded.exp - now;

    // If token expires in less than 1 hour, provide a new one
    if (timeUntilExpiry < 3600) {
      const newToken = req.user.generateAuthToken();
      res.set("X-New-Token", newToken);
    }
  } catch (error) {
    // Ignore errors in token refresh
    console.log("Token refresh check failed:", error.message);
  }

  next();
};

// Combine commonly used middlewares
const authenticate = [verifyToken, logAuthAttempt, refreshTokenIfNeeded];

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  requireMachineAccess,
  requireAreaAccess,
  requireActiveShift,
  logAuthAttempt,
  refreshTokenIfNeeded,
  authenticate,
};
