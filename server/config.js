const config = {
  // Database Configuration
  database: {
    url:
      process.env.MONGODB_URI ||
      "mongodb+srv://admin:MhkmJ53HjEIGbHIz@cluster0.wfdxpev.mongodb.net/ganpathi_manufacturing?retryWrites=true&w=majority",
    dbName: process.env.MONGODB_DB_NAME || "ganpathi_manufacturing",
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5002,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // Authentication
  auth: {
    jwtSecret:
      process.env.JWT_SECRET ||
      "2bb054f55bda55a605ab3f5c401b9514275840f09e9582ace4698911f1859e56fed1336917e5a185839fab359eb471b5a032fad08be42f715019455ec501688f",
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
