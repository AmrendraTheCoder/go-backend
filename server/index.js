const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const config = require("./config");
const dbConnection = require("./database/connection");
const SocketHandler = require("./socket/socketHandler");
const RealtimeService = require("./services/realtimeService");
const RealtimeEventHandlers = require("./services/realtimeEventHandlers");

const app = express();
const server = http.createServer(app);

// Socket.io setup with enhanced configuration
const io = socketIo(server, {
  cors: {
    origin:
      config.server.nodeEnv === "development"
        ? [
            /^http:\/\/localhost:\d+$/,
            /^http:\/\/127\.0\.0\.1:\d+$/,
            /^http:\/\/0\.0\.0\.0:\d+$/,
          ]
        : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Initialize comprehensive socket handler, realtime service, and event handlers
const socketHandler = new SocketHandler(io);
const realtimeService = new RealtimeService(socketHandler);
const realtimeEventHandlers = new RealtimeEventHandlers(socketHandler);

// Database connection will be established in startServer function

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - disabled in development
if (config.server.nodeEnv !== "development") {
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api/", limiter);
}

// CORS configuration
app.use(
  cors({
    origin:
      config.server.nodeEnv === "development"
        ? function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // Allow all localhost, 127.0.0.1, and 0.0.0.0 with any port in development
            if (
              origin.match(/^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+$/)
            ) {
              return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"), false);
          }
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(morgan(config.logging.level === "development" ? "combined" : "common"));

// Serve static files for testing (development only)
if (config.server.nodeEnv === "development") {
  app.use(express.static("test"));
}

// Make socket handler, realtime service, and event handlers available to routes
app.use((req, res, next) => {
  req.io = io;
  req.socketHandler = socketHandler;
  req.realtimeService = realtimeService;
  req.realtimeEvents = realtimeEventHandlers;
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/papertypes", require("./routes/papertypes"));
app.use("/api/realtime", require("./routes/realtime-test"));

// API Info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Manufacturing Operations API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      users: "/api/users",
      jobs: "/api/jobs",
      inventory: "/api/inventory",
      customers: "/api/customers",
      papertypes: "/api/papertypes",
    },
    realtime: {
      socketio: true,
      events: [
        "job-created",
        "job-status-updated",
        "job-progress-updated",
        "inventory-update",
        "quality-check-added",
      ],
    },
  });
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbHealth = await dbConnection.healthCheck();
    const stats = await dbConnection.getStats();

    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      database: dbHealth,
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      error: error.message,
    });
  }
});

// Dashboard stats endpoint
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const stats = await dbConnection.getStats();

    // Get basic counts for dashboard
    const dashboardStats = {
      totalJobs: stats.jobs || 0,
      totalCustomers: stats.customers || 0,
      totalInventoryItems: stats.inventory || 0,
      totalUsers: stats.users || 0,
      totalPaperTypes: stats.paperTypes || 0,
      activeJobs: 0, // Could be enhanced to get actual active jobs count
      pendingJobs: 0, // Could be enhanced to get actual pending jobs count
      completedJobs: 0, // Could be enhanced to get actual completed jobs count
      lowStockItems: 0, // Could be enhanced to get actual low stock count
      timestamp: new Date().toISOString(),
      serverStatus: "OK",
    };

    res.status(200).json(dashboardStats);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get dashboard statistics",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Socket.io statistics endpoint for admin dashboard
app.get("/api/socket/stats", (req, res) => {
  try {
    const connectedUsers = socketHandler.getConnectedUsersInfo();
    const roomStats = socketHandler.getRoomStats();

    res.json({
      connectedUsers,
      roomStats,
      totalConnections: connectedUsers.length,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get socket statistics",
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      config.server.nodeEnv === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Server startup function
const startServer = async () => {
  const PORT = config.server.port;

  try {
    // Attempt to connect to database
    let dbConnected = false;
    try {
      await dbConnection.connect();
      await dbConnection.seedDatabase();
      const stats = await dbConnection.getStats();
      console.log("📊 Database Statistics:", stats);
      dbConnected = true;
    } catch (dbError) {
      console.warn(
        "⚠️  Warning: Database connection failed, but server will continue:"
      );
      console.warn("   ", dbError.message);
      console.log("🔧 The server will run without database functionality");
      console.log(
        "💡 To fix: Start MongoDB or provide a valid MONGODB_URI environment variable"
      );
    }

    // Start the server regardless of database connection status
    server.listen(PORT, () => {
      console.log(`🚀 Manufacturing Operations Server running on port ${PORT}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(
        `🔗 Database: ${dbConnected ? "✅ Connected" : "❌ Not Connected"} - ${
          config.database.url
        }`
      );
      console.log(`🏥 Health check at: http://localhost:${PORT}/health`);
      console.log(`📋 API endpoints at: http://localhost:${PORT}/api/`);
      console.log(`🧪 Socket Test: http://localhost:${PORT}/socket-test.html`);
      console.log(`📊 Socket Stats: http://localhost:${PORT}/api/socket/stats`);

      if (dbConnected) {
        console.log("✅ Server fully operational with database");
      } else {
        console.log("⚠️  Server running in limited mode (no database)");
        console.log("🔧 Real-time Socket.io features are still available");
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
