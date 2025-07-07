const config = {
  // Database Configuration
  database: {
    uri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/manufacturing_ops",
    dbName: process.env.MONGODB_DB_NAME || "manufacturing_ops",
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key-here",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // AI Service Configuration
  aiService: {
    url: process.env.AI_SERVICE_URL || "http://localhost:5001",
    port: process.env.PYTHON_SERVICE_PORT || 5001,
  },

  // File Storage
  fileStorage: {
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  // Security
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

module.exports = config;
